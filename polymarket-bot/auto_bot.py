#!/usr/bin/env python3
"""
Polymarket BTC hourly auto bot (auto-discovery + auto execution)

⚠️ Real money risk. Start with DRY_RUN=true.
"""

import json
import logging
import os
import re
import sys
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Optional, Tuple

from py_clob_client.client import ClobClient
from py_clob_client.clob_types import OrderArgs, OrderType
from py_clob_client.order_builder.constants import BUY, SELL


def env(name: str, default: Optional[str] = None) -> str:
    v = os.getenv(name, default)
    if v is None:
        raise RuntimeError(f"Missing env: {name}")
    return v


def envf(name: str, default: float) -> float:
    return float(os.getenv(name, str(default)))


def envi(name: str, default: int) -> int:
    return int(os.getenv(name, str(default)))


def load_env_file(path: str) -> None:
    if not os.path.exists(path):
        return
    with open(path, "r", encoding="utf-8") as f:
        for ln in f:
            s = ln.strip()
            if not s or s.startswith("#") or "=" not in s:
                continue
            k, v = s.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())


LOG = logging.getLogger("polymarket_auto_bot")


def setup_logger(log_file: Path, max_bytes: int, backups: int) -> None:
    log_file.parent.mkdir(parents=True, exist_ok=True)
    LOG.setLevel(logging.INFO)

    fmt = logging.Formatter("%(message)s")

    stream = logging.StreamHandler(sys.stdout)
    stream.setFormatter(fmt)
    LOG.addHandler(stream)

    rotating = RotatingFileHandler(log_file, maxBytes=max_bytes, backupCount=backups, encoding="utf-8")
    rotating.setFormatter(fmt)
    LOG.addHandler(rotating)


def log(event: str, **kw):
    LOG.info(json.dumps({"ts": datetime.now(timezone.utc).isoformat(), "event": event, **kw}, ensure_ascii=False))


@dataclass
class Position:
    side: str
    token_id: str
    entry_price: float
    size_usdc: float
    qty: float
    opened_at: str


