import Button from "./ui/button/Button";
import { CategoryNode } from "../types/home.types";
import { findRootTypeByNodeName } from "../utils/categoryTree";
import { LeafItem } from "../pages/Dashboard/Home"; // import dari folder Dashboard (index.tsx) — sesuaikan jika lokasi berbeda

interface Props {
  catStack: number[];
  breadcrumb: CategoryNode[];
  catLoading: boolean;
  catError: string;
  detailLoading: boolean;
  detailError: string;
  isLeafScreen: boolean;
  currentCategoryNode: CategoryNode | null;
  currentButtons: CategoryNode[];
  onLeafSelected: (leaf: CategoryNode) => void;
  onCategoryClick: (node: CategoryNode) => void;
  onBack: () => void;

  // ==== BARU: untuk layar list produk/script pada leaf category ====
  leafItems: LeafItem[] | null;
  leafCategoryName: string;
  onOpenLeafItem: (item: LeafItem) => void;

  // ==== BARU: breadcrumb clickable ====
  onBreadcrumbClick: (index: number) => void;
}

export default function CategoryPage({
  catStack,
  breadcrumb,
  catLoading,
  catError,
  detailLoading,
  detailError,
  isLeafScreen,
  currentCategoryNode,
  currentButtons,
  onLeafSelected,
  onCategoryClick,
  onBack,
  leafItems,
  leafCategoryName,
  onOpenLeafItem,
  onBreadcrumbClick,
}: Props) {
  return (
    <>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-bold text-black dark:text-white">
            Kategori
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {leafItems
              ? "Pilih produk / script yang ingin dibuka."
              : "Klik sampai level terakhir (leaf), lalu pilih produk dari daftar."}
          </div>
        </div>
      </div>

      {/* breadcrumb — clickable, langsung loncat ke level itu */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {catStack.length === 0 && !leafItems ? (
          <span className="text-gray-500 dark:text-gray-400">
            Home Kategori
          </span>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onBreadcrumbClick(-1)}
              className="text-gray-500 font-semibold hover:text-brand-600 hover:underline transition dark:text-gray-400 dark:hover:text-brand-300"
            >
              Home
            </button>

            {breadcrumb.map((b, i) => (
              <span key={b.id} className="flex items-center gap-2">
                <span className="text-gray-300 dark:text-gray-600">/</span>
                <button
                  type="button"
                  onClick={() => onBreadcrumbClick(i)}
                  className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700 transition hover:bg-brand-50 hover:text-brand-700 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
                >
                  {b.name}
                </button>
              </span>
            ))}

            {/* level "leaf list produk" — bukan bagian dari catStack, jadi tidak clickable (sudah posisi saat ini) */}
            {leafItems && (
              <span className="flex items-center gap-2">
                <span className="text-gray-300 dark:text-gray-600">/</span>
                <span className="rounded-full bg-brand-50 px-3 py-1 font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                  {leafCategoryName}
                </span>
              </span>
            )}
          </>
        )}
      </div>

      <div className="mt-4">
        {catLoading ? (
          <div className="text-sm text-gray-500">Memuat kategori...</div>
        ) : catError ? (
          <div className="text-sm text-red-500">{catError}</div>
        ) : (
          <>
            {detailLoading && (
              <div className="mb-4 rounded-xl border border-stroke bg-gray-50 p-3 text-sm text-gray-600 dark:border-strokedark dark:bg-boxdark-2 dark:text-gray-300">
                Memuat daftar produk...
              </div>
            )}

            {detailError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
                {detailError}
              </div>
            )}

            {/* ==================== LAYAR BARU: LIST PRODUK/SCRIPT DI LEAF CATEGORY ==================== */}
            {leafItems ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {leafItems.map((item) => (
                  <button
                    key={`${item.kind}-${item.id}`}
                    type="button"
                    onClick={() => onOpenLeafItem(item)}
                    className="group flex w-full items-center justify-between rounded-2xl border border-stroke bg-white px-5 py-4 text-left shadow-sm transition hover:shadow-md dark:border-strokedark dark:bg-boxdark-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold text-black dark:text-white">
                        {item.title}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {item.kind === "script" ? "Script Agent" : "Produk"}
                      </div>
                    </div>

                    <span className="ml-3 grid h-10 w-10 place-items-center rounded-xl border border-stroke bg-gray-50 text-gray-500 group-hover:bg-brand-50 group-hover:text-brand-700 dark:border-strokedark dark:bg-meta-4 dark:group-hover:bg-white/10 dark:group-hover:text-white">
                      →
                    </span>
                  </button>
                ))}
              </div>
            ) : isLeafScreen && currentCategoryNode ? (
              /* fallback: layar leaf lama (jarang kepakai sekarang, tapi dibiarkan untuk jaga-jaga) */
              <div className="rounded-2xl border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-boxdark-2">
                <div className="text-sm font-extrabold text-black dark:text-white">
                  Leaf: {currentCategoryNode.name}
                </div>
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                  Tidak ada sub-kategori lagi. Klik untuk lihat daftar produk.
                </div>
                <div className="mt-4">
                  <Button onClick={() => onLeafSelected(currentCategoryNode)}>
                    Lihat Daftar Produk
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {currentButtons.map((n) => {
                  const isLeaf = (n.children?.length || 0) === 0;
                  const r = findRootTypeByNodeName(n.name);
                  const isRootButton = !!r;

                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() =>
                        isLeaf ? onLeafSelected(n) : onCategoryClick(n)
                      }
                      className={`group flex w-full items-center justify-between rounded-2xl border border-stroke bg-white px-5 py-4 text-left shadow-sm transition hover:shadow-md dark:border-strokedark dark:bg-boxdark-2 ${isRootButton
                          ? "ring-1 ring-brand-100 dark:ring-white/10"
                          : ""
                        }`}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-extrabold text-black dark:text-white">
                          {n.name}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {isLeaf
                            ? "Lihat daftar produk"
                            : "Lihat sub-kategori"}
                        </div>
                      </div>

                      <span className="ml-3 grid h-10 w-10 place-items-center rounded-xl border border-stroke bg-gray-50 text-gray-500 group-hover:bg-brand-50 group-hover:text-brand-700 dark:border-strokedark dark:bg-meta-4 dark:group-hover:bg-white/10 dark:group-hover:text-white">
                        →
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer kategori */}
      <div className="sticky bottom-3 mt-6 rounded-2xl border border-stroke bg-white/95 p-4 shadow-md backdrop-blur dark:border-strokedark dark:bg-boxdark/90">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>

          <Button onClick={() => { }} disabled>
            Next
          </Button>
        </div>
      </div>
    </>
  );
}
