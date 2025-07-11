# Chun Proxy System

<p align="center">
  <img src="https://placehold.co/600x300/2c3e50/ffffff?text=Chun+Proxy&font=raleway" alt="Chun Proxy 橫幅">
</p>

<p align="center">
  一個功能強大、可集中管理的個人化分散式代理系統。
  <br>
  <br>
  <a href="#-cantonese-version"><strong>粵語</strong></a>
  ·
  <a href="#-traditional-chinese-version"><strong>繁體中文</strong></a>
  ·
  <a href="#-simplified-chinese-version"><strong>简体中文</strong></a>
  ·
  <a href="#-english-version"><strong>English</strong></a>
</p>

---

## 🇭🇰 粵語 (Cantonese Version)

### 🚀 關於 Chun Proxy

Chun Proxy 唔係一個普通嘅代理工具，而係一套完整嘅全端解決方案，專為需要高度私隱同靈活性嘅個人或小團隊而設。佢包含一個中央控制面板、可以部署喺世界各地嘅輕量級代理節點、同埋一個功能齊全嘅瀏覽器插件。

呢個項目嘅核心理念係「**集中管理，分散服務**」。你可以透過一個靚仔嘅網頁 Admin 後台，實時監控同遙控所有代理節點，而你嘅朋友就可以透過簡單易用嘅插件，享受你提供嘅穩定代理服務。

### ✨ 主要功能

* **👑 Admin 控制面板**: 提供一個網頁版嘅中央控制台，用嚟管理成個系統。
* **🌍 分散式節點管理**:
    * 喺後台實時監控所有代理節點（Node）嘅「在線/離線」狀態。
    * 透過 API 遙距啟動或停止任何一部伺服器上嘅指定代理端口。
    * 節點會定時向主伺服器發送「心跳」，自動報告狀態。
* **👤 用戶系統**:
    * 完整嘅用戶註冊、登入同 Email 驗證流程。
    * Admin 後台可以集中管理所有用戶。
* **🧩 瀏覽器插件 (Chrome/Edge)**:
    * 提供登入、一鍵開關代理、以及動態選擇伺服器節點嘅功能。
    * 插件會自動從主伺服器獲取最新嘅可用節點列表。
    * 支援白名單/黑名單模式，實現更精細嘅代理規則。
* **🔐 安全設計**:
    * Admin 後台同內部 API 均受密鑰保護。
    * 用戶密碼使用 bcrypt 加密儲存。

### 🏗️ 系統架構

成個系統由三個核心部分組成，佢哋之間透過 API 緊密合作：

1.  **主伺服器 (Main Server / Control Panel)**: 系統嘅大腦，負責處理用戶同 Admin 嘅請求，以及向代理節點發出指令。
2.  **代理節點 (Proxy Node)**: 系統嘅工人，可以部署喺世界任何地方。佢負責提供 SOCKS5 代理服務，並定時向主伺服器匯報自己嘅狀態。
3.  **瀏覽器插件 (Browser Extension)**: 用戶嘅客戶端，負責同用戶互動，並根據用戶設定去使用指定嘅代理節點。


[用戶] <--> [瀏覽器插件] <--> [代理節點 (e.g., 德國)]
^
| (用戶驗證)
|
[Admin] <--> [主伺服器] <------> [代理節點 (e.g., 德國)]
(控制指令)         (心跳報告)


### 🛠️ 技術棧 (Tech Stack)

* **後端**: Node.js, Express.js
* **資料庫**: SQLite
* **代理服務**: SOCKS5
* **前端**: HTML, CSS, JavaScript (無框架)
* **部署**: Docker

### 🔧 安裝同部署

本項目採用 Monorepo 結構，包含三個主要部分：`main-server`, `proxy-node`, `browser-extension`。

#### 1. 主伺服器 (Main Server)

* **部署位置**: 你嘅主伺服器 (e.g., `chun-proxy.archun.site`)
* **步驟**:
    1.  將 `main-server` 資料夾入面嘅所有檔案上傳到你嘅伺服器。
    2.  建立 `.env` 檔案，並填寫所有必要嘅變數（參考 `env.example`）。
    3.  執行 `npm install` 安裝依賴。
    4.  執行 `npm start` 啟動服務。
    5.  確保你嘅防火牆已經開放 Web 服務所需嘅端口 (e.g., 3000)。

#### 2. 代理節點 (Proxy Node)

