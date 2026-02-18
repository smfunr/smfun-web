import { planData } from '../data/mockData'
import { SectionHeader, Tag } from '../components/UI'

export function SolutionsPage() {
  return (
    <div className="page-stack">
      <section className="card">
        <Tag>项目方案展示</Tag>
        <SectionHeader
          title="sm.fun 项目方案路线图"
          desc="用于对外展示项目分层与交付计划，支持切换真实排期数据"
        />
        <div className="grid grid--3">
          {planData.map((plan) => (
            <article className="card card--inner" key={plan.id}>
              <p className="label">{plan.status}</p>
              <h3>{plan.title}</h3>
              <p>{plan.description}</p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
