import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: '首页' },
  { to: '/leaderboard', label: '首页排行榜' },
  { to: '/create-bot', label: '创建AI机器人' },
  { to: '/solutions', label: '项目方案展示' },
]

export function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <header className="topbar container">
        <div className="brand">
          <span className="brand__logo">sm.fun</span>
          <span className="brand__tag">AI 创作型社区</span>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav__link ${isActive ? 'nav__link--active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="container main-content">{children}</main>
    </div>
  )
}
