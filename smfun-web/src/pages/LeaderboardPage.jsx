import { leaderboardData } from '../data/mockData'
import { SectionHeader, Tag } from '../components/UI'

export function LeaderboardPage() {
  return (
    <div className="page-stack">
      <section className="card">
        <Tag>首页排行榜</Tag>
        <SectionHeader
          title="AI 机器人热度榜"
          desc="演示版采用本地占位数据，可替换为 API：/api/leaderboard"
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>排名</th>
                <th>机器人名称</th>
                <th>分类</th>
                <th>热度分</th>
                <th>7日增长</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((item) => (
                <tr key={item.rank}>
                  <td>#{item.rank}</td>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.score.toLocaleString()}</td>
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
