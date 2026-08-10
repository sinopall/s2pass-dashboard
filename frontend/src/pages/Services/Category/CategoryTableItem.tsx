import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Category } from "./types";
import {
  ChevronDownIcon,
  PencilIcon,
  TrashBinIcon,
  PlusIcon,
} from "../../../icons";
import axios from "../../../api/axios";
import API from "../../../api/api";

interface CategoryTableItemProps {
  category: Category;
  level: number;
  rootType?: string;
  onAddChild: (
    category: Category,
    rootType: string,
    ancestors: Category[],
  ) => void;
  onEdit: (category: Category, rootType: string, ancestors: Category[]) => void;
  onDelete: (category: Category) => void;
  ancestors?: Category[];
  isAdmin: boolean;

  // ==== BARU: dipakai untuk fitur "search produk -> auto expand + highlight" ====
  // Set berisi id kategori (root..leaf) yang harus di-force-expand.
  expandIds?: Set<number> | null;
  // id produk yang sedang jadi target highlight + auto-scroll.
  highlightProductId?: number | null;
  // berubah tiap kali user pilih hasil search baru, dipakai supaya effect
  // scroll tetap ke-trigger walau id target sama seperti sebelumnya.
  highlightNonce?: number;
}

interface ProductMini {
  id: number;
  title: string;
  is_active: boolean;
}

