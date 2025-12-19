import { Navigate } from "react-router-dom";

export function RoleGuard({ me, role, children }) {
  if (!me) return null;
  if (me.role !== role) return <Navigate to="/" replace />;
  return children;
}
