// proxy-server.js
// V3: Control API listens on 0.0.0.0 to accept remote commands.

require('dotenv').config();
const socks5 = require('node-socks5-server');
const axios = require('axios');
const http = require('http');

// --- 從 .env 讀取設定 ---
const {
    MAIN_SERVER_URL, NODE_SECRET_KEY, NODE_PUBLIC_HOST,
    NODE_GROUP_NAME, INITIAL_NODE_PORTS, CONTROL_PORT
} = process.env;

if (!MAIN_SERVER_URL || !NODE_SECRET_KEY || !NODE_PUBLIC_HOST || !NODE_GROUP_NAME || !CONTROL_PORT) {
    console.error("錯誤：.env 檔案中的設定不完整。");
    process.exit(1);
}

// --- 全域變數，用於管理運行的代理服務 ---
const runningProxies = new Map(); // { port => serverInstance }

// --- 與主伺服器通訊的 API 客戶端 ---
const mainApiClient = axios.create({
    baseURL: MAIN_SERVER_URL,
    headers: { 'Content-Type': 'application/json', 'x-node-secret': NODE_SECRET_KEY }
});

// --- SOCKS5 使用者驗證邏輯 ---
const authenticateSocksUser = async (username, password, callback) => {
    try {
        const response = await mainApiClient.post('/api/internal/auth', { username, password });
        callback(response.data.success);
    } catch (error) {
        console.error("向主伺服器驗證用戶時發生錯誤:", error.message);
        callback(false);
    }
};

// --- 代理節點控制函數 ---
function startProxy(port, name) {
    if (runningProxies.has(port)) {
        console.log(`端口 ${port} 的代理服務已在運行。`);
        return false;
    }
    const proxyServer = socks5.createServer({ authenticate: authenticateSocksUser });
    proxyServer.listen(port, '0.0.0.0', () => {
        runningProxies.set(port, proxyServer);
        console.log(`代理節點 [${name || port}] 已啟動，監聽於 0.0.0.0:${port}`);
    });
    proxyServer.on('error', (err) => console.error(`端口 ${port} 的代理服務發生錯誤:`, err));
    return true;
}

function stopProxy(port) {
    const server = runningProxies.get(port);
    if (server) {
        server.close();
        runningProxies.delete(port);
        console.log(`端口 ${port} 的代理服務已停止。`);
        return true;
    }
    return false;
}

// --- 接收遠端指令的控制 API ---
const controlApiServer = http.createServer(async (req, res) => {
    if (req.headers['x-node-secret'] !== NODE_SECRET_KEY) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: 'Forbidden' }));
    }

    if (req.method === 'POST' && req.url === '/control') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const { command, port, name } = JSON.parse(body);
                let result = false;
                if (command === 'start') {
                    result = startProxy(port, name);
                } else if (command === 'stop') {
                    result = stopProxy(port);
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: result }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Invalid request body' }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Not Found' }));
    }
});

// --- 節點向主伺服器註冊與心跳 ---
async function reportStatusToMainServer() {
    console.log('正在向主伺服器報告狀態...');
    try {
        const activePorts = Array.from(runningProxies.keys());
        await mainApiClient.post('/api/internal/status_report', {
            groupName: NODE_GROUP_NAME,
            publicHost: NODE_PUBLIC_HOST,
            controlPort: parseInt(CONTROL_PORT),
            activePorts: activePorts
        });
        console.log('狀態報告成功。');
        return true;
    } catch (error) {
        console.error("狀態報告失敗:", error.response ? error.response.data : error.message);
        return false;
    }
}

// --- 主程式啟動流程 ---
async function main() {
    console.log(`--- Chun Proxy 節點 [${NODE_GROUP_NAME}] 正在啟動 ---`);

    // 1. 啟動預設的代理端口
    const initialPorts = (INITIAL_NODE_PORTS || '').split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
    initialPorts.forEach(port => startProxy(port, `預設節點 ${port}`));

    // 2. 啟動控制 API 伺服器
    // [修正] 監聽 0.0.0.0 來接受外部指令
    controlApiServer.listen(CONTROL_PORT, '0.0.0.0', () => {
        console.log(`控制 API 已啟動，監聽於 0.0.0.0:${CONTROL_PORT}`);
    });

    // 3. 立即向主伺服器報告一次狀態，並設定定時回報
    await reportStatusToMainServer();
    setInterval(reportStatusToMainServer, 60 * 1000); // 每 60 秒報告一次
}

main();
