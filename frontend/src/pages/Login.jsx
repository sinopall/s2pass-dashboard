import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { auth } from "../lib/auth";
import { useToast } from "../components/ToastProvider";

export function Login() {
  const nav = useNavigate();
  const toast = useToast();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin1234");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { username, password });
      auth.setToken(res.data.access_token);
      toast.success("Login berhasil", `Halo ${res.data?.user?.username ?? username}`);
      nav("/", { replace: true });
    } catch (e) {
      toast.error("Login gagal", e?.response?.data?.error ?? "Periksa username / password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bjb-soft">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 items-center">
          <div className="rounded-3xl bg-gradient-to-br from-bjb-navy to-slate-900 p-10 text-white shadow-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-bjb-gold" />
              s2pas • Knowledge Navigation
            </div>
            <h1 className="mt-5 text-3xl font-bold leading-tight">
              Nuansa BJB. UI elegan. <br /> Kerja agent makin cepat.
            </h1>
            <p className="mt-3 text-sm text-white/80">
              Login untuk mengakses knowledge tree dan (admin) melakukan manajemen akun & kategori.
            </p>

            <div className="mt-10 rounded-2xl bg-white/10 p-4 text-xs text-white/80">
              Tips: untuk dev, seed admin: <b>admin / admin1234</b>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-semibold text-slate-900">Login</div>
                <div className="mt-1 text-sm text-slate-500">Masuk untuk melanjutkan.</div>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-bjb-navy/10 flex items-center justify-center">
                <span className="h-2.5 w-2.5 rounded-full bg-bjb-gold" />
              </div>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700">Username</label>
                <input
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-bjb-navy/10"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="contoh: admin"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-bjb-navy/10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <button
                disabled={loading}
                className="w-full rounded-2xl bg-bjb-navy px-4 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-60"
              >
                {loading ? "Memproses..." : "Masuk"}
              </button>

              <div className="text-xs text-slate-500">
                Dengan login, kamu setuju menggunakan sistem sesuai kebijakan internal.
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
