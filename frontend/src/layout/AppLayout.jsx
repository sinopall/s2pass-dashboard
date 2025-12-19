import { NavLink, Outlet } from "react-router-dom";

const linkClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
    isActive ? "bg-bjb-navy text-white" : "text-slate-700 hover:bg-slate-100"
  }`;

export function AppLayout({ me, onLogout }) {
  return (
    <div className="min-h-screen bg-bjb-soft">
      <div className="mx-auto max-w-6xl px-6 py-6">
        {/* Top bar */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-bjb-navy flex items-center justify-center shadow">
              <span className="h-2.5 w-2.5 rounded-full bg-bjb-gold" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900">s2pas</div>
              <div className="text-xs text-slate-500">Knowledge Navigation • BJB style</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white px-4 py-2 shadow-sm border border-slate-100">
              <div className="text-xs text-slate-500">Signed in</div>
              <div className="text-sm font-semibold text-slate-900">
                {me.username} <span className="text-xs text-slate-400">• {me.role}</span>
              </div>
            </div>
            <button onClick={onLogout} className="rounded-2xl bg-bjb-navy px-4 py-2 text-sm font-semibold text-white hover:opacity-95">
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="rounded-3xl bg-white p-4 shadow-sm border border-slate-100 h-fit">
            <div className="text-xs font-semibold text-slate-400 mb-2">MENU</div>

            <nav className="space-y-1">
              <NavLink to="/" className={linkClass} end>
                Dashboard
              </NavLink>

              {/* Shared (admin & agent) */}
              <NavLink to="/products" className={linkClass}>
                Products
              </NavLink>

              {me.role === "admin" && (
                <>
                  <div className="pt-3 text-xs font-semibold text-slate-400">ADMIN</div>

                  <NavLink to="/admin/users" className={linkClass}>
                    Management Akun
                  </NavLink>

                  <NavLink to="/admin/categories" className={linkClass}>
                    Category Management
                  </NavLink>

                  <NavLink to="/admin/products" className={linkClass}>
                    Product Management
                  </NavLink>
                </>
              )}

              {me.role === "agent" && (
                <>
                  <div className="pt-3 text-xs font-semibold text-slate-400">AGENT</div>
                  <NavLink to="/categories" className={linkClass}>
                    Categories (View)
                  </NavLink>
                </>
              )}
            </nav>

            <div className="mt-5 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-100">
              <div className="font-semibold">Nuansa BJB</div>
              <div className="mt-1">Navy + Gold, clean, cepat buat agent.</div>
            </div>
          </aside>

          {/* Content */}
          <main className="space-y-5">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
