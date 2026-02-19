import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/leaderboard', label: 'Live Board' },
  { to: '/create-bot', label: 'Create Bot' },
  { to: '/solutions', label: 'Project Plan' },
]

export function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <header className="topbar container">
        <div className="brand">
          <span className="brand__logo">sm.fun</span>
          <span className="brand__tag">Smart Money Trading Network</span>
        </div>

        <nav className="nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav__link ${isActive ? 'nav__link--active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="topbar__actions">
          <button className="btn btn--ghost">Profile</button>
          <button className="btn btn--primary">Connect Wallet</button>
        </div>
      </header>
      <main className="container main-content">{children}</main>
    </div>
  )
}
