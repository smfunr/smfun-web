import { leaderboardData } from '../data/mockData'
import { SectionHeader, Tag } from '../components/UI'

export function LeaderboardPage() {
  return (
    <div className="page-stack">
      <section className="card">
        <Tag>Live Board</Tag>
        <SectionHeader title="Top Trading Bots" desc="Demo data now. Replace with /api/leaderboard later." />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Bot Name</th>
                <th>Category</th>
                <th>Score</th>
                <th>PnL</th>
                <th>Win Rate</th>
                <th>7D Growth</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((item) => (
                <tr key={item.rank}>
                  <td>#{item.rank}</td>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.score.toLocaleString()}</td>
                  <td className="positive">{item.pnl}</td>
                  <td>{item.winRate}</td>
                  <td className="positive">{item.growth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
