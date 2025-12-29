import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import axios from "../../api/axios";
import API from "../../api/api";

type BreakingItem = {
  id: number;
  title: string;
  slug: string;
  is_breaking: boolean;
  updated_at?: string;
  type: "product" | "script";
};

export default function BreakingNewsTicker() {
  const navigate = useNavigate();

  const [items, setItems] = useState<BreakingItem[]>([]);
  const [loading, setLoading] = useState(false);

  const merged = useMemo(() => {
    // sort terbaru
    const sorted = [...items].sort((a, b) => {
      const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return tb - ta;
    });

    // biar marquee terlihat terus: gandakan isi
    return sorted.length ? [...sorted, ...sorted] : [];
  }, [items]);

  const goDetail = (it: BreakingItem) => {
    if (it.type === "product") navigate(`/knowledge-base/products/view/${it.id}`);
    else navigate(`/knowledge-base/scripts/view/${it.id}`);
  };

  useEffect(() => {
    const fetchBreaking = async () => {
      try {
        setLoading(true);

        // NOTE:
        // Kalau backend kamu belum support param "is_breaking",
        // ganti jadi ambil list biasa limit besar lalu filter client-side.
        const [prodRes, scrRes] = await Promise.all([
          axios.get(API.products.list, {
            params: { page: 1, limit: 30, is_breaking: true },
          }),
          axios.get(API.scripts.list, {
            params: { page: 1, limit: 30, is_breaking: true },
          }),
        ]);

        const prodItems = (prodRes.data?.items || []).map((p: any) => ({
          id: Number(p.id),
          title: String(p.title),
          slug: String(p.slug),
          is_breaking: Boolean(p.is_breaking),
          updated_at: p.updated_at,
          type: "product" as const,
        }));

        const scrItems = (scrRes.data?.items || []).map((s: any) => ({
          id: Number(s.id),
          title: String(s.title),
          slug: String(s.slug),
          is_breaking: Boolean(s.is_breaking),
          updated_at: s.updated_at,
          type: "script" as const,
        }));

        // backend param is_breaking true harusnya sudah terfilter,
        // tapi biar aman tetap filter.
        const combined = [...prodItems, ...scrItems].filter((x) => x.is_breaking);

        setItems(combined);
      } catch (e) {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBreaking();

    // auto refresh biar kalau ada breaking baru langsung muncul
    const t = setInterval(fetchBreaking, 60_000);
    return () => clearInterval(t);
  }, []);

  if (loading && items.length === 0) return null;
  if (!items.length) return null;

  return (
    <div className="w-full border-t border-gray-200 bg-red-50 dark:border-gray-800 dark:bg-red-900/20">
      {/* CSS marquee tanpa ubah tailwind config */}
      <style>{`
        @keyframes s2pass-marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .s2pass-marquee {
          animation: s2pass-marquee 22s linear infinite;
        }
        .s2pass-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="flex items-center gap-3 px-4 py-2">
        <span className="shrink-0 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
          BREAKING
        </span>

        <div className="relative flex-1 overflow-hidden">
          <div className="s2pass-marquee flex w-max items-center gap-3">
            {merged.map((it, idx) => (
              <button
                key={`${it.type}-${it.id}-${idx}`}
                type="button"
                onClick={() => goDetail(it)}
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-800 shadow-sm ring-1 ring-red-200 hover:bg-red-50 dark:bg-gray-900 dark:text-gray-100 dark:ring-red-900/40 dark:hover:bg-gray-800"
                title={`Buka ${it.type === "product" ? "Product" : "Script"}: ${it.title}`}
              >
                <span className="text-[10px] font-bold text-red-600">
                  {it.type === "product" ? "PRODUCT" : "SCRIPT"}
                </span>
                <span className="whitespace-nowrap">{it.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
