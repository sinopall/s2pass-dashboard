import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { Modal } from "../../components/Modal";
import { useToast } from "../../components/ToastProvider";

function norm(s) { return (s || "").trim().toLowerCase(); }

export function Categories() {
  const toast = useToast();
  const mainOptions = useMemo(() => ["Informasi", "Request", "Complaint"], []);

  const [tree, setTree] = useState([]);
  const [selected, setSelected] = useState(null); // node object from tree list
  const [children, setChildren] = useState([]);
  const [loadingTree, setLoadingTree] = useState(true);
  const [loadingChildren, setLoadingChildren] = useState(false);

  // modal add path
  const [openAdd, setOpenAdd] = useState(false);
  const [levels, setLevels] = useState(["Informasi", ""]); // root + sub1 mandatory
  const [options, setOptions] = useState({}); // options per level index

  // rename
  const [openRename, setOpenRename] = useState(false);
  const [renameName, setRenameName] = useState("");

  async function loadTree() {
    setLoadingTree(true);
    try {
      const res = await api.get("/categories/tree");
      setTree(res.data || []);
      // auto select first root if none selected
      if (!selected && (res.data || []).length > 0) setSelected(res.data[0]);
    } catch (e) {
      toast.error("Gagal load tree", e?.response?.data?.error ?? "Unknown error");
    } finally {
      setLoadingTree(false);
    }
  }

  useEffect(() => { loadTree(); }, []);

  async function loadChildren(parentId) {
    setLoadingChildren(true);
    try {
      const res = await api.get("/categories/children", { params: { parentId } });
      setChildren(res.data || []);
    } catch (e) {
      toast.error("Gagal load subcategory", e?.response?.data?.error ?? "Unknown error");
    } finally {
      setLoadingChildren(false);
    }
  }

  // when selected changes -> load its children
  useEffect(() => {
    if (!selected?.id) return;
    loadChildren(selected.id);
  }, [selected?.id]);

  function flattenTree(nodes, depth = 0, out = []) {
    for (const n of nodes) {
      out.push({ ...n, _depth: depth });
      if (n.children?.length) flattenTree(n.children, depth + 1, out);
    }
    return out;
  }

  const flat = useMemo(() => flattenTree(tree), [tree]);

  // ---------- Add Path Modal logic ----------
  function findRootByName(name) {
    const key = norm(name);
    return (tree || []).find((n) => norm(n.name) === key) || null;
  }

  useEffect(() => {
    async function run() {
      try {
        const next = {};
        const root = findRootByName(levels[0]);
        if (!root) { setOptions(next); return; }

        const r1 = await api.get("/categories/children", { params: { parentId: root.id } });
        next[1] = r1.data || [];

        let parentId = root.id;
        for (let i = 1; i < levels.length; i++) {
          const name = (levels[i] || "").trim();
          if (!name) break;
          const list = next[i] || [];
          const found = list.find((c) => norm(c.name) === norm(name));
          if (!found) break;
          parentId = found.id;
          const resp = await api.get("/categories/children", { params: { parentId } });
          next[i + 1] = resp.data || [];
        }
        setOptions(next);
      } catch {
        // ignore
      }
    }

    if (!openAdd) return;
    if (!tree?.length) return;
    run();
  }, [openAdd, levels, tree]);

  function setLevel(index, value) {
    setLevels((prev) => {
      const copy = [...prev];
      copy[index] = value;
      for (let i = index + 1; i < copy.length; i++) copy[i] = "";
      return copy;
    });
  }

  function addLevel() { setLevels((p) => [...p, ""]); }
  function removeLastLevel() { setLevels((p) => (p.length <= 2 ? p : p.slice(0, p.length - 1))); }

  async function submitPath() {
    const path = levels.map((x) => (x || "").trim()).filter(Boolean);
    if (path.length < 2) return toast.error("Validasi", "Subcategory level-1 wajib diisi");
    if (!mainOptions.some((x) => norm(x) === norm(path[0]))) return toast.error("Validasi", "Root harus Informasi/Request/Complaint");

    try {
      await api.post("/categories/path", { path });
      toast.success("Berhasil", "Category path berhasil dibuat/di-upsert");
      setOpenAdd(false);
      setLevels([levels[0] || "Informasi", ""]);
      await loadTree();
      // optional: reselect root
      const root = findRootByName(path[0]);
      if (root) setSelected(root);
    } catch (e) {
      toast.error("Gagal", e?.response?.data?.error ?? "Unknown error");
    }
  }

  // ---------- Rename / Delete ----------
  function openRenameModal() {
    if (!selected) return;
    setRenameName(selected.name);
    setOpenRename(true);
  }

  async function submitRename() {
    if (!selected?.id) return;
    if (!renameName.trim()) return toast.error("Validasi", "Nama tidak boleh kosong");
    try {
      await api.put(`/categories/${selected.id}`, { name: renameName.trim() });
      toast.success("Berhasil", "Category berhasil di-rename");
      setOpenRename(false);
      await loadTree();
    } catch (e) {
      toast.error("Gagal rename", e?.response?.data?.error ?? "Unknown error");
    }
  }

  async function deleteSelected() {
    if (!selected?.id) return;
    if (!confirm(`Hapus category "${selected.name}"? (Jika punya child akan ditolak)`)) return;
    try {
      await api.delete(`/categories/${selected.id}`);
      toast.success("Berhasil", "Category berhasil dihapus");
      setSelected(null);
      setChildren([]);
      await loadTree();
    } catch (e) {
      toast.error("Gagal delete", e?.response?.data?.error ?? "Unknown error");
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <div className="text-lg font-bold text-slate-900">Category Management</div>
          <div className="mt-1 text-sm text-slate-500">Kiri list/tree, kanan detail + subcategory. Add/Rename/Delete elegan.</div>
        </div>
        <button onClick={() => setOpenAdd(true)} className="btn-primary">
          + Add Category Path
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[360px_1fr]">
        {/* LEFT: List/Tree (flattened list with indent) */}
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-slate-900">Category List</div>
            <button onClick={loadTree} className="rounded-2xl px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200">
              Refresh
            </button>
          </div>

          <div className="mt-4">
            {loadingTree ? (
              <div className="text-sm text-slate-500">Loading...</div>
            ) : (
              <div className="space-y-1">
                {flat.map((n) => {
                  const active = selected?.id === n.id;
                  return (
                    <button
                      key={n.id}
                      onClick={() => setSelected(n)}
                      className={`w-full text-left rounded-2xl px-3 py-2 text-sm border ${
                        active ? "border-bjb-navy bg-bjb-navy/5" : "border-transparent hover:bg-slate-50"
                      }`}
                      style={{ paddingLeft: 12 + n._depth * 16 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`font-semibold ${active ? "text-bjb-navy" : "text-slate-900"}`}>{n.name}</div>
                        <div className="text-xs text-slate-400">#{n.id}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Detail + children */}
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
          {!selected ? (
            <div className="text-sm text-slate-500">Pilih category di kiri untuk melihat detail.</div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-500">Selected</div>
                  <div className="text-xl font-bold text-slate-900">{selected.name}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    ID #{selected.id} • Level {selected.level ?? "-"}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={openRenameModal} className="rounded-2xl px-4 py-2 text-sm font-semibold bg-bjb-navy/10 text-bjb-navy hover:bg-bjb-navy/15">
                    Edit
                  </button>
                  <button onClick={deleteSelected} className="rounded-2xl px-4 py-2 text-sm font-semibold bg-red-50 text-red-700 hover:bg-red-100">
                    Hapus
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-900">Subcategories (Children)</div>
                  <div className="text-xs text-slate-500">Klik Add Category Path untuk menambah child lewat path.</div>
                </div>

                <div className="mt-3 rounded-2xl border border-slate-100 overflow-hidden">
                  {loadingChildren ? (
                    <div className="p-4 text-sm text-slate-500">Loading children...</div>
                  ) : children.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500">Belum ada subcategory.</div>
                  ) : (
                    <div className="divide-y">
                      {children.map((c) => (
                        <div key={c.id} className="p-4 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-slate-900">{c.name}</div>
                            <div className="text-xs text-slate-400">#{c.id}</div>
                          </div>
                          <button
                            onClick={() => setSelected({ ...c })}
                            className="rounded-xl px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200"
                          >
                            Open
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ADD PATH MODAL */}
      <Modal
        open={openAdd}
        title="Add Category Path"
        subtitle="Buat path bertingkat (upsert anti-duplikat per parent)."
        onClose={() => setOpenAdd(false)}
      >
        <div className="space-y-4">
          {/* Root */}
          <div>
            <div className="text-xs font-semibold text-slate-700">Main Category (root)</div>
            <select className="input mt-1" value={levels[0]} onChange={(e) => setLevel(0, e.target.value)}>
              {mainOptions.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>

          {/* Sub levels */}
          {levels.slice(1).map((val, idx) => {
            const levelIndex = idx + 1;
            const required = levelIndex === 1;
            const opts = options[levelIndex] || [];

            return (
              <div key={levelIndex}>
                <div className="text-xs font-semibold text-slate-700">
                  Subcategory level-{levelIndex} {required ? <span className="text-red-600">(wajib)</span> : <span className="text-slate-400">(opsional)</span>}
                </div>
                <div className="mt-1 flex gap-2">
                  <select className="input w-1/2" value={val} onChange={(e) => setLevel(levelIndex, e.target.value)}>
                    <option value="">-- pilih existing --</option>
                    {opts.map((o) => <option key={o.id} value={o.name}>{o.name}</option>)}
                  </select>
                  <input className="input w-1/2" value={val} onChange={(e) => setLevel(levelIndex, e.target.value)} placeholder="atau ketik baru" />
                </div>
              </div>
            );
          })}

          <div className="flex gap-2 flex-wrap">
            <button onClick={addLevel} className="btn-ghost bg-slate-100">+ tambah level</button>
            <button onClick={removeLastLevel} className="btn-ghost bg-slate-100">− hapus level</button>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-100">
            <div className="font-semibold mb-1">Preview path</div>
            <div>{levels.map((x) => (x || "").trim()).filter(Boolean).join(" → ") || "-"}</div>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setOpenAdd(false)} className="btn-ghost">Cancel</button>
            <button onClick={submitPath} className="btn-primary">Save</button>
          </div>
        </div>
      </Modal>

      {/* RENAME MODAL */}
      <Modal
        open={openRename}
        title="Edit Category"
        subtitle="Rename category (anti duplikat scope parent)."
        onClose={() => setOpenRename(false)}
      >
        <div className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-slate-700">Nama baru</div>
            <input className="input mt-1" value={renameName} onChange={(e) => setRenameName(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setOpenRename(false)} className="btn-ghost">Cancel</button>
            <button onClick={submitRename} className="btn-primary">Update</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
