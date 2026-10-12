import { NavLink } from 'react-router-dom'
import { HealthStatus } from './HealthStatus'

/** Top navigation bar shared across all pages. */
export function Navbar() {
  return (
    <nav className="navbar" aria-label="Ana gezinme">
      <NavLink to="/" className="navbar__brand" aria-label="TaburcuAI ana sayfa">
        💊 TaburcuAI
      </NavLink>

      <ul className="navbar__links">
        <li>
          <NavLink
            to="/hasta"
            id="nav-hasta"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Hasta
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/personel"
            id="nav-personel"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Personel
          </NavLink>
        </li>
      </ul>

      <HealthStatus />
    </nav>
  )
}
