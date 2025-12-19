import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

import { api } from "./lib/api";
import { auth } from "./lib/auth";

import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleGuard } from "./components/RoleGuard";

import { AppLayout } from "./layout/AppLayout";

import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";

import { Users } from "./pages/admin/Users";
import { Categories } from "./pages/admin/Categories";
import { CategoriesView } from "./pages/CategoriesView";

// Products
import { Products } from "./pages/Products";
import { ProductDetail } from "./pages/ProductDetail";
import { AdminProducts } from "./pages/admin/AdminProducts";
import { ProductEditor } from "./pages/admin/ProductEditor";

// S2PAS
import { S2pasDashboard } from "./pages/S2pasDashboard.jsx";
import { S2pasNavigator } from "./pages/S2pasNavigator.jsx";

function Shell() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    try {
      const res = await api.get("/auth/me");
      setMe(res.data);
    } catch {
      auth.clear();
      navigate("/login", { replace: true });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!auth.token) {
      navigate("/login", { replace: true });
      return;
    }
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function logout() {
    auth.clear();
    navigate("/login", { replace: true });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-600">
        Loading...
      </div>
    );
  }

  if (!me) return null;

  return (
    <Routes>
      <Route element={<AppLayout me={me} onLogout={logout} />}>
        {/* Common */}
        <Route path="/" element={<Dashboard />} />

        {/* S2PAS (admin & agent boleh) */}
        <Route path="/s2pas" element={<S2pasDashboard />} />
        <Route path="/s2pas/nav" element={<S2pasNavigator />} />

        {/* Products (common) */}
        <Route path="/products" element={<Products />} />
        <Route path="/products/:slugOrId" element={<ProductDetail />} />

        {/* Agent */}
        <Route path="/categories" element={<CategoriesView />} />

        {/* Admin */}
        <Route
          path="/admin/users"
          element={
            <RoleGuard me={me} role="admin">
              <Users />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <RoleGuard me={me} role="admin">
              <Categories />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/products"
          element={
            <RoleGuard me={me} role="admin">
              <AdminProducts />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/products/new"
          element={
            <RoleGuard me={me} role="admin">
              <ProductEditor mode="create" />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/products/:id/edit"
          element={
            <RoleGuard me={me} role="admin">
              <ProductEditor mode="edit" />
            </RoleGuard>
          }
        />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Shell />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
