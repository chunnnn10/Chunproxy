// main-server.js
// V11: Add a dedicated API endpoint for plugins to refresh the server list.

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const moment = require('moment');

const app = express();
const PORT = process.env.PORT || 3000;

// --- 資料庫設定 ---
const dbPath = path.join(__dirname, 'proxy_users.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error("無法連接到資料庫:", err.message);
    console.log("成功連接到 SQLite 資料庫。");
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, is_verified INTEGER DEFAULT 0, verification_token TEXT)`);
        db.run(`CREATE TABLE IF NOT EXISTS connection_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE)`);
        db.run(`CREATE TABLE IF NOT EXISTS remote_nodes (groupName TEXT PRIMARY KEY, publicHost TEXT NOT NULL, controlPort INTEGER NOT NULL, activePorts TEXT, lastHeartbeat TEXT)`);
    });
});

// --- Express 中介軟體設定 ---
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true }
}));

// --- Nodemailer 設定 ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS,
    },
});
transporter.verify((error) => {
    if (error) console.error("Gmail SMTP 設定錯誤:", error);
    else console.log("Gmail SMTP 已準備就緒。");
});


// --- Admin 路由 ---
const requireAdmin = (req, res, next) => {
    if (req.session && req.session.isAdmin) return next();
    res.redirect('/admin/login');
};
app.get('/admin/login', (req, res) => res.render('admin/login', { error: null }));
app.post('/admin/login', (req, res) => {
    if (req.body.username === process.env.ADMIN_USER && req.body.password === process.env.ADMIN_PASS) {
        req.session.isAdmin = true;
        res.redirect('/admin/dashboard');
    } else {
        res.render('admin/login', { error: '無效的使用者名稱或密碼' });
    }
});
app.get('/admin/logout', (req, res) => req.session.destroy(() => res.redirect('/admin/login')));
app.get('/admin/dashboard', requireAdmin, (req, res) => res.render('admin/dashboard'));


// --- 內部 API (供 Proxy 節點使用) ---
const verifyNodeSecret = (req, res, next) => {
    if (req.headers['x-node-secret'] === process.env.NODE_SECRET_KEY) return next();
    res.status(403).json({ success: false, message: 'Forbidden: Invalid Node Secret' });
};

app.post('/api/internal/auth', verifyNodeSecret, async (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [username], async (err, user) => {
        const isValid = !err && user && user.is_verified && await bcrypt.compare(password, user.password_hash);
        res.json({ success: !!isValid });
    });
});

app.post('/api/internal/status_report', verifyNodeSecret, (req, res) => {
    const { groupName, publicHost, controlPort, activePorts } = req.body;
    const now_utc = new Date().toISOString();
    const sql = `INSERT INTO remote_nodes (groupName, publicHost, controlPort, activePorts, lastHeartbeat)
                 VALUES (?, ?, ?, ?, ?)
                 ON CONFLICT(groupName) DO UPDATE SET
                    publicHost = excluded.publicHost,
                    controlPort = excluded.controlPort,
                    activePorts = excluded.activePorts,
                    lastHeartbeat = excluded.lastHeartbeat`;
    db.run(sql, [groupName, publicHost, controlPort, JSON.stringify(activePorts), now_utc], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true });
    });
});


// --- Admin API (供 Admin 後台使用) ---
app.get('/api/admin/node_groups', requireAdmin, (req, res) => {
    db.all('SELECT * FROM remote_nodes', (err, rows) => {
        if (err) return res.status(500).json([]);
        const groups = (rows || []).map(row => ({
            ...row,
            activePorts: JSON.parse(row.activePorts || '[]')
        }));
        res.json(groups);
    });
});

app.post('/api/admin/control_node', requireAdmin, async (req, res) => {
    const { groupName, command, port } = req.body;
    db.get('SELECT publicHost, controlPort FROM remote_nodes WHERE groupName = ?', [groupName], async (err, node) => {
        if (err || !node) return res.status(404).json({ success: false, message: 'Node group not found' });
        try {
            const url = `http://${node.publicHost}:${node.controlPort}/control`;
            console.log(`正在向 ${url} 發送指令...`);
            await axios.post(url, 
                { command, port, name: `遠端啟動 ${port}` },
                { headers: { 'x-node-secret': process.env.NODE_SECRET_KEY }, timeout: 5000 }
            );
            res.json({ success: true });
        } catch (error) {
            let errorMessage = 'Failed to send command to node.';
            if (error.code === 'ENOTFOUND') {
                errorMessage = `DNS 查詢失敗: 找不到主機 ${error.hostname}。請檢查 DNS 設定。`;
            } else if (error.code === 'ECONNREFUSED') {
                errorMessage = `連線被拒: 請確認節點上的控制 API (端口 ${node.controlPort}) 已啟動且防火牆已開啟。`;
            }
            console.error(`向節點 ${groupName} 發送指令失敗: ${errorMessage}`);
            res.status(500).json({ success: false, message: errorMessage });
        }
    });
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
    db.all('SELECT id, email, is_verified FROM users', (err, rows) => {
        if (err) return res.status(500).json([]);
        res.json(rows || []);
    });
});

