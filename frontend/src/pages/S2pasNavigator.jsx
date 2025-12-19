import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { ArrowLeft, RefreshCw, ChevronRight } from "lucide-react";
import { S2PAS } from "../lib/s2pas";

function norm(s) {
  return (s || "").trim().toLowerCase();
}

function findRootByName(roots, name) {
  return (roots || []).find((x) => norm(x.name) === norm(name)) || null;
}

export function S2pasNavigator() {
  const nav = useNavigate();
  const toast = useToast();

  const [roots, setRoots] = useState([]);
  const [path, setPath] = useState([]);
  const [children, setChildren] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const breadcrumb = useMemo(() => path.map((p) => p.name).join(" > "), [path]);

  async function loadRoots() {
    setLoading(true);
    try {
      const res = await api.get("/categories/tree");
      setRoots(res.data || []);
    } catch (e) {
      toast.error("Gagal load category roots", e?.response?.data?.error ?? "Unknown");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetAll() {
    setPath([]);
    setChildren([]);
    setProducts([]);
  }

  async function loadChildren(parentId) {
    const res = await api.get("/categories/children", { params: { parentId } });
    return res.data || [];
  }

  async function loadProductsByCategory(categoryId) {
    const res = await api.get("/products", {
      params: { categoryId, page: 1, limit: 50 },
    });
    return res.data?.items || [];
  }

  async function pickRoot(name) {
    const root = findRootByName(roots, name);
    if (!root) return;

    setBusy(true);
    try {
      const kids = await loadChildren(root.id);
      setPath([{ id: root.id, name: root.name }]);
      setChildren(kids);
      setProducts([]);
    } catch (e) {
      toast.error("Gagal load sub category", e?.response?.data?.error ?? "Unknown");
    } finally {
      setBusy(false);
    }
  }

  async function pickCategory(node) {
    setBusy(true);
    try {
      const kids = await loadChildren(node.id);

      setPath((prev) => [...prev, { id: node.id, name: node.name }]);
      setProducts([]);

      if (kids.length > 0) {
        setChildren(kids);
        return;
      }

      // leaf → load products
      setChildren([]);
      const items = await loadProductsByCategory(node.id);
      setProducts(items);

      // auto-open kalau cuma 1
      if (items.length === 1) {
        S2PAS.setReturnTo("/s2pas/nav");
        nav(`/products/${items[0].slug}`, { state: { fromS2pas: true } });
      }
    } catch (e) {
      toast.error("Gagal load data", e?.response?.data?.error ?? "Unknown");
    } finally {
      setBusy(false);
    }
  }

  // ✅ FIX: Back bertingkat sampai Greeting (/s2pas)
  async function goBackOne() {
    if (busy) return;

    // kalau lagi di root (path kosong) => balik ke dashboard greeting
    if (path.length === 0) {
      nav("/s2pas");
      return;
    }

    // kalau path tinggal root => reset ke root screen (path kosong)
    if (path.length === 1) {
      resetAll();
      return;
    }

    // normal: naik 1 level
    const nextPath = path.slice(0, -1);
    const current = nextPath[nextPath.length - 1];
    setPath(nextPath);
    setProducts([]);

    setBusy(true);
    try {
      const kids = await loadChildren(current.id);
      setChildren(kids);
    } catch (e) {
      toast.error("Gagal back", e?.response?.data?.error ?? "Unknown");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
        Loading tree...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-bold text-slate-900">S2PAS Navigator</div>
            <div className="mt-1 text-sm text-slate-500">
              Pilih kategori → sub kategori → leaf → buka product detail (slug).
            </div>

            {path.length > 0 && (
              <div className="mt-2 text-xs text-slate-600">
                Path: <b>{breadcrumb}</b>
              </div>
            )}

            {busy && <div className="mt-2 text-xs text-slate-400">Loading...</div>}
          </div>

          <button
            type="button"
            onClick={() => nav("/s2pas")}
            className="rounded-2xl bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Greeting
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={goBackOne}
          className="btn-ghost bg-white border border-slate-200"
          disabled={busy}
        >
          <span className="inline-flex items-center gap-2">
            <ArrowLeft size={16} /> Back
          </span>
        </button>

        <button
          type="button"
          onClick={resetAll}
          className="btn-ghost bg-white border border-slate-200"
          disabled={busy}
        >
          Reset
        </button>

        <button
          type="button"
          onClick={loadRoots}
          className="btn-ghost bg-white border border-slate-200 ml-auto"
          disabled={busy}
        >
          <span className="inline-flex items-center gap-2">
            <RefreshCw size={16} /> Reload
          </span>
        </button>
      </div>

      {/* Roots */}
      {path.length === 0 && (
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="text-sm font-bold text-slate-900 mb-3">Main Category</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {["Informasi", "Request", "Complaint"].map((x) => (
              <button
                key={x}
                type="button"
                onClick={() => pickRoot(x)}
                disabled={busy}
                className="rounded-3xl border border-slate-200 bg-white p-5 text-left hover:bg-slate-50 disabled:opacity-60"
              >
                <div className="text-lg font-bold text-slate-900">{x}</div>
                <div className="text-xs text-slate-500 mt-1">
                  Klik untuk lihat sub category
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Children */}
      {path.length > 0 && children.length > 0 && (
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="text-sm font-bold text-slate-900 mb-3">Sub Category</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {children.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => pickCategory(c)}
                disabled={busy}
                className="rounded-3xl border border-slate-200 bg-white p-5 text-left hover:bg-slate-50 disabled:opacity-60"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-base font-bold text-slate-900">{c.name}</div>
                    <div className="text-xs text-slate-500 mt-1">Klik untuk masuk</div>
                  </div>
                  <ChevronRight className="text-slate-400" size={18} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      {path.length > 0 && children.length === 0 && products.length > 1 && (
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="text-sm font-bold text-slate-900 mb-3">Products di kategori ini</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  S2PAS.setReturnTo("/s2pas/nav");
                  nav(`/products/${p.slug}`, { state: { fromS2pas: true } });
                }}
                disabled={busy}
                className="rounded-3xl border border-slate-200 bg-white p-5 text-left hover:bg-slate-50 disabled:opacity-60"
              >
                <div className="text-base font-bold text-slate-900">{p.title}</div>
                <div className="text-xs text-slate-500 mt-1">/{p.slug}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty leaf */}
      {path.length > 0 && children.length === 0 && products.length === 0 && !busy && (
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="text-sm text-slate-500">Leaf category ini belum punya product.</div>
        </div>
      )}
    </div>
  );
}
