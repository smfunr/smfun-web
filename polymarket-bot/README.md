# Polymarket BTC Hourly Bot

按你的规则做的交易机器人（默认 **DRY_RUN=true** 安全模式）：

- 本金：500 USDC（配置项）
- 单笔最大仓位：50 USDC
- 仅做 BTC 每小时 Up/Down 市场
- 仅在每小时前 20 分钟允许开仓
- 当某一边价格 `<= 0.30` 时，买入该边
- 浮盈达到 `+20%` 时平仓

> 说明：Polymarket 实盘下单需要签名与钱包权限。当前版本先保证策略、风控、可观测性稳定，默认不实盘下单。

---

## 1) 快速上手（自动识别 + 自动下单）

```bash
cd polymarket-bot
cp .env.auto.example .env
python3 auto_bot.py
```

必填项：

- `POLY_PRIVATE_KEY`
- （如你是代理签名模式）`POLY_FUNDER`

默认 `DRY_RUN=true`，只模拟不下单。确认日志正确后再改成 `false`。

启动前建议先跑自检：

```bash
./ben
```

---

## 2) 手动 token 版本（可选）

```bash
cp .env.example .env
node bot.js
```

---

## 3) 实盘下单接入（可选）

Python 自动版当前直接调用 `py_clob_client` 下单。

Node 版本可通过 `EXECUTE_ORDER_CMD` 挂接你的签名器：

```bash
EXECUTE_ORDER_CMD="python3 place_order.py"
```

bot 会通过 stdin 传 JSON：

```json
{
  "action": "BUY" | "SELL",
  "side": "UP" | "DOWN",
  "tokenId": "...",
  "price": 0.29,
  "sizeUsdc": 50,
  "reason": "entry-threshold"
}
```

你的脚本返回 JSON（stdout）：

```json
{"ok": true, "orderId": "..."}
```

---

## 4) 风控说明

- 单仓位上限：`MAX_ORDER_SIZE_USDC`
- 同时只持有一边仓位
- 仅 00:00~00:19 / 01:00~01:19 ... 可开新仓
- 已持仓时只做止盈检查，不重复加仓
- 默认 `DRY_RUN=true`，避免误实盘

---

## 5) 最小化监控与日志

新增日志目录（默认）：`./logs/`

- 运行日志（JSONL）：
  - Python 自动版：`logs/auto_bot.log`（带轮转）
  - Node 手动版：`logs/manual_bot.log`
- 状态文件（可被监控系统读取）：
  - Python 自动版：`logs/status.json`
  - Node 手动版：`logs/manual_status.json`

状态文件关键字段：

- `health`: `started|healthy|degraded|stopped`
- `dryRun`: 是否为模拟单
- `capital`: 当前资金
- `position`: 当前持仓（无则 `null`）
- `errStreak`: 连续错误次数（Node 版）

可配置项（两版都支持）：

- `LOG_DIR`（默认 `./logs`）
- `LOG_FILE`
- `STATUS_FILE`
- Python 额外支持：`LOG_MAX_BYTES`、`LOG_BACKUPS`

---

## 6) 自动检测脚本（`ben`）

`ben` 是启动前自检脚本（可执行文件），用于快速发现配置和运行环境问题：

```bash
./ben
```

会检查：

1. `.env` 是否存在、关键项是否完整（至少自动版或手动版有一套可用）
2. `LOG_DIR` 是否可写
3. `DRY_RUN` 当前状态（显式提示）
4. `auto_bot.py` 与 `bot.js` 语法是否通过
5. 最后输出 PASS/WARN/FAIL 汇总及失败项

返回码说明：

- `0`：自检通过
- `1`：自检失败（请按失败项修复）

---

## 7) 守护进程建议（PM2 方案）

> 这里给 PM2（不选 launchd），部署快、看日志方便。

### 6.1 安装

```bash
npm i -g pm2
```

### 6.2 启动自动版（推荐）

```bash
cd polymarket-bot
cp .env.auto.example .env   # 首次
pm2 start ecosystem.config.cjs
pm2 save
pm2 status
```

### 6.3 常用运维命令

```bash
pm2 logs polymarket-auto --lines 200
pm2 restart polymarket-auto
pm2 stop polymarket-auto
pm2 delete polymarket-auto
```

### 6.4 开机自启

```bash
pm2 startup
# 按命令输出提示执行一次 sudo ...
pm2 save
```

---

## 8) 回滚方案（务实）

### A. 快速代码回滚（推荐）

```bash
git log --oneline -n 5
# 找到上一稳定版本 <GOOD_SHA>
git checkout <GOOD_SHA>
```

若你需要回到当前分支并固定回滚提交：

```bash
git switch -
git revert <BAD_SHA>
```

### B. 运行配置回滚

保留一份稳定配置：

```bash
cp .env .env.bak.stable
```

异常时恢复：

```bash
cp .env.bak.stable .env
pm2 restart polymarket-auto
```

### C. 紧急止损动作

1. 立刻改 `DRY_RUN=true`
2. `pm2 restart polymarket-auto`
3. 检查 `logs/status.json` 的 `dryRun` 已为 `true`

---

## 9) 生产前验证清单

```bash
# 一键自检（推荐）
./ben

# Python 语法检查
python3 -m py_compile auto_bot.py

# Node 语法检查
node --check bot.js

# 干跑 1~2 分钟
DRY_RUN=true python3 auto_bot.py
# 或
DRY_RUN=true node bot.js

# 查看状态
cat logs/status.json
```

---

## 10) 重要提醒

- 真实资金风险很高，务必先跑 `DRY_RUN=true`
- 交易所 API / 市场结构可能变化，建议每天先小额验证
- 该策略不是投资建议，可能连续亏损
