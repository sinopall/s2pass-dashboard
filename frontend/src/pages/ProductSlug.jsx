import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useToast } from "../components/ToastProvider";

export function ProductSlugPage() {
  const { slug } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [p, setP] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/public/${slug}`);
        setP(res.data);
      } catch (e) {
        toast.error("Not found", e?.response?.data?.error ?? "Unknown");
      }
    }
    load();
  }, [slug]);

  const content = useMemo(() => p?.content || {}, [p]);
  const tabs = useMemo(() => (Array.isArray(content.tabs) ? content.tabs : []), [content]);

  if (!p) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-5">
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-slate-900">{p.title}</div>
          <button onClick={() => nav("/products")} className="btn-ghost">Back</button>
        </div>
        <div className="text-xs text-slate-500 mt-2">/{p.slug}</div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 space-y-6">
        {tabs.length === 0 ? (
          <div className="text-sm text-slate-500">Konten belum tersedia.</div>
        ) : (
          tabs.map((t, i) => (
            <div key={i} className="space-y-4">
              <div className="text-lg font-bold text-slate-900">{t.title}</div>

              {(t.accordions || []).map((a, j) => (
                <div key={j} className="rounded-2xl border border-slate-200 p-4">
                  <div className="font-bold text-slate-900">{a.title}</div>
                  <div className="mt-3 prose max-w-none" dangerouslySetInnerHTML={{ __html: a.body_html || "" }} />
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
