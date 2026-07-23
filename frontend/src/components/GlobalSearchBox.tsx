import { RefObject } from "react";
import { useNavigate } from "react-router";
import { KnowledgeItem } from "../types/home.types";

interface Props {
  searchBoxRef: RefObject<HTMLDivElement | null>;
  globalQ: string;
  setGlobalQ: (v: string) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  searchLoading: boolean;
  searchItems: KnowledgeItem[];
  onBeforeNavigate: () => void; // dipanggil sebelum pindah ke halaman detail (saveDashboardReturn)
}

export default function GlobalSearchBox({
  searchBoxRef,
  globalQ,
  setGlobalQ,
  searchOpen,
  setSearchOpen,
  searchLoading,
  searchItems,
  onBeforeNavigate,
}: Props) {
  const navigate = useNavigate();

  return (
    <div ref={searchBoxRef} className="relative w-full sm:w-105">
      <input
        value={globalQ}
        onChange={(e) => {
          setGlobalQ(e.target.value);
          setSearchOpen(true);
        }}
        onFocus={() => setSearchOpen(true)}
        placeholder="Cari apapun (cth: kredit, ATM, reset, bunga...)"
        className="w-full rounded-xl border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4"
      />

      {searchOpen && (globalQ.trim() || searchLoading) && (
        <div className="absolute left-0 right-0 mt-2 overflow-hidden rounded-2xl border border-stroke bg-white shadow-xl dark:border-strokedark dark:bg-boxdark z-999">
          <div className="max-h-90 overflow-auto p-2">
            {searchLoading ? (
              <div className="p-3 text-sm text-gray-500">Mencari...</div>
            ) : searchItems.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">
                Tidak ada hasil untuk “{globalQ}”
              </div>
            ) : (
              searchItems.map((it) => (
                <button
                  key={`${it.type}-${it.id}`}
                  className="w-full rounded-xl p-3 text-left hover:bg-gray-50 dark:hover:bg-white/5"
                  onClick={() => {
                    onBeforeNavigate();
                    setSearchOpen(false);
                    setGlobalQ("");
                    if (it.type === "product") {
                      navigate(`/knowledge-base/products/view/${it.id}`);
                    } else {
                      navigate(`/knowledge-base/scripts/view/${it.id}`);
                    }
                  }}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold text-black dark:text-white">
                        {it.title}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-white/10">
                          {it.type.toUpperCase()}
                        </span>
                        <span className="truncate">{it.category_name}</span>
                      </div>
                    </div>
                    <span className="text-gray-400">→</span>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-stroke p-2 dark:border-strokedark">
            <button
              className="w-full rounded-xl px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setGlobalQ("");
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
