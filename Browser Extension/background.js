// background.js
// V5: Handle server list updates from popup.

// --- 初始化 & 狀態管理 ---

async function getStorage() {
    const result = await chrome.storage.local.get(['credentials', 'proxyState', 'settings']);
    return {
        credentials: result.credentials || {},
        proxyState: result.proxyState || { proxyOn: false, servers: [], selectedServerId: 'auto' },
        settings: result.settings || { mode: 'auto', bypassList: [] }
    };
}

// 動態更新插件圖示 (使用 PNG)
async function updateIcon(isOn) {
    const iconPath = isOn ? 'icons/icon-on.png' : 'icons/icon-off.png';
    try {
        await chrome.action.setIcon({
            path: { "16": iconPath, "32": iconPath }
        });
    } catch (e) { /* 忽略可能的錯誤 */ }
}

// 更新代理設定
async function applyProxySettings() {
    const { credentials, proxyState, settings } = await getStorage();
    const isLoggedIn = credentials && credentials.email;
    const isProxyOn = proxyState.proxyOn && isLoggedIn;

    await updateIcon(isProxyOn);

    if (!isProxyOn) {
        await chrome.proxy.settings.set({ value: { mode: 'direct' }, scope: 'regular' });
        console.log('代理已關閉或未登入。');
        return;
    }

    let targetServer = null;
    if (proxyState.selectedServerId === 'auto' && proxyState.servers.length > 0) {
        targetServer = proxyState.servers[0];
    } else {
        const [host, port] = (proxyState.selectedServerId || '').split(':');
        targetServer = proxyState.servers.find(s => s.host === host && s.port == port);
    }

    if (!targetServer) {
        console.error('找不到目標伺服器，關閉代理。');
        await chrome.proxy.settings.set({ value: { mode: 'direct' }, scope: 'regular' });
        return;
    }

    const pacScript = generatePacScript(targetServer, settings);
    const config = {
        mode: 'pac_script',
        pacScript: { data: pacScript }
    };

    try {
        await chrome.proxy.settings.set({ value: config, scope: 'regular' });
        console.log('代理已開啟，模式: ' + settings.mode + ', 伺服器: ' + targetServer.name);
    } catch (error) {
        console.error("設定代理時發生錯誤:", error);
        await chrome.proxy.settings.set({ value: { mode: 'direct' }, scope: 'regular' });
        await updateIcon(false);
    }
}

// 生成 PAC (Proxy Auto-Config) 腳本
function generatePacScript(server, settings) {
    const proxyString = 'SOCKS5 ' + server.host + ':' + server.port;
    const bypassListJson = JSON.stringify(settings.bypassList || []);
    const mode = settings.mode || 'auto';

    var script = 'function FindProxyForURL(url, host) {\n'
               + '    var bypassList = ' + bypassListJson + ';\n'
               + '    var mode = "' + mode + '";\n'
               + '    for (var i = 0; i < bypassList.length; i++) {\n'
               + '        if (shExpMatch(host, bypassList[i])) {\n'
               + '            if (mode === "whitelist") { return "DIRECT"; }\n'
               + '        }\n'
               + '    }\n'
               + '    if (mode === "whitelist") { return "' + proxyString + '"; }\n'
               + '    if (mode === "blacklist") {\n'
               + '        for (var j = 0; j < bypassList.length; j++) {\n'
               + '            if (shExpMatch(host, bypassList[j])) { return "' + proxyString + '"; }\n'
               + '        }\n'
               + '        return "DIRECT";\n'
               + '    }\n'
               + '    return "' + proxyString + '";\n'
               + '}';
    return script;
}

// --- 事件監聽 ---
chrome.runtime.onInstalled.addListener(() => applyProxySettings());
chrome.runtime.onStartup.addListener(() => applyProxySettings());

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
        let { proxyState } = await getStorage();
        switch (message.type) {
            case 'TOGGLE_PROXY':
                proxyState.proxyOn = !proxyState.proxyOn;
                await chrome.storage.local.set({ proxyState });
                break;
            case 'SET_SERVER':
                proxyState.selectedServerId = message.serverId;
                await chrome.storage.local.set({ proxyState });
                break;
            case 'SAVE_SETTINGS':
                await chrome.storage.local.set({ settings: message.settings });
                break;
            case 'LOGOUT':
                await chrome.storage.local.remove(['credentials', 'proxyState', 'settings']);
                break;
            // [新增] 處理來自 popup 的伺服器列表更新請求
            case 'UPDATE_SERVER_LIST':
                proxyState.servers = message.servers;
                await chrome.storage.local.set({ proxyState });
                break;
            case 'STATE_CHANGED':
                break;
        }
        await applyProxySettings();
        const updatedState = (await getStorage()).proxyState;
        chrome.runtime.sendMessage({ type: 'STATE_UPDATED', state: updatedState }).catch(() => {});
        sendResponse({ success: true });
    })();
    return true;
});

chrome.webRequest.onAuthRequired.addListener(
    (details, callback) => {
        (async () => {
            const { credentials } = await getStorage();
            if (credentials.email && credentials.password) {
                callback({ authCredentials: { username: credentials.email, password: credentials.password } });
            } else {
                callback();
            }
        })();
        return true;
    },
    { urls: ["<all_urls>"] },
    ['asyncBlocking']
);
