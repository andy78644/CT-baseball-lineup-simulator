# 中華隊先發陣容預測 🇹🇼⚾

Taiwan Baseball Dream Team Lineup Selector - 讓鍵盤教練們預測並分享中華隊的先發陣容！

![Taiwan Baseball](https://img.shields.io/badge/Baseball-Taiwan-red?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

## ✨ 功能特色

- 🎯 **拖拉式打序安排** - 輕鬆選擇 1-9 棒打者與守備位置
- ⚾ **投手調度** - 設定先發投手 (SP)、中繼 (RP)、終結者 (CP)
- 📊 **視覺化守備位置圖** - 即時顯示球員在場上的位置配置
- 👥 **鍵盤教練名單分享** - 查看其他鍵盤教練提交的陣容
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

## 📦 部署到 Vercel (使用 Vercel Postgres)

### 1. 初始設定

1. **安裝 Vercel CLI** (若尚未安裝)
   ```bash
   npm install -g vercel
   ```

2. **連結 Vercel 專案**
   ```bash
   vercel
   ```

3. **建立資料庫**
   - 前往 [Vercel Dashboard](https://vercel.com/dashboard)
   - 進入你的專案 → **Storage** tab
   - 點擊 **Create Database** → 選擇 **Postgres**
   - 選擇 Region (建議選擇離台灣近的，如 Simple/Singapore 或 Tokyo)
   - 點擊 **Create** 並等待建立完成

4. **初始化資料表**
   - 在 Postgres 頁面左側點擊 **Query**
   - 貼上以下 SQL 指令並按 **Run Query**：
   
   ```sql
   CREATE TABLE IF NOT EXISTS lineups (
       id SERIAL PRIMARY KEY,
       name TEXT NOT NULL,
       email TEXT,
       lineup TEXT NOT NULL,
       created_at TIMESTAMP DEFAULT NOW()
   );
   ```

### 2. 本地開發

若要在本地測試 Vercel Postgres，需要拉取環境變數：

```bash
vercel env pull .env.development.local
npm install
vercel dev
```

開啟 `http://localhost:3000` 進行測試。

### 3. 部署到正式環境

```bash
vercel --prod
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
  "name": "鍵盤教練名稱",
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
