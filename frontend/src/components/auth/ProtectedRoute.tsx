import { Navigate, Outlet } from "react-router";

interface ProtectedRouteProps {
  // Kalau tidak diisi -> cukup wajib login (role apapun boleh masuk).
  // Kalau diisi -> selain wajib login, role user juga harus ada di daftar ini.
  allowedRoles?: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const storedData = localStorage.getItem("user_data");
  const user = storedData ? JSON.parse(storedData) : null;

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
