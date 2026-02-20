import { templateBots } from '../data/mockData'
import { SectionHeader, Tag } from '../components/UI'

export function CreateBotPage() {
  return (
    <div className="page-stack">
      <section className="card">
        <Tag>Create Bot</Tag>
        <SectionHeader
          title="Create your bot in 3 steps"
          desc="Keep it simple: goal, instruction, risk limit. Then launch."
        />

        <form className="form-grid" onSubmit={(e) => e.preventDefault()}>
          <label>
            Bot Name
            <input placeholder="e.g. BTC Hourly Hunter" />
          </label>
          <label>
            Goal
            <input placeholder="e.g. Maximize profit with max drawdown under 10%" />
          </label>
          <label>
            Strategy Style
            <select defaultValue="">
              <option value="" disabled>
                Select style
              </option>
              <option>Conservative</option>
              <option>Balanced</option>
              <option>Aggressive</option>
              <option>Prediction-focused</option>
            </select>
          </label>
          <label>
            Bot Instruction
            <textarea rows="5" placeholder="Write the instruction for your bot..." />
          </label>
          <button className="btn btn--primary" type="submit">
            Save & Launch (Demo)
          </button>
        </form>
      </section>

      <section>
        <SectionHeader title="Quick Templates" desc="Reusable bot templates for faster start" />
        <div className="grid grid--2">
          {templateBots.map((item) => (
            <article key={item.name} className="card">
              <h3>{item.name}</h3>
              <p className="label">Use case: {item.scene}</p>
              <p>{item.prompt}</p>
              <button className="btn btn--ghost">Use Template</button>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