app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
    db.run('DELETE FROM users WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.sendStatus(204);
    });
});


// --- 一般使用者路由 ---
const requireLogin = (req, res, next) => {
    if (req.session && req.session.user) return next();
    res.redirect('/login');
};

app.get('/', (req, res) => res.render('index'));
app.get('/register', (req, res) => res.render('register', { error: null }));
app.post('/register', async (req, res) => {
    const { email, password, confirmPassword, secretAnswer } = req.body;
    if (password !== confirmPassword) return res.render('register', { error: '兩次輸入的密碼不一致！' });
    if (secretAnswer !== process.env.SECRET_ANSWER) return res.render('register', { error: '驗證問題的答案不正確！' });
    try {
        const existingUser = await new Promise((resolve, reject) => db.get('SELECT email FROM users WHERE email = ?', [email], (err, row) => err ? reject(err) : resolve(row)));
        if (existingUser) return res.render('register', { error: '這個電子郵箱已經被註冊了。' });
        const password_hash = await bcrypt.hash(password, 10);
        const verification_token = uuidv4();
        db.run('INSERT INTO users (email, password_hash, verification_token) VALUES (?, ?, ?)', [email, password_hash, verification_token], async function (err) {
            if (err) return res.render('register', { error: '註冊失敗，請稍後再試。' });
            const verificationLink = `http://${process.env.PUBLIC_HOSTNAME || req.hostname}/verify?token=${verification_token}`;
            const emailHtml = await ejs.renderFile(path.join(__dirname, 'views/partials/email-template.ejs'), { verificationLink });
            await transporter.sendMail({ from: `"ChunProxy 服務" <${process.env.GMAIL_USER}>`, to: email, subject: '【ChunProxy】請驗證您的電子郵箱地址', html: emailHtml });
            res.render('message', { title: '註冊成功！', message: '一封驗證郵件已發送到您的郵箱，請點擊信中連結以啟用帳號。', link: null });
        });
    } catch (err) {
        console.error("註冊過程中發生錯誤:", err);
        res.render('register', { error: '伺服器發生內部錯誤。' });
    }
});
app.get('/verify', (req, res) => {
    const { token } = req.query;
    db.run('UPDATE users SET is_verified = 1, verification_token = NULL WHERE verification_token = ?', [token], function(err) {
        if (err || this.changes === 0) return res.render('message', { title: '驗證失敗', message: '無效的驗證連結，或帳號已被啟用。', link: { href: '/register', text: '重新註冊' } });
        res.render('message', { title: '驗證成功！', message: '您的帳號已成功啟用。', link: { href: '/login', text: '前往登入' } });
    });
});
app.get('/login', (req, res) => res.render('login', { error: null }));
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err || !user || !await bcrypt.compare(password, user.password_hash)) return res.render('login', { error: '無效的使用者名稱或密碼。' });
        if (user.is_verified === 0) return res.render('login', { error: '您的帳號尚未通過郵箱驗證。' });
        req.session.user = { id: user.id, email: user.email };
        res.redirect('/dashboard');
    });
});
app.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/')));
app.get('/download/ChunProxy.zip', requireLogin, (req, res) => {
    const filePath = path.join(__dirname, 'ChunProxy.zip');
    res.download(filePath, (err) => {
        if (err) res.status(404).send("找不到檔案 ChunProxy.zip，請確認已將其放置在專案根目錄。");
    });
});
app.get('/dashboard', requireLogin, (req, res) => {
    db.all('SELECT groupName, publicHost, activePorts FROM remote_nodes WHERE lastHeartbeat > datetime("now", "-90 seconds")', (err, nodes) => {
        let servers = [];
        if (nodes) {
            nodes.forEach(node => {
                const activePorts = JSON.parse(node.activePorts || '[]');
                activePorts.forEach(port => {
                    servers.push({ name: `${node.groupName} - ${port}`, host: node.publicHost, port: port });
                });
            });
        }
        res.render('dashboard', { email: req.session.user.email, servers: servers });
    });
});

