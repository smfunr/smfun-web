#!/usr/bin/env python3
"""No-key whitelist intelligence collector.

Output schema per item:
- title
- url
- source
- publishedAt
- confidence
"""

from __future__ import annotations

import argparse
import json
import re
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.error import URLError, HTTPError
from urllib.parse import urlparse
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

UA = "Mozilla/5.0 (compatible; no-key-whitelist-bot/1.0)"


@dataclass
class RawItem:
    title: str
    url: str
    source: str
    category: str
    published_at: str
    weight: float


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def http_get(url: str, timeout: int, retries: int, retry_sleep: float) -> bytes:
    last_err: Optional[Exception] = None
    for i in range(retries + 1):
        try:
            req = Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
            with urlopen(req, timeout=timeout) as resp:
                return resp.read()
        except (HTTPError, URLError, TimeoutError, OSError) as e:
            last_err = e
            if i < retries:
                time.sleep(retry_sleep * (i + 1))
            continue
    raise RuntimeError(f"fetch failed: {url}; err={last_err}")


def parse_dt(value: Optional[str]) -> str:
    if not value:
        return now_iso()
    v = value.strip()
    try:
        if v.endswith("Z"):
            return datetime.fromisoformat(v.replace("Z", "+00:00")).astimezone(timezone.utc).isoformat()
        return datetime.fromisoformat(v).astimezone(timezone.utc).isoformat()
    except Exception:
        try:
            return parsedate_to_datetime(v).astimezone(timezone.utc).isoformat()
        except Exception:
            return now_iso()


def strip_ns(tag: str) -> str:
    return tag.split("}", 1)[-1]


def text_of(el: Optional[ET.Element]) -> str:
    return (el.text or "").strip() if el is not None else ""


def parse_rss(xml_bytes: bytes, source_name: str, category: str, weight: float) -> List[RawItem]:
    items: List[RawItem] = []
    root = ET.fromstring(xml_bytes)
    for node in root.iter():
        tag = strip_ns(node.tag)
        if tag not in ("item", "entry"):
            continue

        title = ""
        link = ""
        pub = ""

        for c in list(node):
            ctag = strip_ns(c.tag)
            if ctag == "title" and not title:
                title = text_of(c)
            elif ctag == "link" and not link:
                href = c.attrib.get("href", "").strip()
                link = href or text_of(c)
            elif ctag in ("pubDate", "published", "updated") and not pub:
                pub = text_of(c)

        if not title or not link:
            continue

        items.append(
            RawItem(
                title=title,
                url=link,
                source=source_name,
                category=category,
                published_at=parse_dt(pub),
                weight=weight,
            )
        )
    return items


def parse_json_feed(body: bytes, source_name: str, category: str, weight: float) -> List[RawItem]:
    data = json.loads(body.decode("utf-8", errors="ignore"))
    items: List[RawItem] = []
    rows = []
    if isinstance(data, dict):
        rows = data.get("Data") or data.get("data") or data.get("items") or []
    for r in rows[:100]:
        title = str(r.get("title") or r.get("Title") or "").strip()
        url = str(r.get("url") or r.get("link") or r.get("guid") or "").strip()
        pub = str(r.get("published_on") or r.get("publishedAt") or r.get("created_at") or "")
        if pub.isdigit():
            pub = datetime.fromtimestamp(int(pub), tz=timezone.utc).isoformat()
        if title and url:
            items.append(
                RawItem(
                    title=title,
                    url=url,
                    source=source_name,
                    category=category,
                    published_at=parse_dt(pub),
                    weight=weight,
                )
            )
    return items


