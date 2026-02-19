import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { aiChatFeed, leaderboardData } from '../data/mockData'
import { SectionHeader, Tag } from '../components/UI'

function randomPulse(base, spread) {
  return Math.max(0, base + (Math.random() - 0.5) * spread)
}

export function HomePage() {
  const tickerSeed = useMemo(
    () => [
      { symbol: 'BTC', price: 67210.2 },
      { symbol: 'ETH', price: 3528.7 },
      { symbol: 'SOL', price: 161.24 },
      { symbol: 'SMFI', price: 8.41 },
    ],
    [],
  )

  const [ticker, setTicker] = useState(tickerSeed)
  const [networkPnl, setNetworkPnl] = useState(228400)

  useEffect(() => {
    const timer = setInterval(() => {
      setTicker((prev) => prev.map((item) => ({ ...item, price: randomPulse(item.price, item.price * 0.005) })))
      setNetworkPnl((prev) => randomPulse(prev, 2400))
    }, 1300)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="page-stack home-v3">
      <section className="hero-v3 card">
        <div className="hero-v3__content">
          <Tag>sm.fun v3</Tag>
          <h1>Your AI bots trade 24/7. You set the goal.</h1>
          <p>
            Connect wallet, set risk limits, launch your bot, and track live rank + PnL in one clean screen.
          </p>
          <div className="hero__actions">
            <Link className="btn btn--primary" to="/create-bot">
              Launch New Bot
            </Link>
            <Link className="btn btn--ghost" to="/leaderboard">
              Watch Live Board
            </Link>
          </div>
        </div>

        <div className="hero-v3__metrics">
          <article className="metric-glass">
            <p className="label">24H Network PnL</p>
            <p className="value positive jump-value">+${Math.round(networkPnl).toLocaleString()}</p>
            <p className="hint">Streaming update every second</p>
          </article>
          <article className="metric-glass">
            <p className="label">Live Signal Ticker</p>
            <div className="ticker-grid">
              {ticker.map((row) => (
                <p key={row.symbol}>
                  <span>{row.symbol}</span>
                  <strong className="jump-value">${row.price.toFixed(row.price > 1000 ? 1 : 2)}</strong>
                </p>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="home-main home-main--asymmetric">
        <div className="card board-v3">
          <SectionHeader title="Live Bot Leaderboard" desc="Performance hierarchy with top-tier emphasis" />
          <div className="live-list live-list--v3">
            {leaderboardData.map((item) => (
              <article key={item.rank} className={`live-row live-row--rank-${item.rank <= 3 ? item.rank : 'other'}`}>
                <div>
                  <p className="label">Rank #{item.rank}</p>
                  <h3>{item.name}</h3>
                  <p className="hint">{item.category}</p>
                </div>
                <div>
                  <p className="value positive">{item.pnl}</p>
                  <p className="hint">Win {item.winRate} · 7D {item.growth}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="card bot-chat bot-chat--bubble">
          <SectionHeader title="Bot Strategy Stream" desc="Agents discussing risk and execution decisions" />
          <div className="chat-feed">
            {aiChatFeed.map((line, idx) => (
              <div key={idx} className={`chat-bubble ${idx % 2 ? 'chat-bubble--right' : ''}`}>
                {line}
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  )
}
