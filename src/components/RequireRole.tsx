import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { Role } from '../types'
import { useStore } from '../lib/store'
import { portalHome } from './PublicLayout'

export default function RequireRole({ role }: { role: Role }) {
  const { user } = useStore()
  const loc = useLocation()
  if (!user) return <Navigate to="/masuk" replace state={{ from: loc.pathname + loc.search }} />
  if (user.role !== role) return <Navigate to={portalHome(user.role)} replace />
  return <Outlet />
}