def normalize_title(title: str) -> str:
    t = title.lower()
    t = re.sub(r"https?://\S+", " ", t)
    t = re.sub(r"[^\w\s]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    stop = {"the", "a", "an", "to", "of", "for", "and", "on", "in", "is", "at", "with", "by", "from", "after", "as"}
    toks = [x for x in t.split() if len(x) > 2 and x not in stop]
    return " ".join(toks[:8])


def same_topic_key(category: str, title: str) -> str:
    base = normalize_title(title)
    return f"{category}:{base}"


def domain_of(u: str) -> str:
    try:
        return urlparse(u).netloc.lower()
    except Exception:
        return ""


def apply_confidence(items: List[RawItem]) -> List[Dict]:
    by_topic: Dict[str, List[RawItem]] = {}
    for it in items:
        k = same_topic_key(it.category, it.title)
        by_topic.setdefault(k, []).append(it)

    out = []
    for it in items:
        k = same_topic_key(it.category, it.title)
        group = by_topic.get(k, [])
        unique_sources = {g.source for g in group}
        unique_domains = {domain_of(g.url) for g in group if g.url}

        high_cross_verified = len(unique_sources) >= 2 and len(unique_domains) >= 2
        base = max(0.45, min(0.95, it.weight))
        confidence = 0.9 if high_cross_verified else round(base, 2)

        out.append(
            {
                "title": it.title,
                "url": it.url,
                "source": it.source,
                "publishedAt": it.published_at,
                "confidence": confidence,
                "meta": {
                    "category": it.category,
                    "crossVerified": high_cross_verified,
                    "topicPeerCount": len(group),
                    "distinctSources": len(unique_sources),
                },
            }
        )

    out.sort(key=lambda x: x.get("publishedAt", ""), reverse=True)
    return out


def dedupe(items: List[RawItem]) -> List[RawItem]:
    seen: set[Tuple[str, str]] = set()
    res: List[RawItem] = []
    for it in items:
        key = (normalize_title(it.title), it.url)
        if key in seen:
            continue
        seen.add(key)
        res.append(it)
    return res


def collect(config_path: Path, timeout: int, retries: int, retry_sleep: float) -> Tuple[List[Dict], List[Dict]]:
    cfg = json.loads(config_path.read_text(encoding="utf-8"))
    categories: Dict[str, List[Dict]] = cfg.get("categories", {})

    raw: List[RawItem] = []
    errors: List[Dict] = []

    for cat, sources in categories.items():
        for src in sources:
            name = src.get("name", "unknown")
            url = src.get("url", "")
            typ = src.get("type", "rss")
            fmt = src.get("format", "rss")
            weight = float(src.get("weight", 0.7))
            if not url:
                continue

            try:
                body = http_get(url, timeout=timeout, retries=retries, retry_sleep=retry_sleep)
                if typ == "rss" and fmt != "json":
                    rows = parse_rss(body, name, cat, weight)
                elif fmt == "json":
                    rows = parse_json_feed(body, name, cat, weight)
                else:
                    rows = parse_rss(body, name, cat, weight)
                raw.extend(rows)
            except Exception as e:
                errors.append({"source": name, "category": cat, "url": url, "error": str(e)})

    unified = apply_confidence(dedupe(raw))
    return unified, errors


def main() -> int:
    ap = argparse.ArgumentParser(description="No-key whitelist intelligence collector")
    ap.add_argument("--config", default="config/sources.whitelist.json")
    ap.add_argument("--out", default="data/days_news_input.json")
    ap.add_argument("--timeout", type=int, default=10)
    ap.add_argument("--retries", type=int, default=2)
    ap.add_argument("--retry-sleep", type=float, default=1.0)
    ap.add_argument("--limit", type=int, default=200)
    args = ap.parse_args()

    config_path = Path(args.config)
    out_path = Path(args.out)

    items, errors = collect(config_path, args.timeout, args.retries, args.retry_sleep)
    items = items[: max(1, args.limit)]

    payload = {
        "generatedAt": now_iso(),
        "schema": ["title", "url", "source", "publishedAt", "confidence"],
        "items": [
            {
                "title": x["title"],
                "url": x["url"],
                "source": x["source"],
                "publishedAt": x["publishedAt"],
                "confidence": x["confidence"],
            }
            for x in items
        ],
        "stats": {
            "count": len(items),
            "highConfidenceCount": sum(1 for x in items if x.get("confidence", 0) >= 0.9),
            "errorCount": len(errors),
        },
        "errors": errors,
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    # Also emit JSONL for pipeline consumers.
    jsonl_path = out_path.with_suffix(".jsonl")
    lines = []
    for x in items:
        row = {
            "title": x["title"],
            "url": x["url"],
            "source": x["source"],
            "publishedAt": x["publishedAt"],
            "confidence": x["confidence"],
        }
        lines.append(json.dumps(row, ensure_ascii=False))
    jsonl_path.write_text("\\n".join(lines) + ("\\n" if lines else ""), encoding="utf-8")

    print(json.dumps({"ok": True, "out": str(out_path), "items": len(items), "errors": len(errors)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
