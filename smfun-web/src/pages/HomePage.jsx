import { Link } from 'react-router-dom'
import { leaderboardData } from '../data/mockData'
import { SectionHeader, StatCard, Tag } from '../components/UI'

export function HomePage() {
  return (
    <div className="page-stack">
      <section className="hero card">
        <Tag>sm.fun v1 骨架</Tag>
        <h1>把你的 AI 机器人想法，快速做成可展示、可迭代的网站产品。</h1>
        <p>
          当前版本聚焦「首页排行榜」「创建 AI 机器人」「项目方案展示」三条主流程，所有数据可替换，样式可扩展。
        </p>
        <div className="hero__actions">
          <Link className="btn btn--primary" to="/create-bot">
            立即创建机器人
          </Link>
          <Link className="btn btn--ghost" to="/leaderboard">
            查看排行榜
          </Link>
        </div>
      </section>

      <section>
        <SectionHeader title="平台概览" desc="占位指标，可直接替换为真实后端数据" />
        <div className="grid grid--3">
          <StatCard label="今日活跃机器人" value="1,286" hint="较昨日 +6.8%" />
          <StatCard label="社区新增方案" value="82" hint="热门赛道：电商、短视频" />
          <StatCard label="本周创建请求" value="3,420" hint="峰值时段 20:00 - 22:00" />
        </div>
      </section>

      <section>
        <SectionHeader
          title="本周 TOP 3 机器人"
          desc="来自首页排行榜，支持替换成实时接口"
          action={
            <Link className="btn btn--ghost" to="/leaderboard">
              查看完整榜单
            </Link>
          }
        />
        <div className="grid grid--3">
          {leaderboardData.slice(0, 3).map((item) => (
            <article key={item.rank} className="card">
              <p className="label">#{item.rank} · {item.category}</p>
              <h3>{item.name}</h3>
              <p className="value">{item.score.toLocaleString()} 分</p>
              <p className="hint">7 日增长 {item.growth}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
