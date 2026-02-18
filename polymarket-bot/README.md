# Polymarket BTC Hourly Bot

按你的规则做的交易机器人（默认 **paper trade**）：

- 本金：500 USDC（配置项）
- 单笔最大仓位：50 USDC
- 仅做 BTC 每小时 Up/Down 市场
- 仅在每小时前 20 分钟允许开仓
- 当某一边价格 `<= 0.30` 时，买入该边
- 浮盈达到 `+20%` 时平仓

> 说明：Polymarket 实盘下单需要签名与钱包权限。这个 v1 先把策略与风控跑通，
> 下单层通过 `EXECUTE_ORDER_CMD` 挂接（你可以接自己的签名器）。

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

## 2) 如果你想先手动 token 版本

```bash
cp .env.example .env
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

## 5) 自动版说明（`auto_bot.py`）

- 自动扫描并识别 BTC 小时盘（按正则过滤）
- 自动映射 Up/Down outcome 到 token
- 每小时前 20 分钟内按你的规则入场
- 盈利 20%（按当前 bid）自动平仓
- 支持实盘自动下单（`DRY_RUN=false`）

## 6) 重要提醒

- 真实资金风险很高，务必先跑 `DRY_RUN=true`
- 交易所 API / 市场结构可能变化，建议每天先小额验证
- 该策略不是投资建议，可能连续亏损
