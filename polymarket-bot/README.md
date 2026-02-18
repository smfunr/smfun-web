# Polymarket BTC Hourly Bot (v1)

按你的规则做的第一版（默认 **paper trade**）：

- 本金：500 USDC（配置项）
- 单笔最大仓位：50 USDC
- 仅做 BTC 每小时 Up/Down 市场
- 仅在每小时前 20 分钟允许开仓
- 当某一边价格 `<= 0.30` 时，买入该边
- 浮盈达到 `+20%` 时平仓

> 说明：Polymarket 实盘下单需要签名与钱包权限。这个 v1 先把策略与风控跑通，
> 下单层通过 `EXECUTE_ORDER_CMD` 挂接（你可以接自己的签名器）。

## 1) 准备

```bash
cd polymarket-bot
cp .env.example .env
```

填写 `.env`：

- `UP_TOKEN_ID`：当小时 BTC Up token id
- `DOWN_TOKEN_ID`：当小时 BTC Down token id
- `MAX_ORDER_SIZE_USDC=50`
- `TAKE_PROFIT_PCT=0.2`
- `ENTRY_PRICE_THRESHOLD=0.30`

## 2) 运行

```bash
node bot.js
```

## 3) 实盘下单接入（可选）

设置 `EXECUTE_ORDER_CMD`，bot 会在触发时调用：

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

## 4) 风控说明

- 单仓位上限：`MAX_ORDER_SIZE_USDC`
- 同时只持有一边仓位
- 仅 00:00~00:19 / 01:00~01:19 ... 可开新仓
- 已持仓时只做止盈检查，不重复加仓

## 5) 你下一步要做

- 给我每小时市场 token id 的自动发现方式（或你固定交易的 market source）
- 我就给你补上自动识别当前小时 market + 实盘签名下单层
