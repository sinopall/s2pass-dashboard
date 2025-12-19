import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { BreakingTicker } from "../components/BreakingTicker";

function norm(s) { return (s || "").trim().toLowerCase(); }

export function Products() {
  const toast = useToast();

  const [breaking, setBreaking] = useState([]);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // cascading filters
  const mainOptions = ["Informasi", "Request", "Complaint"];
  const [root, setRoot] = useState("Informasi");
  const [levels, setLevels] = useState([""]); // sub1..n (text/name)
  const [options, setOptions] = useState({}); // options per level index (1..)
  const [categoryId, setCategoryId] = useState(0); // selected leaf id (based on name match)

  const [treeRoots, setTreeRoots] = useState([]);

  async function loadBreaking() {
    try {
      const res = await api.get("/products/breaking?limit=10");
      setBreaking(res.data || []);
    } catch {}
  }

  async function loadTreeRoots() {
    try {
      const res = await api.get("/categories/tree");
      setTreeRoots(res.data || []);
    } catch {}
  }

  function findRootByName(name) {
    return (treeRoots || []).find((n) => norm(n.name) === norm(name)) || null;
  }

  // load options based on root + selected chain
  useEffect(() => {
    async function run() {
      const next = {};
      const rootNode = findRootByName(root);
      if (!rootNode) { setOptions(next); setCategoryId(0); return; }

      // level-1 options
      const r1 = await api.get("/categories/children", { params: { parentId: rootNode.id } });
      next[1] = r1.data || [];

      let parentId = rootNode.id;
      let lastMatchedId = 0;

      for (let i = 0; i < levels.length; i++) {
        const name = (levels[i] || "").trim();
        if (!name) break;
        const list = next[i + 1] || [];
        const found = list.find((c) => norm(c.name) === norm(name));
        if (!found) break;

        lastMatchedId = found.id;
        parentId = found.id;

        const resp = await api.get("/categories/children", { params: { parentId } });
        next[i + 2] = resp.data || [];
      }

      setOptions(next);
      setCategoryId(lastMatchedId);
    }

    if (!treeRoots.length) return;
    run().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, levels, treeRoots]);

  async function loadProducts() {
    try {
      const res = await api.get("/products", {
        params: { q, page, limit, categoryId: categoryId || 0 },
      });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      toast.error("Gagal load products", e?.response?.data?.error ?? "Unknown error");
    }
  }

  useEffect(() => {
    loadBreaking();
    loadTreeRoots();
  }, []);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page, categoryId]);

  function setLevel(idx, val) {
    setLevels((prev) => {
      const copy = [...prev];
      copy[idx] = val;
      for (let i = idx + 1; i < copy.length; i++) copy[i] = "";
      return copy;
    });
    setPage(1);
  }

  function addLevel() { setLevels((p) => [...p, ""]); }
  function clearFilter() { setLevels([""]); setCategoryId(0); setPage(1); }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-5">
      <BreakingTicker items={breaking} />

      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="text-lg font-bold text-slate-900">Products</div>
        <div className="mt-1 text-sm text-slate-500">Cari knowledge cepat via search atau filter category.</div>

        {/* Search */}
        <div className="mt-4 flex gap-2">
          <input
            className="input flex-1"
            placeholder="Search judul product..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
          />
          <button onClick={() => { setQ(""); setPage(1); }} className="btn-ghost">
            Clear
          </button>
        </div>

        {/* Category filters row */}
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 border border-slate-100">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <div className="text-xs font-semibold text-slate-700">Main Category</div>
              <select className="input mt-1" value={root} onChange={(e) => { setRoot(e.target.value); setLevels([""]); setPage(1); }}>
                {mainOptions.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>

            {levels.map((val, idx) => {
              const levelIndex = idx + 1;
              const opts = options[levelIndex] || [];
              return (
                <div key={levelIndex}>
                  <div className="text-xs font-semibold text-slate-700">Sub level-{levelIndex}</div>
                  <select className="input mt-1" value={val} onChange={(e) => setLevel(idx, e.target.value)}>
                    <option value="">-- pilih --</option>
                    {opts.map((o) => <option key={o.id} value={o.name}>{o.name}</option>)}
                  </select>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex gap-2 flex-wrap">
            <button className="btn-ghost bg-white border border-slate-200" onClick={addLevel}>+ tambah level filter</button>
            <button className="btn-ghost bg-white border border-slate-200" onClick={clearFilter}>Reset filter</button>
            <div className="ml-auto text-xs text-slate-500">
              Selected categoryId: <b>{categoryId || "-"}</b>
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-slate-900">Result</div>
          <div className="text-xs text-slate-500">
            Total: <b>{total}</b>
          </div>
        </div>

        <div className="mt-4 divide-y">
          {items.map((p) => (
            <Link
              key={p.id}
              to={`/products/${p.id}`}
              className="block py-4 hover:bg-slate-50 rounded-2xl px-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">{p.title}</div>
                  <div className="mt-1 text-xs text-slate-500">Product #{p.id} • Category #{p.category_id}</div>
                </div>
                {p.is_breaking && (
                  <span className="rounded-full bg-bjb-gold/20 text-bjb-navy px-3 py-1 text-xs font-bold">
                    BREAKING
                  </span>
                )}
              </div>
            </Link>
          ))}
          {items.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-500">Tidak ada data.</div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-5 flex items-center justify-between">
          <button
            className="btn-ghost border border-slate-200 bg-white"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>

          <div className="text-sm text-slate-600">
            Page <b>{page}</b> / {totalPages}
          </div>

          <button
            className="btn-ghost border border-slate-200 bg-white"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
