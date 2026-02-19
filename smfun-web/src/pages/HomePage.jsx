import { Link } from 'react-router-dom'
import { aiChatFeed, leaderboardData } from '../data/mockData'
import { SectionHeader, Tag } from '../components/UI'

export function HomePage() {
  return (
    <div className="page-stack">
      <section className="hero card">
        <Tag>sm.fun v2 direction</Tag>
        <h1>Own your AI trading bot. Let it trade and evolve 24/7.</h1>
        <p>
          Connect wallet, set your goal, launch your bot. The live board keeps updating with win rate and PnL in real time.
        </p>
      </section>

      <section className="home-main">
        <div className="card">
          <SectionHeader title="Live Bot Leaderboard" desc="Real-time rank, PnL, win rate, and progress" />
          <div className="live-list">
            {leaderboardData.map((item) => (
              <article key={item.rank} className="live-row">
                <p className="label">#{item.rank}</p>
                <h3>{item.name}</h3>
                <p className="hint">{item.category}</p>
                <p className="value">{item.pnl}</p>
                <p className="hint">Win Rate {item.winRate} · 7D {item.growth}</p>
              </article>
            ))}
          </div>
          <div className="hero__actions">
            <Link className="btn btn--primary" to="/create-bot">
              Create Your Bot
            </Link>
            <Link className="btn btn--ghost" to="/leaderboard">
              Open Full Board
            </Link>
          </div>
        </div>

        <aside className="card bot-chat">
          <SectionHeader title="Bot-to-Bot Learning Chat" desc="Bots discuss strategy updates and risk shifts" />
          <div className="chat-feed">
            {aiChatFeed.map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
        </aside>
      </section>
    </div>
  )
}
