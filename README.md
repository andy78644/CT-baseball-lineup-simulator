# 中華隊先發陣容預測 🇹🇼⚾

Taiwan Baseball Dream Team Lineup Selector - 讓教練們預測並分享中華隊的先發陣容！

![Taiwan Baseball](https://img.shields.io/badge/Baseball-Taiwan-red?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

## ✨ 功能特色

- 🎯 **拖拉式打序安排** - 輕鬆選擇 1-9 棒打者與守備位置
- ⚾ **投手調度** - 設定先發投手 (SP)、中繼 (RP)、終結者 (CP)
- 📊 **視覺化守備位置圖** - 即時顯示球員在場上的位置配置
- 👥 **教練名單分享** - 查看其他教練提交的陣容
- 📋 **一鍵複製分享** - 將守備位置圖複製為圖片分享

## 🚀 快速開始

### 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm start

# 開啟瀏覽器
open http://localhost:3000
```

### 環境需求

- Node.js 18+
- npm 或 yarn

## 📦 部署到 Vercel

### 方法一：一鍵部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/YOUR_REPO)

### 方法二：手動部署

1. **安裝 Vercel CLI**

```bash
npm install -g vercel
```

2. **登入 Vercel**

```bash
vercel login
```

3. **部署專案**

```bash
cd 先發打序
vercel
```

4. **首次部署設定**

當 Vercel CLI 詢問時：
- `Set up and deploy?` → `Y`
- `Which scope?` → 選擇你的帳號
- `Link to existing project?` → `N`
- `Project name?` → 輸入專案名稱（如 `taiwan-baseball-lineup`）
- `In which directory is your code located?` → `./`
- `Override settings?` → `N`

5. **部署到正式環境**

```bash
vercel --prod
```

### 方法三：連結 GitHub 自動部署

1. 將專案推送到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

2. 前往 [Vercel Dashboard](https://vercel.com/dashboard)

3. 點擊 `Add New...` → `Project`

4. 選擇你的 GitHub repository

5. 設定完成後點擊 `Deploy`

6. 之後每次 push 到 main 分支都會自動部署！

## ⚙️ Vercel 設定檔 (可選)

如需自訂設定，建立 `vercel.json`：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    },
    {
      "src": "public/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server.js"
    },
    {
      "src": "/(.*)",
      "dest": "public/$1"
    }
  ]
}
```

## 📁 專案結構

```
先發打序/
├── public/
│   ├── index.html      # 主頁面
│   ├── style.css       # 樣式表
│   ├── script.js       # 前端邏輯
│   └── field.svg       # 棒球場圖片
├── server.js           # Express 後端
├── package.json        # 依賴設定
├── .gitignore          # Git 忽略規則
└── README.md           # 說明文件
```

## 🔧 API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/lineups` | 取得所有已提交的陣容 |
| POST | `/api/lineup` | 提交新陣容 |

### 提交陣容格式

```json
{
  "name": "教練名稱",
  "email": "email@example.com",
  "lineup": {
    "1": { "player": "陳傑憲", "pos": "CF" },
    "2": { "player": "林安可", "pos": "LF" },
    ...
  }
}
```

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

MIT License

---

Made with ❤️ for Taiwan Baseball
