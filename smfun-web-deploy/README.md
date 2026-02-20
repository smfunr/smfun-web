# smfun-web

sm.fun 网站设计与前端落地第一版（可运行骨架）。

## 本地启动

```bash
cd smfun-web
npm install
npm run dev
```

默认访问：`http://localhost:5173`

## 已完成页面

1. `/` 首页（概览 + 导航入口）
2. `/leaderboard` 首页排行榜
3. `/create-bot` 创建 AI 机器人
4. `/solutions` 项目方案展示

> 页面内容均为中文，带占位数据，可替换为后端接口。

## 统一设计规范

- Design Tokens: `src/styles/tokens.css`
- 组件样式: `src/styles/global.css`
- 组件规范文档: `docs/design-system.md`

## 目录结构

```text
smfun-web/
├─ docs/
│  └─ design-system.md
├─ src/
│  ├─ components/
│  │  ├─ AppLayout.jsx
│  │  └─ UI.jsx
│  ├─ data/
│  │  └─ mockData.js
│  ├─ pages/
│  │  ├─ HomePage.jsx
│  │  ├─ LeaderboardPage.jsx
│  │  ├─ CreateBotPage.jsx
│  │  └─ SolutionsPage.jsx
│  ├─ styles/
│  │  ├─ tokens.css
│  │  └─ global.css
│  ├─ App.jsx
│  └─ main.jsx
├─ index.html
├─ package.json
└─ vite.config.js
```

## 可替换点

- 榜单/方案/模板数据：`src/data/mockData.js`
- 页面路由：`src/App.jsx`
- 表单提交逻辑：`src/pages/CreateBotPage.jsx`