// --- 使用者 API ---
app.post('/api/validate-login', async (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err || !user || !await bcrypt.compare(password, user.password_hash) || user.is_verified === 0) {
            return res.status(401).json({ error: '驗證失敗' });
        }
        db.all('SELECT groupName, publicHost, activePorts FROM remote_nodes WHERE lastHeartbeat > datetime("now", "-90 seconds")', (err, nodes) => {
            let servers = [];
            if (nodes) {
                nodes.forEach(node => {
                    const activePorts = JSON.parse(node.activePorts || '[]');
                    activePorts.forEach(port => {
                        servers.push({ id: `${node.publicHost}:${port}`, name: `${node.groupName} - ${port}`, host: node.publicHost, port: port });
                    });
                });
            }
            res.json({ message: '登入成功', servers: servers });
        });
    });
});

// [新增] 供插件刷新伺服器列表的專用 API
app.get('/api/servers', requireLogin, (req, res) => {
    db.all('SELECT groupName, publicHost, activePorts FROM remote_nodes WHERE lastHeartbeat > datetime("now", "-90 seconds")', (err, nodes) => {
        if (err) return res.status(500).json({ servers: [] });
        let servers = [];
        if (nodes) {
            nodes.forEach(node => {
                const activePorts = JSON.parse(node.activePorts || '[]');
                activePorts.forEach(port => {
                    servers.push({ id: `${node.publicHost}:${port}`, name: `${node.groupName} - ${port}`, host: node.publicHost, port: port });
                });
            });
        }
        res.json({ servers: servers });
    });
});

app.get('/api/connections', requireLogin, (req, res) => {
    db.all('SELECT timestamp FROM connection_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 20', [req.session.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows || []);
    });
});
app.get('/api/stats', requireLogin, async (req, res) => {
    const userId = req.session.user.id;
    try {
        const todayStart = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const todayPromise = new Promise((resolve, reject) => db.get('SELECT COUNT(*) as count FROM connection_logs WHERE user_id = ? AND timestamp >= ?', [userId, todayStart], (err, row) => err ? reject(err) : resolve(row.count)));
        const totalPromise = new Promise((resolve, reject) => db.get('SELECT COUNT(*) as count FROM connection_logs WHERE user_id = ?', [userId], (err, row) => err ? reject(err) : resolve(row.count)));
        const lastSeenPromise = new Promise((resolve, reject) => db.get('SELECT timestamp FROM connection_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1', [userId], (err, row) => err ? reject(err) : resolve(row ? row.timestamp : null)));
        const [todayConnections, totalConnections, lastSeen] = await Promise.all([todayPromise, totalPromise, lastSeenPromise]);
        res.json({ todayConnections, totalConnections, lastSeen });
    } catch (err) {
        console.error("獲取統計數據時出錯:", err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- 啟動 Web 伺服器 ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`主伺服器 (控制面板) 已啟動，運行在 http://localhost:${PORT}`);
});
