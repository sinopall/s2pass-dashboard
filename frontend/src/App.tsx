import { BrowserRouter as Router, Routes, Route } from "react-router";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
import UserList from "./pages/User/UserList";
import ProtectedRoute from "./components/auth/ProtectedRoute";

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
          <Route element={<AppLayout />}>
            
            {/* 1. PUBLIC ACCESS (Untuk Agent & Admin) */}
            <Route index path="/" element={<Home />} />
            <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
            <Route path="/services/categories" element={<CategoryPage />} />
            <Route path="/knowledge-base/products/view/:id" element={<ProductDetail />} /> 
            <Route path="/knowledge-base/scripts/view/:id" element={<ScriptDetail />} />


            {/* 2. ADMIN ONLY ACCESS (Restricted) */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                
                {/* User Management */}
                <Route path="/user-management" element={<UserList />} />
                
                {/* Write Access Product */}
                <Route path="/knowledge-base/products/create" element={<CreateProduct />} />
                <Route path="/knowledge-base/products/edit/:id" element={<CreateProduct />} />
                
                {/* Write Access Script */}
                <Route path="/knowledge-base/scripts/create" element={<CreateScript />} />
                <Route path="/knowledge-base/scripts/edit/:id" element={<CreateScript />} />
            
            </Route>

          </Route>

          {/* --- AUTH LAYOUT --- */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* --- FALLBACK --- */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
