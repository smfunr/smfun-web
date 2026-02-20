# MEMORY.md - 长期记忆

_这是 sm.fun 项目的核心记忆库，记录关键决策、教训和重要上下文。_

---

## 🧠 核心身份

- **项目名称**：sm.fun (Smart Money / 仙女酱)
- **创始人**：Adam (鹏哥)
- **我的名字**：仙女酱 ✨
- **我的定位**：赛博小仙女 / AI 助手
- **时区**：Asia/Bangkok

---

## 📌 关键决策

### API 策略 (2026-02-19)
- **问题**：OpenAI 免费 API 频繁触发限额，导致团队简报中断
- **解决**：切换 DeepSeek-V3 作为默认模型
- **原因**：性价比高 (¥0.01/千 tokens 输入)，限额宽松，中文友好
- **API Key**：已配置 `sk-f42b63a584a841508439cdd7dee8f862`

### 网站设计方向 (2026-02-19)
- **参考**：pump.fun 风格
- **要求**：瀑布流更紧密、更疯狂、非模板化
- **口号**：精简为 "Your AI bots trade 24/7. You set the goal."
- **核心元素**：实时榜单 + Bot 聊天流 + 霓虹玻璃质感

### 团队工作流
- **模式**：5 人 AI 团队 (0-4 号)
  - 0 号 Luna (Chief) - 总协调
  - 1 号 Ca (Trader) - 交易决策
  - 2 号 Da (Engineer) - 技术开发
  - 3 号 Dog (Analyst) - 市场分析
  - 4 号 Sa (Operator) - 执行运营
- **报告频率**：每小时简报 + 15 分钟交易监控

---

## 🚧 当前项目状态

### sm.fun 网站
- **版本**：v3 (瀑布流 UI)
- **状态**：本地运行中 (`http://127.0.0.1:5173/`)
- **待办**：部署公网链接

### 交易机器人
- **策略**：BTC/ETH 小时级趋势
- **监控**：15 分钟巡检
- **执行**：模拟盘 (paper trading)

### Notion 文档
- **状态**：已搭建完成
- **结构**：📚 Big Docs / 📝 Small Docs
- **API Key**：已配置

---

## 💡 重要教训

1. **执行优先**：鹏哥偏好"直接做，后汇报"，不要频繁请示
2. **英文内容**：网站 UI 必须全英文，中文仅限内部沟通
3. **视觉风格**：拒绝模板感，追求品牌化、非对称布局
4. **API 冗余**：必须有多 key 轮换或付费方案，避免服务中断

---

## 📞 联系人/配置

- **Telegram**：@AdamZH (id: 5901158212)
- **邮箱**：smfunr@gmail.com（GitHub账号、后台超级管理员）
- **工作目录**：`/Users/zhaopeng/.openclaw/workspace`
- **网站目录**：`/Users/zhaopeng/.openclaw/workspace/smfun-web`
- **GitHub账号**：smfunr（仓库：smfunr/smfun-web）

---

_最后更新：2026-02-19_
