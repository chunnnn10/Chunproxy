// popup.js
// V3: Silently refresh server list on open.

// --- DOM 元素 ---
const views = {
    login: document.getElementById('login-view'),
    main: document.getElementById('main-view'),
    settings: document.getElementById('settings-view')
};
const backendUrl = 'https://這裏要改哦.site';

// 登入畫面元素
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');

// 主畫面元素
const powerBtn = document.getElementById('power-btn');
const connectionStatus = document.getElementById('connection-status');
const locationSelector = document.getElementById('location-selector');
const selectedLocationName = document.getElementById('selected-location-name');
const locationList = document.getElementById('location-list');
const settingsBtn = document.getElementById('settings-btn');
const logoutBtn = document.getElementById('logout-btn');

// 設定畫面元素
const backToMainBtn = document.getElementById('back-to-main-btn');
const proxyModeSelect = document.getElementById('proxy-mode');
const bypassListTextarea = document.getElementById('bypass-list');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const settingsSavedMsg = document.getElementById('settings-saved-msg');

// --- 函數 ---

function switchView(viewName) {
    Object.values(views).forEach(view => view.classList.add('hidden'));
    if (views[viewName]) views[viewName].classList.remove('hidden');
}

function updateMainUI(state) {
    if (state.proxyOn) {
        powerBtn.classList.add('on');
        powerBtn.classList.remove('off');
        connectionStatus.textContent = '連線已開啟';
    } else {
        powerBtn.classList.add('off');
        powerBtn.classList.remove('on');
        connectionStatus.textContent = '連線已關閉';
    }

    locationList.innerHTML = '';
    const servers = state.servers || [];
    
    const autoOption = document.createElement('li');
    autoOption.textContent = '自動選擇 (推薦)';
    autoOption.dataset.serverId = 'auto';
    locationList.appendChild(autoOption);

    servers.forEach(server => {
        const li = document.createElement('li');
        li.textContent = server.name;
        li.dataset.serverId = `${server.host}:${server.port}`;
        locationList.appendChild(li);
    });

    let selectedServerName = '自動選擇 (推薦)';
    if (state.selectedServerId && state.selectedServerId !== 'auto') {
        const [host, port] = state.selectedServerId.split(':');
        const selectedServer = servers.find(s => s.host === host && s.port == port);
        if (selectedServer) selectedServerName = selectedServer.name;
    }
    selectedLocationName.textContent = selectedServerName;
}

function updateSettingsUI(settings) {
    proxyModeSelect.value = settings.mode || 'auto';
    bypassListTextarea.value = (settings.bypassList || []).join('\n');
}

// [新增] 靜默刷新伺服器列表的函數
async function refreshServerList() {
    try {
        // 因為插件的 host_permissions，這個 fetch 會自動帶上 cookie，實現 session 驗證
        const response = await fetch(`${backendUrl}/api/servers`);
        if (!response.ok) return; // 如果未登入或出錯，則靜默失敗
        const data = await response.json();
        if (data.servers) {
            // 將最新的列表發送給 background script 進行儲存
            chrome.runtime.sendMessage({ type: 'UPDATE_SERVER_LIST', servers: data.servers });
        }
    } catch (error) {
        console.log("無法刷新伺服器列表:", error);
    }
}


// --- 事件監聽 ---

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['credentials', 'proxyState', 'settings'], (result) => {
        if (result.credentials && result.credentials.email) {
            switchView('main');
            updateMainUI(result.proxyState || {});
            updateSettingsUI(result.settings || {});
            // [改進] 每次打開 popup 時都嘗試刷新列表
            refreshServerList();
        } else {
            switchView('login');
        }
    });
});

loginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
        loginError.textContent = '請輸入電子郵箱和密碼。';
        return;
    }
    loginBtn.disabled = true;
    loginBtn.textContent = '登入中...';
    loginError.textContent = '';

    try {
        const response = await fetch(`${backendUrl}/api/validate-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '登入失敗');

        const credentials = { email, password };
        const initialState = {
            proxyOn: false,
            servers: data.servers,
            selectedServerId: 'auto'
        };
        const initialSettings = {
            mode: 'auto',
            bypassList: ['localhost', '127.0.0.1', '<local>']
        };
        
        await chrome.storage.local.set({ credentials, proxyState: initialState, settings: initialSettings });
        
        chrome.runtime.sendMessage({ type: 'STATE_CHANGED' }, () => {
            switchView('main');
            updateMainUI(initialState);
            updateSettingsUI(initialSettings);
        });

    } catch (error) {
        loginError.textContent = error.message;
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = '登入';
    }
});

powerBtn.addEventListener('click', () => chrome.runtime.sendMessage({ type: 'TOGGLE_PROXY' }));
logoutBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'LOGOUT' }, () => {
        switchView('login');
        emailInput.value = '';
        passwordInput.value = '';
    });
});

locationSelector.addEventListener('click', (e) => {
    if (e.target.closest('.selected-location')) {
        locationSelector.classList.toggle('open');
    }
    if (e.target.tagName === 'LI') {
        const serverId = e.target.dataset.serverId;
        chrome.runtime.sendMessage({ type: 'SET_SERVER', serverId });
        locationSelector.classList.remove('open');
    }
});

settingsBtn.addEventListener('click', () => switchView('settings'));
backToMainBtn.addEventListener('click', () => switchView('main'));

saveSettingsBtn.addEventListener('click', () => {
    const settings = {
        mode: proxyModeSelect.value,
        bypassList: bypassListTextarea.value.split('\n').map(s => s.trim()).filter(Boolean)
    };
    chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings }, () => {
        settingsSavedMsg.textContent = '設定已儲存！';
        setTimeout(() => { settingsSavedMsg.textContent = ''; }, 2000);
    });
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'STATE_UPDATED') {
        updateMainUI(message.state);
    }
});
