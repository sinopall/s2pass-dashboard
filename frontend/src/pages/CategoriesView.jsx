import { useEffect, useState } from "react";
import { api } from "../lib/api";

function CategoryNode({ node }) {
  return (
    <li className="mb-2">
      <div className="text-sm font-medium">{node.name}</div>
      {node.children && node.children.length > 0 && (
        <ul className="ml-4 mt-1 border-l border-slate-200 pl-4">
          {node.children.map((child) => (
            <CategoryNode key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function CategoriesView() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  async function load() {
    try {
      const res = await api.get("/categories/tree");
      setTree(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.error ?? "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm text-sm text-slate-600">
        Loading categories...
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl bg-red-50 p-6 shadow-sm text-sm text-red-700">
        {err}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="text-lg font-semibold">Categories</div>
      <div className="mt-1 text-sm text-slate-500">
        View-only category tree (agent access).
      </div>

      <ul className="mt-4">
        {tree.map((node) => (
          <CategoryNode key={node.id} node={node} />
        ))}
      </ul>
    </div>
  );
}
