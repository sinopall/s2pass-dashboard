import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { S2PAS } from "../lib/s2pas";

function isNumeric(s) {
  return /^[0-9]+$/.test(String(s || "").trim());
}

export function ProductDetail() {
  const { slugOrId } = useParams();
  const nav = useNavigate();
  const loc = useLocation();
  const toast = useToast();
  const [sp, setSp] = useSearchParams();

  const [p, setP] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  async function load() {
    try {
      const url = isNumeric(slugOrId) ? `/products/${slugOrId}` : `/public/${slugOrId}`;
      const res = await api.get(url);
      const detail = res.data;
      setP(detail);

      const t = parseInt(sp.get("tab") || "0", 10);
      setActiveTab(Number.isFinite(t) && t >= 0 ? t : 0);
    } catch (e) {
      toast.error("Gagal load product", e?.response?.data?.error ?? "Not found");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugOrId]);

  const content = useMemo(() => (p?.content || {}), [p]);
  const tabs = useMemo(() => (Array.isArray(content.tabs) ? content.tabs : []), [content]);
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

  function backSmart() {
    const fromS2pas = loc.state?.fromS2pas;
    if (fromS2pas) {
      nav(S2PAS.getReturnTo() || "/s2pas/nav");
      return;
    }
    nav("/products");
  }

  if (!p) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
        Loading...
      </div>
    );
  }

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

            <div className="mt-2 text-xs text-slate-500">
              Slug: <b>{p.slug}</b>
            </div>
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

              <div
                id="tabScroller"
                className="max-w-[520px] overflow-x-auto whitespace-nowrap scrollbar-hide"
              >
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

          {/* ✅ Back smart */}
          <button
            onClick={backSmart}
            className="rounded-2xl bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <span className="inline-flex items-center gap-2">
              <ArrowLeft size={16} /> Back
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
        {tabs.length > 0 ? (
          sections.length === 0 ? (
            <div className="text-sm text-slate-500">Konten tab ini belum tersedia.</div>
          ) : (
            <div className="space-y-6">
              {sections.map((s, idx) => (
                <details key={idx} className="rounded-3xl border border-slate-200 bg-white p-4" open={idx === 0}>
                  <summary className="cursor-pointer font-bold text-slate-900">
                    {s.title}
                  </summary>
                  <div
                    className="mt-3 prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: s.body_html || "" }}
                  />
                </details>
              ))}
            </div>
          )
        ) : legacySections.length === 0 ? (
          <div className="text-sm text-slate-500">Konten belum tersedia.</div>
        ) : (
          <div className="space-y-6">
            {legacySections.map((s, idx) => (
              <details key={idx} className="rounded-3xl border border-slate-200 bg-white p-4" open={idx === 0}>
                <summary className="cursor-pointer font-bold text-slate-900">
                  {s.title}
                </summary>
                <div
                  className="mt-3 prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: s.body_html || "" }}
                />
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
