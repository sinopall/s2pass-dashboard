import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useToast } from "../components/ToastProvider";

export function ProductDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [p, setP] = useState(null);

  async function load() {
    try {
      const res = await api.get(`/products/${id}`);
      setP(res.data);
    } catch (e) {
      toast.error("Gagal load product", e?.response?.data?.error ?? "Not found");
    }
  }

  useEffect(() => { load(); }, [id]);

  if (!p) return <div className="rounded-3xl bg-white p-6 shadow-sm border">Loading...</div>;

  const content = p.content || {};
  const accordions = Array.isArray(content.accordions) ? content.accordions : [];

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xl font-bold text-slate-900">{p.title}</div>
          </div>
          {p.is_breaking && (
            <span className="rounded-full bg-bjb-gold/20 text-bjb-navy px-3 py-1 text-xs font-bold">
              BREAKING
            </span>
          )}
        </div>
      </div>

      {accordions.length > 0 ? (
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="space-y-2">
            {accordions.map((a, idx) => (
              <details key={idx} className="rounded-2xl border border-slate-200 p-4">
                <summary className="cursor-pointer font-semibold text-slate-900">
                  {a.title}
                </summary>
                <div
                  className="mt-3 prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: a.body_html || "" }}
                />
              </details>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 text-sm text-slate-500">
          Konten belum tersedia.
        </div>
      )}
    </div>
  );
}