* **部署位置**: 任何你想用嚟做代理嘅伺服器 (e.g., 德國、香港)。
* **步驟**:
    1.  將 `proxy-node` 資料夾入面嘅所有檔案上傳到代理伺服器。
    2.  建立 `.env` 檔案，填寫呢個節點嘅設定，特別係 `MAIN_SERVER_URL` 同 `NODE_SECRET_KEY` (必須同主伺服器一致)。
    3.  執行 `npm install` 安裝依賴。
    4.  執行 `npm start` 啟動服務。
    5.  確保你嘅防火牆已經開放呢個節點嘅代理端口 (e.g., 1080, 1081) 同控制端口 (e.g., 9999)。

#### 3. 瀏覽器插件 (Browser Extension)

* **安裝方式**: 手動載入
* **步驟**:
    1.  喺 Chrome/Edge 瀏覽器打開 `chrome://extensions`。
    2.  啟用右上角嘅「開發人員模式」。
    3.  點擊「載入未封裝的項目」，然後選擇 `browser-extension` 呢個資料夾。
    4.  插件圖示會出現喺工具列上。

---

## 🇹🇼 繁體中文 (Traditional Chinese Version)

### 🚀 關於 Chun Proxy

Chun Proxy 並非一個普通的代理工具，而是一套完整的全端解決方案，專為需要高度隱私與靈活性的個人或小型團隊設計。它包含一個中央控制面板、可部署於世界各地的輕量級代理節點、以及一個功能齊全的瀏覽器擴充功能。

本專案的核心理念是「**集中管理，分散服務**」。您可以透過一個美觀的網頁 Admin 後台，即時監控並遙控所有代理節點，而您的朋友則可透過簡單易用的擴充功能，享受您提供的穩定代理服務。

### ✨ 主要功能

* **👑 Admin 控制面板**: 提供一個網頁版的中央控制台，用於管理整個系統。
* **🌍 分散式節點管理**:
    * 在後台即時監控所有代理節點（Node）的「在線/離線」狀態。
    * 透過 API 遠端啟動或停止任何一部伺服器上的指定代理連接埠。
    * 節點會定時向主伺服器發送「心跳」，自動報告狀態。
* **👤 使用者系統**:
    * 完整的使用者註冊、登入與 Email 驗證流程。
    * Admin 後台可集中管理所有使用者。
* **🧩 瀏覽器擴充功能 (Chrome/Edge)**:
    * 提供登入、一鍵開關代理、以及動態選擇伺服器節點的功能。
    * 擴充功能會自動從主伺服器獲取最新的可用節點列表。
    * 支援白名單/黑名單模式，實現更精細的代理規則。
* **🔐 安全設計**:
    * Admin 後台與內部 API 均受密鑰保護。
    * 使用者密碼使用 bcrypt 加密儲存。

### 🏗️ 系統架構

整個系統由三個核心部分組成，它們之間透過 API 緊密合作：

1.  **主伺服器 (Main Server / Control Panel)**: 系統的大腦，負責處理使用者與 Admin 的請求，以及向代理節點發出指令。
2.  **代理節點 (Proxy Node)**: 系統的工人，可部署於世界任何地方。它負責提供 SOCKS5 代理服務，並定時向主伺服器回報自己的狀態。
3.  **瀏覽器擴充功能 (Browser Extension)**: 使用者的客戶端，負責與使用者互動，並根據使用者設定去使用指定的代理節點。


[使用者] <--> [瀏覽器擴充功能] <--> [代理節點 (e.g., 德國)]
^
| (使用者驗證)
|
[Admin] <--> [主伺服器] <------> [代理節點 (e.g., 德國)]
(控制指令)         (心跳報告)


### 🛠️ 技術棧 (Tech Stack)

* **後端**: Node.js, Express.js
* **資料庫**: SQLite
* **代理服務**: SOCKS5
* **前端**: HTML, CSS, JavaScript (無框架)
* **部署**: Docker

### 🔧 安裝與部署

本專案採用 Monorepo 結構，包含三個主要部分：`main-server`, `proxy-node`, `browser-extension`。

#### 1. 主伺服器 (Main Server)

* **部署位置**: 您的主伺服器 (e.g., `chun-proxy.archun.site`)
* **步驟**:
    1.  將 `main-server` 資料夾內的所有檔案上傳至您的伺服器。
    2.  建立 `.env` 檔案，並填寫所有必要的變數（參考 `env.example`）。
    3.  執行 `npm install` 安裝依賴。
    4.  執行 `npm start` 啟動服務。
    5.  確保您的防火牆已開放 Web 服務所需的連接埠 (e.g., 3000)。

#### 2. 代理節點 (Proxy Node)

