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
    const sorted = [...items].sort((a, b) => {
      const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return tb - ta;
    });
    return sorted.length ? [...sorted, ...sorted, ...sorted, ...sorted] : [];
  }, [items]);

  const goDetail = (it: BreakingItem) => {
    if (it.type === "product")
      navigate(`/knowledge-base/products/view/${it.id}`);
    else navigate(`/knowledge-base/scripts/view/${it.id}`);
  };

  useEffect(() => {
    const fetchBreaking = async () => {
      try {
        setLoading(true);
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

        const combined = [...prodItems, ...scrItems].filter(
          (x) => x.is_breaking,
        );
        setItems(combined);
      } catch (error: any) {
        console.error("Gagal load breaking:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBreaking();
    const t = setInterval(fetchBreaking, 60_000);
    return () => clearInterval(t);
  }, []);

  if (loading && items.length === 0) return null;
  if (!items.length) return null;

  return (
    // 1. Tambahkan 'overflow-hidden' dan 'max-w-full' di container utama
    <div className="w-full max-w-full overflow-hidden border-t border-gray-200 bg-red-50 dark:border-gray-800 dark:bg-red-900/20">
      <style>{`
        @keyframes s2pass-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); } 
        }
        .s2pass-marquee {
          /* Pastikan animasi mulus */
          display: flex;
          width: max-content;
          animation: s2pass-marquee 10s linear infinite;
        }
        .s2pass-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* 2. Gunakan GRID Layout, bukan Flex. 
             grid-cols-[auto_minmax(0,1fr)] artinya:
             - Kolom 1 (Label): Lebar otomatis sesuai konten ("auto")
             - Kolom 2 (Marquee): Ambil sisa ruang, TAPI bisa mengecil sampai 0 ("minmax(0, 1fr)") 
      */}
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-4 py-2">
        {/* Kolom 1: Label Breaking */}
        <span className="shrink-0 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white z-10">
          BREAKING
        </span>

        {/* Kolom 2: Container Marquee */}
        <div className="relative overflow-hidden h-full flex items-center">
          {/* Masking Gradient (Opsional: agar teks terlihat memudar di ujung kiri/kanan) */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-red-50 to-transparent dark:from-gray-900 z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-red-50 to-transparent dark:from-gray-900 z-10 pointer-events-none"></div>

          <div className="s2pass-marquee">
            {/* Render 2 set item agar looping mulus (A B C A B C) */}
            {merged.map((it, idx) => (
              <button
                key={`${it.type}-${it.id}-${idx}-1`}
                type="button"
                onClick={() => goDetail(it)}
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-800 shadow-sm ring-1 ring-red-200 hover:bg-red-50 dark:bg-gray-900 dark:text-gray-100 dark:ring-red-900/40 dark:hover:bg-gray-800 transition-colors mx-1.5"
                title={`Buka ${it.type}: ${it.title}`}
              >
                <span className="text-[10px] font-bold text-red-600 uppercase">
                  {it.type}
                </span>
                <span className="whitespace-nowrap">{it.title}</span>
              </button>
            ))}
            {/* Note: Logic duplikasi item sudah ada di useMemo 'merged', 
                 jadi map di atas sudah merender list ganda. 
                 Pastikan animation keyframes translateX(-50%) atau -100% disesuaikan dengan panjang konten.
                 Biasanya -50% jika kita menduplikasi listnya 2x (total width 200%).
             */}
          </div>
        </div>
      </div>
    </div>
  );
}