class Bot:
    def __init__(self):
        load_env_file(os.path.join(os.path.dirname(__file__), ".env"))

        self.host = env("CLOB_BASE_URL", "https://clob.polymarket.com")
        self.chain_id = envi("POLY_CHAIN_ID", 137)
        self.private_key = env("POLY_PRIVATE_KEY")
        self.signature_type = envi("POLY_SIGNATURE_TYPE", 1)
        self.funder = os.getenv("POLY_FUNDER", "")

        self.starting_capital = envf("STARTING_CAPITAL_USDC", 500)
        self.max_order_size = envf("MAX_ORDER_SIZE_USDC", 50)
        self.entry_threshold = envf("ENTRY_PRICE_THRESHOLD", 0.30)
        self.take_profit_pct = envf("TAKE_PROFIT_PCT", 0.20)
        self.entry_window_minutes = envi("ENTRY_WINDOW_MINUTES", 20)
        self.poll_ms = max(1000, envi("POLL_INTERVAL_MS", 5000))
        self.scan_pages = max(1, envi("DISCOVERY_SCAN_PAGES", 8))

        # NOTE: 默认必须是正则单反斜杠 \b，原来写成 \\b 会匹配失败。
        self.market_re = re.compile(env("MARKET_FILTER_REGEX", r"(?i)\b(bitcoin|btc)\b"))
        self.hourly_re = re.compile(env("HOURLY_HINT_REGEX", r"(?i)(hour|1h|60m|up.?down|up/down)"))
        self.up_re = re.compile(env("UP_OUTCOME_REGEX", r"(?i)^(up|yes)$"))
        self.down_re = re.compile(env("DOWN_OUTCOME_REGEX", r"(?i)^(down|no)$"))

        self.dry_run = env("DRY_RUN", "true").lower() != "false"

        log_dir = Path(env("LOG_DIR", os.path.join(os.path.dirname(__file__), "logs")))
        self.log_file = log_dir / env("LOG_FILE", "auto_bot.log")
        self.status_file = log_dir / env("STATUS_FILE", "status.json")
        log_max_bytes = envi("LOG_MAX_BYTES", 5 * 1024 * 1024)
        log_backups = envi("LOG_BACKUPS", 5)
        setup_logger(self.log_file, max_bytes=log_max_bytes, backups=log_backups)

        self.client = ClobClient(
            self.host,
            chain_id=self.chain_id,
            key=self.private_key,
            signature_type=self.signature_type,
            funder=(self.funder or None),
        )
        creds = self.client.create_or_derive_api_creds()
        self.client.set_api_creds(creds)

        self.capital = self.starting_capital
        self.pos: Optional[Position] = None
        self.last_market_resolve = 0
        self.cached_market = None
        self.err_streak = 0

        log("BOT_START", dryRun=self.dry_run, chainId=self.chain_id, maxOrder=self.max_order_size, logFile=str(self.log_file))
        self.write_status("started")

    def run(self):
        while True:
            try:
                self.tick()
                self.err_streak = 0
            except KeyboardInterrupt:
                log("BOT_STOP", reason="keyboard_interrupt")
                self.write_status("stopped")
                raise
            except Exception as e:
                self.err_streak += 1
                log("ERR_TICK", err=str(e), errStreak=self.err_streak)
                self.write_status("degraded", lastError=str(e), errStreak=self.err_streak)
            time.sleep(self.poll_ms / 1000)

    def tick(self):
        now = datetime.now(timezone.utc)
        minute = now.minute
        in_entry_window = minute < self.entry_window_minutes

        market = self.get_current_market()
        if not market:
            log("NO_MARKET")
            self.write_status("healthy", note="no_market")
            return

        up_tid, down_tid, question = market
        up = self.best_prices(up_tid)
        down = self.best_prices(down_tid)

        if not up or not down:
            log("NO_PRICE", question=question)
            self.write_status("healthy", note="no_price", market=question)
            return

        up_ask, up_bid = up
        down_ask, down_bid = down

        log(
            "TICK",
            inWindow=in_entry_window,
            question=question,
            upAsk=up_ask,
            upBid=up_bid,
            downAsk=down_ask,
            downBid=down_bid,
            cap=round(self.capital, 2),
            holding=(self.pos.side if self.pos else None),
        )

        if self.pos is None and in_entry_window:
            cands = []
            if up_ask is not None and up_ask <= self.entry_threshold:
                cands.append(("UP", up_tid, up_ask))
            if down_ask is not None and down_ask <= self.entry_threshold:
                cands.append(("DOWN", down_tid, down_ask))
            if cands:
                cands.sort(key=lambda x: x[2])
                side, tid, px = cands[0]
                self.open_pos(side, tid, px)

        if self.pos:
            cur_bid = up_bid if self.pos.side == "UP" else down_bid
            if cur_bid is None:
                log("SKIP_CLOSE_NO_BID", side=self.pos.side)
            elif self.pos.entry_price > 0:
                pnl_pct = (cur_bid - self.pos.entry_price) / self.pos.entry_price
                if pnl_pct >= self.take_profit_pct:
                    self.close_pos(cur_bid)

        self.write_status("healthy", market=question)

    def get_current_market(self) -> Optional[Tuple[str, str, str]]:
        now = time.time()
        if self.cached_market and now - self.last_market_resolve < 60:
            return self.cached_market

        cursor = "MA=="
        best = None
        best_end_ts = None

        for _ in range(self.scan_pages):
            try:
                page = self.client.get_markets(next_cursor=cursor)
            except Exception as e:
                log("ERR_GET_MARKETS", err=str(e), cursor=cursor)
                break

            data = page.get("data", [])
            cursor = page.get("next_cursor")
            for m in data:
                if not (m.get("active") and m.get("accepting_orders") and not m.get("closed") and m.get("enable_order_book")):
                    continue
                q = m.get("question", "")
                if not self.market_re.search(q):
                    continue
                if not self.hourly_re.search(q):
                    continue

                tokens = m.get("tokens", [])
                up_tid = down_tid = None
                for t in tokens:
                    out = str(t.get("outcome", "")).strip()
                    if self.up_re.search(out):
                        up_tid = t.get("token_id")
                    elif self.down_re.search(out):
                        down_tid = t.get("token_id")

                if not up_tid or not down_tid:
                    continue

                end_iso = m.get("end_date_iso")
                end_ts = self._parse_ts(end_iso)
                if end_ts is None:
                    continue
                # 只要未来 2 小时以内，优先最早结束（通常就是当前小时盘）
                if end_ts < now or end_ts > now + 7200:
                    continue
                if best is None or end_ts < best_end_ts:
                    best = (up_tid, down_tid, q)
                    best_end_ts = end_ts

            if not cursor or cursor == "LTE=":
                break

        self.cached_market = best
        self.last_market_resolve = now
        if best:
            log("MARKET_SELECTED", question=best[2], upToken=best[0][-8:], downToken=best[1][-8:])
        return best

    def best_prices(self, token_id: str) -> Optional[Tuple[Optional[float], Optional[float]]]:
        try:
            ob = self.client.get_order_book(token_id)
        except Exception as e:
            log("ERR_GET_BOOK", token=token_id[-8:], err=str(e))
            return None

        asks = sorted([float(a.price) for a in (getattr(ob, "asks", []) or []) if self._is_valid_price(a.price)])
        bids = sorted([float(b.price) for b in (getattr(ob, "bids", []) or []) if self._is_valid_price(b.price)], reverse=True)

        ask = asks[0] if asks else None
        bid = bids[0] if bids else None

        if ask is None and bid is None:
            return None
        return ask, bid

    def open_pos(self, side: str, token_id: str, ask_price: float):
        if ask_price <= 0:
            log("SKIP_OPEN_BAD_PRICE", side=side, ask=ask_price)
            return

        size_usdc = min(self.max_order_size, self.capital)
        if size_usdc <= 0:
            log("SKIP_OPEN_NO_CAPITAL")
            return
        qty = size_usdc / ask_price

        self.place_limit(side=BUY, token_id=token_id, price=ask_price, size=qty, note=f"open-{side}")

        self.capital -= size_usdc
        self.pos = Position(
            side=side,
            token_id=token_id,
            entry_price=ask_price,
            size_usdc=size_usdc,
            qty=qty,
            opened_at=datetime.now(timezone.utc).isoformat(),
        )
        log("OPENED", side=side, price=ask_price, sizeUsdc=round(size_usdc, 2), qty=round(qty, 6), capital=round(self.capital, 2))

    def close_pos(self, bid_price: float):
        p = self.pos
        if not p:
            return
        if bid_price <= 0:
            log("SKIP_CLOSE_BAD_PRICE", side=p.side, bid=bid_price)
            return

        self.place_limit(side=SELL, token_id=p.token_id, price=bid_price, size=p.qty, note="take-profit")

        proceeds = p.qty * bid_price
        pnl = proceeds - p.size_usdc
        self.capital += proceeds
        log(
            "CLOSED",
            side=p.side,
            entry=p.entry_price,
            exit=bid_price,
            pnl=round(pnl, 4),
            pnlPct=round((pnl / p.size_usdc) * 100, 2),
            capital=round(self.capital, 2),
        )
        self.pos = None

    def place_limit(self, side: str, token_id: str, price: float, size: float, note: str):
        if self.dry_run:
            log("DRY_ORDER", side=side, token=token_id[-8:], px=price, size=round(size, 6), note=note)
            return

        order_args = OrderArgs(token_id=token_id, price=price, size=size, side=side)
        signed = self.client.create_order(order_args)
        resp = self.client.post_order(signed, OrderType.FOK)
        log("ORDER_OK", side=side, token=token_id[-8:], px=price, size=round(size, 6), note=note, resp=resp)

    def write_status(self, health: str, **extra):
        payload = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "health": health,
            "dryRun": self.dry_run,
            "capital": round(self.capital, 6),
            "position": asdict(self.pos) if self.pos else None,
            **extra,
        }
        self.status_file.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.status_file.with_suffix(".tmp")
        tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp.replace(self.status_file)

    @staticmethod
    def _parse_ts(iso_str: Optional[str]) -> Optional[float]:
        if not iso_str:
            return None
        try:
            if iso_str.endswith("Z"):
                iso_str = iso_str.replace("Z", "+00:00")
            return datetime.fromisoformat(iso_str).timestamp()
        except Exception:
            return None

    @staticmethod
    def _is_valid_price(value) -> bool:
        try:
            x = float(value)
            return x > 0
        except Exception:
            return False


if __name__ == "__main__":
    Bot().run()
