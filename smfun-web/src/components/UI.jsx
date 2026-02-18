export function SectionHeader({ title, desc, action }) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {desc && <p>{desc}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatCard({ label, value, hint }) {
  return (
    <article className="card stat-card">
      <p className="label">{label}</p>
      <p className="value">{value}</p>
      {hint && <p className="hint">{hint}</p>}
    </article>
  )
}

export function Tag({ children }) {
  return <span className="tag">{children}</span>
}