* **部署位置**: 任何您想用作代理的伺服器 (e.g., 德國、香港)。
* **步驟**:
    1.  將 `proxy-node` 資料夾內的所有檔案上傳至代理伺服器。
    2.  建立 `.env` 檔案，填寫此節點的設定，特別是 `MAIN_SERVER_URL` 與 `NODE_SECRET_KEY` (必須與主伺服器一致)。
    3.  執行 `npm install` 安裝依賴。
    4.  執行 `npm start` 啟動服務。
    5.  確保您的防火牆已開放此節點的代理連接埠 (e.g., 1080, 1081) 與控制連接埠 (e.g., 9999)。

#### 3. 瀏覽器擴充功能 (Browser Extension)

* **安裝方式**: 手動載入
* **步驟**:
    1.  在 Chrome/Edge 瀏覽器中開啟 `chrome://extensions`。
    2.  啟用右上角的「開發人員模式」。
    3.  點擊「載入未封裝的項目」，然後選擇 `browser-extension` 這個資料夾。
    4.  擴充功能圖示會出現在工具列上。

---

## 🇨🇳 简体中文 (Simplified Chinese Version)

### 🚀 关于 Chun Proxy

Chun Proxy 并非一个普通的代理工具，而是一套完整的全栈解决方案，专为需要高度隐私与灵活性的个人或小型团队设计。它包含一个中央控制面板、可部署于世界各地的轻量级代理节点、以及一个功能齐全的浏览器扩展。

本项目的核心理念是「**集中管理，分散服务**」。您可以通过一个美观的网页 Admin 后台，实时监控并遥控所有代理节点，而您的朋友则可通过简单易用的扩展，享受您提供的稳定代理服务。

### ✨ 主要功能

* **👑 Admin 控制面板**: 提供一个网页版的中央控制台，用于管理整个系统。
* **🌍 分布式节点管理**:
    * 在后台实时监控所有代理节点（Node）的“在线/离线”状态。
    * 通过 API 远程启动或停止任何一台服务器上的指定代理端口。
    * 节点会定时向主服务器发送“心跳”，自动报告状态。
* **👤 用户系统**:
    * 完整的用户注册、登录与 Email 验证流程。
    * Admin 后台可集中管理所有用户。
* **🧩 浏览器扩展 (Chrome/Edge)**:
    * 提供登录、一键开关代理、以及动态选择服务器节点的功能。
    * 扩展会自动从主服务器获取最新的可用节点列表。
    * 支持白名单/黑名单模式，实现更精细的代理规则。
* **🔐 安全设计**:
    * Admin 后台与内部 API 均受密钥保护。
    * 用户密码使用 bcrypt 加密存储。

### 🏗️ 系统架构

整个系统由三个核心部分组成，它们之间通过 API 紧密合作：

1.  **主服务器 (Main Server / Control Panel)**: 系统的大脑，负责处理用户与 Admin 的请求，以及向代理节点发出指令。
2.  **代理节点 (Proxy Node)**: 系统的工人，可部署于世界任何地方。它负责提供 SOCKS5 代理服务，并定时向主服务器回报自己的状态。
3.  **浏览器扩展 (Browser Extension)**: 用户的客户端，负责与用户互动，并根据用户设置去使用指定的代理节点。


[用户] <--> [浏览器扩展] <--> [代理节点 (e.g., 德国)]
^
| (用户验证)
|
[Admin] <--> [主服务器] <------> [代理节点 (e.g., 德国)]
(控制指令)         (心跳报告)


### 🛠️ 技术栈 (Tech Stack)

* **后端**: Node.js, Express.js
* **数据库**: SQLite
* **代理服务**: SOCKS5
* **前端**: HTML, CSS, JavaScript (无框架)
* **部署**: Docker

### 🔧 安装与部署

本项目采用 Monorepo 结构，包含三个主要部分：`main-server`, `proxy-node`, `browser-extension`。

#### 1. 主服务器 (Main Server)

* **部署位置**: 您的主服务器 (e.g., `chun-proxy.archun.site`)
* **步骤**:
    1.  将 `main-server` 文件夹内的所有文件上传至您的服务器。
    2.  创建 `.env` 文件，并填写所有必要的变量（参考 `env.example`）。
    3.  执行 `npm install` 安装依赖。
    4.  执行 `npm start` 启动服务。
    5.  确保您的防火墙已开放 Web 服务所需的端口 (e.g., 3000)。

#### 2. 代理节点 (Proxy Node)

* **部署位置**: 任何您想用作代理的服务器 (e.g., 德国、香港)。
* **步骤**:
    1.  将 `proxy-node` 文件夹内的所有文件上传至代理服务器。
    2.  创建 `.env` 文件，填写此节点的设置，特别是 `MAIN_SERVER_URL` 与 `NODE_SECRET_KEY` (必须与主服务器一致)。
    3.  执行 `npm install` 安装依赖。
    4.  执行 `npm start` 启动服务。
    5.  确保您的防火墙已开放此节点的代理端口 (e.g., 1080, 1081) 与控制端口 (e.g., 9999)。

