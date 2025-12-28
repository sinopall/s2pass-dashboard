import { Navigate, Outlet } from "react-router";

interface ProtectedRouteProps {
  allowedRoles: string[]; 
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const storedData = localStorage.getItem("user_data");
  const user = storedData ? JSON.parse(storedData) : null;

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;