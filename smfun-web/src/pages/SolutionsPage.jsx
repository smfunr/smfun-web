import { planData } from '../data/mockData'
import { SectionHeader, Tag } from '../components/UI'

export function SolutionsPage() {
  return (
    <div className="page-stack">
      <section className="card">
        <Tag>Project Plan</Tag>
        <SectionHeader
          title="sm.fun Product Roadmap"
          desc="Execution roadmap for product, trading, and growth rollout"
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