// Icon mata inline — supaya tidak bergantung ke barrel icon yang belum tentu
// menyediakan EyeIcon.
function EyeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1.5 12s3.75-7 10.5-7 10.5 7 10.5 7-3.75 7-10.5 7-10.5-7-10.5-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export default function CategoryTableItem({
  category,
  level,
  rootType,
  onAddChild,
  onEdit,
  onDelete,
  ancestors = [],
  isAdmin,
  expandIds = null,
  highlightProductId = null,
  highlightNonce = 0,
}: CategoryTableItemProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = category.children && category.children.length > 0;
  const isLeaf = !hasChildren;

  // Khusus leaf category: daftar produk yang masuk ke kategori ini.
  // null = belum pernah di-fetch, [] = sudah di-fetch tapi kosong.
  const [products, setProducts] = useState<ProductMini[] | null>(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const productRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const paddingLeft = level * 24;
  const currentType = rootType || category.name;
  const isRoot = level === 0;

  const handleAddClick = () => {
    onAddChild(category, rootType || category.name, ancestors);
  };

  const handleEditClick = () => {
    onEdit(category, rootType || category.name, ancestors);
  };

  const handleDeleteClick = () => {
    onDelete(category);
  };

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await axios.get(API.products.list, {
        params: { categoryId: category.id, page: 1, limit: 50 },
      });
      setProducts(res.data?.items || []);
    } catch (err) {
      console.error("Gagal load produk kategori:", err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleToggleExpand = () => {
    const next = !isExpanded;
    setIsExpanded(next);

    // Lazy-load: fetch produk cuma sekali, pas pertama kali leaf dibuka
    if (isLeaf && next && products === null) {
      loadProducts();
    }
  };

  const canExpand = hasChildren || isLeaf;

  // ==== BARU: auto-expand kalau kategori ini ada di jalur hasil search ====
  useEffect(() => {
    if (!expandIds || !expandIds.has(category.id)) return;

    setIsExpanded(true);

    // Kalau ini leaf target-nya, pastikan produk ikut ke-load juga
    if (isLeaf && products === null) {
      loadProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandIds, highlightNonce]);

  // ==== BARU: auto-scroll ke produk yang di-highlight, begitu daftar produk siap ====
  useEffect(() => {
    if (!highlightProductId || !products) return;
    const match = products.find((p) => p.id === highlightProductId);
    if (!match) return;

    const el = productRefs.current[highlightProductId];
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, highlightProductId, highlightNonce]);

  return (
    <>
      <tr className="border-b border-stroke hover:bg-gray-50 dark:border-strokedark dark:hover:bg-boxdark-2 transition-colors">
        <td className="py-4 px-4 dark:border-strokedark">
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${paddingLeft}px` }}
          >
            {canExpand ? (
              <button
                onClick={handleToggleExpand}
                className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-meta-4 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
                title={isLeaf ? "Lihat produk di kategori ini" : undefined}
              >
                <ChevronDownIcon className="w-4 h-4 fill-current text-gray-500" />
              </button>
            ) : (
              <div className="w-6" />
            )}

            <span
              className={`font-medium ${
                isRoot
                  ? "font-bold text-black dark:text-white"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              {category.name}
            </span>

            {isLeaf && (
              <span className="ml-1 text-[10px] uppercase tracking-wide text-gray-400 border border-gray-200 dark:border-gray-600 rounded-full px-2 py-0.5">
                Leaf
              </span>
            )}
          </div>
        </td>

        <td className="py-4 px-4 dark:border-strokedark">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
              currentType === "Informasi"
                ? "bg-blue-100 text-blue-800"
                : currentType === "Request"
                  ? "bg-green-100 text-green-800"
                  : currentType === "Complaint"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
            }`}
          >
            {currentType}
          </span>
        </td>

        <td className="py-4 px-4 text-right dark:border-strokedark">
          <div className="flex items-center justify-end space-x-2">
            {isAdmin && (
              <>
                <button
                  onClick={handleAddClick}
                  className="p-2 text-gray-600 hover:text-primary transition-colors"
                  title="Tambah Sub-Kategori"
                >
                  <PlusIcon />
                </button>

                {!isRoot && (
                  <>
                    <button
                      onClick={handleEditClick}
                      className="p-2 text-gray-600 hover:text-primary transition-colors"
                      title="Edit"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handleDeleteClick}
                      className="p-2 text-red-500 hover:text-red-700 transition-colors"
                      title="Hapus"
                    >
                      <TrashBinIcon className="w-4 h-4" />
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </td>
      </tr>

      {/* Expand -> sub-kategori (kalau punya children) */}
      {isExpanded &&
        hasChildren &&
        category.children.map((child) => (
          <CategoryTableItem
            key={child.id}
            category={child}
            level={level + 1}
            rootType={currentType}
            onAddChild={onAddChild}
            onEdit={onEdit}
            onDelete={onDelete}
            ancestors={[...ancestors, category]}
            isAdmin={isAdmin}
            expandIds={expandIds}
            highlightProductId={highlightProductId}
            highlightNonce={highlightNonce}
          />
        ))}

      {/* Expand -> daftar produk (kalau leaf category) */}
      {isExpanded && isLeaf && (
        <tr className="border-b border-stroke dark:border-strokedark bg-gray-50/60 dark:bg-boxdark-2/60">
          <td colSpan={3} className="py-3 px-4">
            <div style={{ paddingLeft: `${paddingLeft + 32}px` }}>
              {productsLoading ? (
                <div className="text-xs text-gray-400 py-2">
                  Memuat produk...
                </div>
              ) : products && products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {products.map((p) => {
                    const isHighlighted = p.id === highlightProductId;
                    return (
                      <div
                        key={p.id}
                        ref={(el) => {
                          productRefs.current[p.id] = el;
                        }}
                        className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-all ${
                          isHighlighted
                            ? "border-amber-400 bg-amber-50 dark:bg-amber-500/10 ring-2 ring-amber-300"
                            : "border-stroke dark:border-strokedark bg-white dark:bg-boxdark"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {p.title}
                          </span>
                          <span
                            className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              p.is_active
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {p.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>

                        <button
                          onClick={() =>
                            navigate(`/products/view/${p.id}`)
                          }
                          className="shrink-0 p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors"
                          title="Lihat detail produk"
                        >
                          <EyeIcon />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-gray-400 py-2">
                  Belum ada produk di kategori ini.
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
