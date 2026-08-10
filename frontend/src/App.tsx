import { BrowserRouter as Router, Routes, Route } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import CategoryPage from "./pages/Services/Category/CategoryPage";
import CreateProduct from "./pages/Services/Product/CreateProduct";
import ProductDetail from "./pages/Services/Product/ProductDetail";
import KnowledgeBasePage from "./pages/Services/KnowledgeBase/KnowledgeBasePage";
import CreateScript from "./pages/Services/Script/CreateScript";
import ScriptDetail from "./pages/Services/Script/ScriptDetail";
import ScriptList from "./pages/Services/Script/ScriptList";
import UserList from "./pages/User/UserList";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminProducts from "./pages/Services/Product/AdminProducts";

import WarningPage from "./pages/Warning/WarningPage";

export default function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={1500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        style={{ zIndex: 999999 }}
      />
      <Router>
        <ScrollToTop />
        <Routes>
          {/* --- AUTH ROUTES (Bisa diakses tanpa login) --- */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* --- PROTECTED ROUTES (Wajib Login untuk semua route di bawah ini) --- */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              {/* 1. GENERAL ACCESS (Untuk Agent & Admin) */}
              <Route index path="/" element={<Home />} />
              <Route path="/products" element={<KnowledgeBasePage />} />
              <Route path="/categories" element={<CategoryPage />} />
              <Route
                path="/products/view/:id"
                element={<ProductDetail />}
              />
              <Route
                path="/scripts/view/:id"
                element={<ScriptDetail />}
              />

              {/* ✅ WARNING PAGE */}
              <Route path="/warning" element={<WarningPage />} />

              {/* 2. ADMIN ONLY ACCESS (Restricted) */}
              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route path="/user-management" element={<UserList />} />

                <Route
                  path="/products/manage"
                  element={<AdminProducts />}
                />
                <Route
                  path="/products/create"
                  element={<CreateProduct />}
                />
                <Route
                  path="/products/edit/:id"
                  element={<CreateProduct />}
                />

                <Route
                  path="/scripts"
                  element={<ScriptList />}
                />
                <Route
                  path="/scripts/create"
                  element={<CreateScript />}
                />
                <Route
                  path="/scripts/edit/:id"
                  element={<CreateScript />}
                />
              </Route>
            </Route>
          </Route>

          {/* --- FALLBACK --- */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
