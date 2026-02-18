#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

loadEnv(path.join(__dirname, '.env'));

const cfg = {
  startingCapital: num('STARTING_CAPITAL_USDC', 500),
  maxOrderSize: num('MAX_ORDER_SIZE_USDC', 50),
  entryThreshold: num('ENTRY_PRICE_THRESHOLD', 0.30),
  takeProfitPct: num('TAKE_PROFIT_PCT', 0.20),
  entryWindowMinutes: int('ENTRY_WINDOW_MINUTES', 20),
  pollMs: int('POLL_INTERVAL_MS', 5000),
  upTokenId: must('UP_TOKEN_ID'),
  downTokenId: must('DOWN_TOKEN_ID'),
  clobBase: process.env.CLOB_BASE_URL || 'https://clob.polymarket.com',
  dryRun: String(process.env.DRY_RUN || 'true').toLowerCase() !== 'false',
  execCmd: (process.env.EXECUTE_ORDER_CMD || '').trim(),
};

const state = {
  capital: cfg.startingCapital,
  position: null, // { side, tokenId, entryPrice, sizeUsdc, qty, openedAt }
  trades: [],
};

log('BOT_START', { cfg: { ...cfg, upTokenId: mask(cfg.upTokenId), downTokenId: mask(cfg.downTokenId) } });

setInterval(tick, cfg.pollMs);
tick().catch(err => log('ERR_TICK', { err: String(err) }));

async function tick() {
  const now = new Date();
  const m = now.getMinutes();
  const inWindow = m < cfg.entryWindowMinutes;

  const [up, down] = await Promise.all([
    getBestPrice(cfg.upTokenId),
    getBestPrice(cfg.downTokenId),
  ]);

  if (!up.ok || !down.ok) {
    log('WARN_MARKET_DATA', { up, down });
    return;
  }

  const upPrice = up.price;
  const downPrice = down.price;

  log('TICK', {
    time: now.toISOString(),
    inWindow,
    upPrice,
    downPrice,
    capital: round(state.capital),
    holding: state.position ? { side: state.position.side, entryPrice: state.position.entryPrice, qty: round(state.position.qty, 6) } : null,
  });

  if (!state.position && inWindow) {
    const candidates = [];
    if (upPrice <= cfg.entryThreshold) candidates.push({ side: 'UP', tokenId: cfg.upTokenId, price: upPrice });
    if (downPrice <= cfg.entryThreshold) candidates.push({ side: 'DOWN', tokenId: cfg.downTokenId, price: downPrice });

    if (candidates.length > 0) {
      // 买价格更小的一边（你的规则 #1）
      candidates.sort((a, b) => a.price - b.price);
      const pick = candidates[0];
      await openPosition(pick.side, pick.tokenId, pick.price, 'entry-threshold');
    }
  }

  if (state.position) {
    const currentPrice = state.position.side === 'UP' ? upPrice : downPrice;
    const pnlPct = (currentPrice - state.position.entryPrice) / state.position.entryPrice;
    if (pnlPct >= cfg.takeProfitPct) {
      await closePosition(currentPrice, 'take-profit');
    }
  }
}

async function openPosition(side, tokenId, price, reason) {
  const sizeUsdc = Math.min(cfg.maxOrderSize, state.capital);
  if (sizeUsdc <= 0) return;

  const qty = sizeUsdc / price;
  const order = { action: 'BUY', side, tokenId, price, sizeUsdc, reason };
  const res = await executeOrder(order);
  if (!res.ok) {
    log('ERR_OPEN_ORDER', { order, res });
    return;
  }

  state.capital -= sizeUsdc;
  state.position = {
    side,
    tokenId,
    entryPrice: price,
    sizeUsdc,
    qty,
    openedAt: new Date().toISOString(),
  };

  log('OPENED', { side, price, sizeUsdc, qty: round(qty, 6), capitalLeft: round(state.capital), orderId: res.orderId || null });
}

async function closePosition(price, reason) {
  if (!state.position) return;
  const p = state.position;
  const proceeds = p.qty * price;
  const pnl = proceeds - p.sizeUsdc;
  const pnlPct = pnl / p.sizeUsdc;

  const order = {
    action: 'SELL',
    side: p.side,
    tokenId: p.tokenId,
    price,
    sizeUsdc: round(proceeds),
    reason,
  };

  const res = await executeOrder(order);
  if (!res.ok) {
    log('ERR_CLOSE_ORDER', { order, res });
    return;
  }

  state.capital += proceeds;
  state.trades.push({
    side: p.side,
    entryPrice: p.entryPrice,
    exitPrice: price,
    sizeUsdc: p.sizeUsdc,
    pnl: round(pnl),
    pnlPct: round(pnlPct, 4),
    openedAt: p.openedAt,
    closedAt: new Date().toISOString(),
  });
  state.position = null;

  log('CLOSED', { side: p.side, exitPrice: price, pnl: round(pnl), pnlPct: `${round(pnlPct * 100, 2)}%`, capital: round(state.capital), orderId: res.orderId || null });
}

async function executeOrder(order) {
  if (cfg.dryRun) {
    log('DRY_ORDER', order);
    return { ok: true, orderId: `dry-${Date.now()}` };
  }
  if (!cfg.execCmd) {
    return { ok: false, error: 'EXECUTE_ORDER_CMD is not set and DRY_RUN=false' };
  }
  return runExternal(order);
}

function runExternal(payload) {
  return new Promise((resolve) => {
    const child = spawn(cfg.execCmd, { shell: true, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';

    child.stdout.on('data', d => out += d.toString());
    child.stderr.on('data', d => err += d.toString());
    child.on('close', (code) => {
      if (code !== 0) return resolve({ ok: false, code, error: err || out || 'executor failed' });
      try {
        const parsed = JSON.parse(out || '{}');
        resolve(parsed.ok ? parsed : { ok: false, error: parsed.error || 'executor returned not ok' });
      } catch (e) {
        resolve({ ok: false, error: `invalid executor json: ${String(e)}`, raw: out });
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

async function getBestPrice(tokenId) {
  try {
    const url = `${cfg.clobBase}/book?token_id=${encodeURIComponent(tokenId)}`;
    const r = await fetch(url, { headers: { 'accept': 'application/json' } });
    if (!r.ok) return { ok: false, error: `http_${r.status}` };
    const j = await r.json();

    // 取最优 ask（买入）价格；若无 ask，则回退 bid
    const asks = Array.isArray(j.asks) ? j.asks : [];
    const bids = Array.isArray(j.bids) ? j.bids : [];

    const ask = asks.length ? numAny(asks[0].price) : null;
    const bid = bids.length ? numAny(bids[0].price) : null;
    const px = ask ?? bid;

    if (px == null || !isFinite(px)) return { ok: false, error: 'no_price' };
    return { ok: true, price: px };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    const i = s.indexOf('=');
    if (i < 0) continue;
    const k = s.slice(0, i).trim();
    const v = s.slice(i + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
}

function log(event, data = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}
function num(name, d) { const v = process.env[name]; return v == null || v === '' ? d : Number(v); }
function int(name, d) { return Math.floor(num(name, d)); }
function must(name) { const v = process.env[name]; if (!v) throw new Error(`Missing env: ${name}`); return v; }
function numAny(x) { const n = Number(x); return Number.isFinite(n) ? n : null; }
function round(x, p = 2) { return Number.parseFloat(Number(x).toFixed(p)); }
function mask(s) { return s.length <= 8 ? '***' : `${s.slice(0,4)}...${s.slice(-4)}`; }
