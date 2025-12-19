import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [sp, setSp] = useSearchParams();

  const [p, setP] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  async function load() {
    try {
      const res = await api.get(`/products/${id}`);
      const detail = res.data;
      setP(detail);

      // restore tab from query ?tab=1
      const t = parseInt(sp.get("tab") || "0", 10);
      setActiveTab(Number.isFinite(t) && t >= 0 ? t : 0);
    } catch (e) {
      toast.error("Gagal load product", e?.response?.data?.error ?? "Not found");
    }
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const content = useMemo(() => (p?.content || {}), [p]);
  const tabs = useMemo(() => (Array.isArray(content.tabs) ? content.tabs : []), [content]);

  // fallback: kalau product lama masih pakai accordions
  const legacySections = useMemo(
    () => (Array.isArray(content.accordions) ? content.accordions : []),
    [content]
  );

  function onClickTab(idx) {
    setActiveTab(idx);
    sp.set("tab", String(idx));
    setSp(sp, { replace: true });
  }

  function scrollTabs(dir) {
    const el = document.getElementById("tabScroller");
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  }

  if (!p) return <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">Loading...</div>;

  const current = tabs[activeTab] || null;
  const sections = current?.accordions || [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="flex items-start justify-between gap-4">
          {/* kiri */}
          <div className="min-w-[240px]">
            <div className="text-2xl font-bold text-slate-900">{p.title}</div>
            {p.is_breaking && (
              <div className="mt-2 inline-flex rounded-full bg-bjb-gold/20 text-bjb-navy px-3 py-1 text-xs font-bold">
                BREAKING
              </div>
            )}
          </div>

          {/* kanan: tabs */}
          {tabs.length > 0 && (
            <div className="flex items-center gap-2 flex-1 justify-end">
              <button
                type="button"
                onClick={() => scrollTabs("left")}
                className="h-10 w-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                title="Scroll left"
              >
                <ChevronLeft size={18} />
              </button>

              <div id="tabScroller" className="max-w-[520px] overflow-x-auto whitespace-nowrap scrollbar-hide">
                <div className="inline-flex gap-2">
                  {tabs.map((t, idx) => {
                    const active = idx === activeTab;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => onClickTab(idx)}
                        className={[
                          "px-4 py-2 rounded-2xl border text-sm font-semibold transition",
                          active
                            ? "bg-bjb-navy text-white border-bjb-navy"
                            : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        {t.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => scrollTabs("right")}
                className="h-10 w-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                title="Scroll right"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          <button
            onClick={() => nav("/products")}
            className="rounded-2xl bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
        {/* kalau pakai tabs */}
        {tabs.length > 0 ? (
          sections.length === 0 ? (
            <div className="text-sm text-slate-500">Konten tab ini belum tersedia.</div>
          ) : (
            <div className="space-y-8">
              {sections.map((s, idx) => (
                <div key={idx}>
                  <div className="text-lg font-bold text-slate-900">{s.title}</div>
                  <div className="mt-3 prose max-w-none" dangerouslySetInnerHTML={{ __html: s.body_html || "" }} />
                </div>
              ))}
            </div>
          )
        ) : (
          // fallback kalau product lama (tanpa tabs)
          legacySections.length === 0 ? (
            <div className="text-sm text-slate-500">Konten belum tersedia.</div>
          ) : (
            <div className="space-y-8">
              {legacySections.map((s, idx) => (
                <div key={idx}>
                  <div className="text-lg font-bold text-slate-900">{s.title}</div>
                  <div className="mt-3 prose max-w-none" dangerouslySetInnerHTML={{ __html: s.body_html || "" }} />
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
