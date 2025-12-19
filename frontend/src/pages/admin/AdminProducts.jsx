import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { useToast } from "../../components/ToastProvider";

export function AdminProducts() {
  const toast = useToast();
  const [items, setItems] = useState([]);

  async function load() {
    try {
      const res = await api.get("/products", { params: { page: 1, limit: 50 } });
      setItems(res.data.items || []);
    } catch (e) {
      toast.error("Gagal load products", e?.response?.data?.error ?? "Unknown");
    }
  }

  useEffect(() => { load(); }, []);

  async function del(id) {
    if (!confirm("Hapus product ini?")) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Berhasil", "Product berhasil dihapus");
      await load();
    } catch (e) {
      toast.error("Gagal delete", e?.response?.data?.error ?? "Unknown");
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <div className="text-lg font-bold text-slate-900">Product Management</div>
          <div className="mt-1 text-sm text-slate-500">Create / Edit / Delete product knowledge.</div>
        </div>
        <Link to="/admin/products/new" className="btn-primary">+ Create Product</Link>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="divide-y">
          {items.map((p) => (
            <div key={p.id} className="py-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">{p.title}</div>
                <div className="text-xs text-slate-500">Last update: {new Date(p.updated_at).toLocaleString()}</div>

              </div>

              <div className="flex gap-2">
                <Link
                  to={`/admin/products/${p.id}/edit`}
                  className="rounded-2xl px-4 py-2 text-sm font-semibold bg-bjb-navy/10 text-bjb-navy hover:bg-bjb-navy/15"
                >
                  Edit
                </Link>
                <button
                  onClick={() => del(p.id)}
                  className="rounded-2xl px-4 py-2 text-sm font-semibold bg-red-50 text-red-700 hover:bg-red-100"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}

          {items.length === 0 && <div className="py-8 text-center text-sm text-slate-500">Belum ada product.</div>}
        </div>
      </div>
    </div>
  );
}