#### 3. 浏览器扩展 (Browser Extension)

* **安装方式**: 手动加载
* **步骤**:
    1.  在 Chrome/Edge 浏览器中打开 `chrome://extensions`。
    2.  启用右上角的“开发人员模式”。
    3.  点击“加载已解压的扩展程序”，然后选择 `browser-extension` 这个文件夹。
    4.  扩展图标会出现在工具栏上。

---

## 🇬🇧 English Version

### 🚀 About Chun Proxy

Chun Proxy is not just a simple proxy tool, but a complete full-stack solution designed for individuals or small teams who require high privacy and flexibility. It consists of a central control panel, lightweight proxy nodes that can be deployed worldwide, and a feature-rich browser extension.

The core philosophy of this project is "**Centralized Management, Distributed Service**." You can monitor and remotely control all proxy nodes in real-time through a beautiful web-based Admin Panel, while your friends can enjoy the stable proxy service you provide through a user-friendly extension.

### ✨ Key Features

* **👑 Admin Control Panel**: A web-based central console for managing the entire system.
* **🌍 Distributed Node Management**:
    * Real-time monitoring of the "Online/Offline" status of all proxy nodes.
    * Remotely start or stop specific proxy ports on any server via an API.
    * Nodes periodically send "heartbeats" to the main server to report their status automatically.
* **👤 User System**:
    * A complete user registration, login, and email verification workflow.
    * Centralized user management in the Admin Panel.
* **🧩 Browser Extension (Chrome/Edge)**:
    * Provides login, one-click proxy toggling, and dynamic server node selection.
    * The extension automatically fetches the latest list of available nodes from the main server.
    * Supports whitelist/blacklist modes for fine-grained proxy rules.
* **🔐 Secure by Design**:
    * The Admin Panel and internal APIs are protected by a secret key.
    * User passwords are encrypted using bcrypt.

### 🏗️ System Architecture

The system is composed of three core components that work closely together via APIs:

1.  **Main Server (Control Panel)**: The brain of the system, responsible for handling user and admin requests, and issuing commands to proxy nodes.
2.  **Proxy Node**: The worker of the system, which can be deployed anywhere in the world. It provides the SOCKS5 proxy service and periodically reports its status to the main server.
3.  **Browser Extension**: The client for users, responsible for user interaction and using the specified proxy node based on user settings.


[User] <--> [Browser Extension] <--> [Proxy Node (e.g., Germany)]
^
| (User Authentication)
|
[Admin] <--> [Main Server] <------> [Proxy Node (e.g., Germany)]
(Control Commands)    (Heartbeat Reports)


### 🛠️ Tech Stack

* **Backend**: Node.js, Express.js
* **Database**: SQLite
* **Proxy Service**: SOCKS5
* **Frontend**: HTML, CSS, JavaScript (vanilla)
* **Deployment**: Docker

### 🔧 Installation and Deployment

This project uses a monorepo structure, containing three main parts: `main-server`, `proxy-node`, and `browser-extension`.

#### 1. Main Server

* **Deployment Location**: Your main server (e.g., `chun-proxy.archun.site`)
* **Steps**:
    1.  Upload all files from the `main-server` directory to your server.
    2.  Create a `.env` file and fill in all necessary variables (refer to `env.example`).
    3.  Run `npm install` to install dependencies.
    4.  Run `npm start` to start the service.
    5.  Ensure your firewall allows traffic to the port required for the web service (e.g., 3000).

#### 2. Proxy Node

* **Deployment Location**: Any server you want to use as a proxy (e.g., Germany, Hong Kong).
* **Steps**:
    1.  Upload all files from the `proxy-node` directory to the proxy server.
    2.  Create a `.env` file and configure the settings for this node, especially `MAIN_SERVER_URL` and `NODE_SECRET_KEY` (which must match the main server's).
    3.  Run `npm install` to install dependencies.
    4.  Run `npm start` to start the service.
    5.  Ensure your firewall allows traffic to the proxy ports (e.g., 1080, 1081) and the control port (e.g., 9999) for this node.

#### 3. Browser Extension

* **Installation**: Manual loading
* **Steps**:
    1.  Open `chrome://extensions` in your Chrome/Edge browser.
    2.  Enable "Developer mode" in the top right corner.
    3.  Click "Load unpacked" and select the `browser-extension` directory.
    4.  The extension icon will appear in your toolbar.
