import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import axios from "../../../api/axios";
import API from "../../../api/api";
import {
  flattenCategoryTree,
  CategoryNode,
  FlatCategory,
} from "../../../utils/categoryUtils";
import Button from "../../../components/ui/button/Button";
import {
  PencilIcon,
  TrashBinIcon,
  PlusIcon,
  ChevronDownIcon,
} from "../../../icons";
import CategoryTreeSelect from "../../../components/form/CategoryTreeSelect";
import { toast } from "react-toastify";
import ConfirmationModal from "../../../components/ui/modal/ConfirmationModal";

// --- TYPE DEFINITIONS ---
interface Product {
  id: number;
  title: string;
  slug: string;
  category_id: number;
  is_breaking: boolean;
  is_active: boolean;
  updated_at: string;
}

const EyeIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

export default function ProductList() {
  const navigate = useNavigate();

  // --- STATE ---
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Filter & Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCatId, setSelectedCatId] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalData, setTotalData] = useState(0);

  // Category Data State
  const [flatCategories, setFlatCategories] = useState<FlatCategory[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<number, string>>({});

  const openDeleteModal = (id: number) => {
    setDeleteTargetId(id);
    setIsDeleteModalOpen(true);
  };

  useEffect(() => {
    const storedData = localStorage.getItem("user_data");
    if (storedData) {
      try {
        const user = JSON.parse(storedData);
        setIsAdmin(user.role === "admin");
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }
  }, []);

  // --- 1. FETCH CATEGORY TREE ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(API.categories.tree);
        const treeData: CategoryNode[] = res.data || [];

        const flat = flattenCategoryTree(treeData);
        setFlatCategories(flat);

        const map: Record<number, string> = {};
        flat.forEach((cat) => {
          map[cat.id] = cat.name;
        });
        setCategoryMap(map);
      } catch (err) {
        console.error("Gagal load kategori:", err);
      }
    };
    fetchCategories();
  }, []);

  // --- 2. DEBOUNCE SEARCH ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- 3. FETCH PRODUCTS ---
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: page,
        limit: limit,
        q: debouncedSearch,
        categoryId: selectedCatId,
      };
      if (statusFilter === "active") params.active = true;
      if (statusFilter === "inactive") params.active = false;

      const response = await axios.get(API.products.list, { params });
      setProducts(response.data.items);
      setTotalData(response.data.total);
    } catch (err) {
      console.error("Gagal load produk:", err);
      setError("Gagal mengambil data produk.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debouncedSearch, selectedCatId, statusFilter]);

  console.log("Error:", error);

  // --- TOGGLE STATUS ---
  const handleToggleStatus = async (product: Product) => {
    setTogglingId(product.id);
    const nextStatus = !product.is_active;
    try {
      await axios.patch(API.products.updateStatus(product.id), {
        is_active: nextStatus,
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_active: nextStatus } : p,
        ),
      );
      toast.success(
        nextStatus ? "Produk diaktifkan kembali" : "Produk dinonaktifkan",
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Gagal mengubah status produk");
    } finally {
      setTogglingId(null);
    }
  };

  // --- DELETE ---
  const confirmDeleteProduct = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);

    const deletePromise = axios.delete(API.products.detail(deleteTargetId));
    await toast.promise(deletePromise, {
      pending: "Menghapus produk...",
      success: "Produk berhasil dihapus!",
      error: {
        render({ data }: any) {
          return data.response?.data?.message || "Gagal menghapus produk";
        },
      },
    });

    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    setDeleteTargetId(null);
    fetchProducts();
  };

  return (
    <>
      <div className="flex flex-col gap-5 md:gap-7 2xl:gap-10">
        {/* CONTROL BAR */}
        <div className="rounded-sm border border-stroke bg-white px-5 py-4 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-grow">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Cari nama produk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-stroke rounded-lg outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary transition"
                />
              </div>

              {/* Dropdown kategori — searchable, tetap tampil sebagai tree */}
              <CategoryTreeSelect
                categories={flatCategories}
                value={selectedCatId}
                onChange={(id) => {
                  setSelectedCatId(id);
                  setPage(1);
                }}
              />

              {/* Filter status aktif/nonaktif */}
              <div className="relative w-full sm:w-44">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(
                      e.target.value as "all" | "active" | "inactive",
                    );
                    setPage(1);
                  }}
                  className="w-full appearance-none bg-transparent pl-4 pr-10 py-2 border border-stroke rounded-lg outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronDownIcon className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Tambah */}
            {isAdmin && (
              <div className="w-full md:w-auto flex justify-end">
                <Button
                  onClick={() => navigate("/products/create")}
                >
                  <span className="flex items-center gap-2">
                    <PlusIcon /> Tambah Produk
                  </span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* TABLE */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                  <th className="py-4 px-4 font-medium text-black dark:text-white xl:pl-11 w-[50px]">
                    No
                  </th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">
                    Info Produk
                  </th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">
                    Kategori
                  </th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white text-center">
                    Status
                  </th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white text-center">
                    Aktif?
                  </th>
                  {isAdmin && (
                    <>
                      <th className="py-4 px-4 font-medium text-black dark:text-white text-right pr-8">
                        Aksi
                      </th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10">
                      Memuat data...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500">
                      Data tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  products.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 dark:hover:bg-meta-4/50 transition-colors cursor-pointer ${
                        !item.is_active ? "opacity-60" : ""
                      }`}
                      onClick={() =>
                        navigate(`/products/view/${item.id}`)
                      }
                    >
                      <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                        <span className="text-gray-500">
                          #{(page - 1) * limit + index + 1}
                        </span>
                      </td>

                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <h5 className="font-semibold text-black dark:text-white">
                          {item.title}
                        </h5>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">
                          /{item.slug}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Update:{" "}
                          {new Date(item.updated_at).toLocaleDateString(
                            "id-ID",
                          )}
                        </p>
                      </td>

                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          {categoryMap[item.category_id] ||
                            `ID: ${item.category_id}`}
                        </span>
                      </td>

                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark text-center">
                        {item.is_breaking ? (
                          <span className="inline-flex rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success bg-red-100 text-red-800">
                            Breaking
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                            Standard
                          </span>
                        )}
                      </td>

                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark text-center">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={item.is_active}
                            disabled={!isAdmin || togglingId === item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(item);
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              item.is_active
                                ? "bg-emerald-500"
                                : "bg-gray-300 dark:bg-gray-600"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                item.is_active
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                          <span
                            className={`text-[11px] font-semibold ${
                              item.is_active
                                ? "text-emerald-600"
                                : "text-gray-400"
                            }`}
                          >
                            {togglingId === item.id
                              ? "..."
                              : item.is_active
                                ? "Aktif"
                                : "Nonaktif"}
                          </span>
                        </div>
                      </td>

                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <div className="flex items-center justify-end gap-2 pr-4">
                          {isAdmin && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(
                                    `/products/view/${item.id}`,
                                  );
                                }}
                                className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-gray-600 hover:text-blue-500 transition"
                                title="Lihat Detail"
                                type="button"
                              >
                                <EyeIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(
                                    `/products/edit/${item.id}`,
                                  );
                                }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 hover:text-primary transition"
                                title="Edit"
                                type="button"
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteModal(item.id);
                                }}
                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-gray-600 hover:text-red-500 transition"
                                title="Hapus"
                                type="button"
                              >
                                <TrashBinIcon className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="py-4 px-6 border-t border-stroke dark:border-strokedark flex justify-between items-center bg-gray-50 dark:bg-meta-4/20">
            <div className="text-sm text-gray-500">
              Total <b>{totalData}</b> produk
            </div>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded border border-stroke bg-white text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-strokedark dark:bg-meta-4"
                type="button"
              >
                Prev
              </button>
              <span className="px-3 py-1 text-sm font-medium bg-white border border-stroke rounded dark:bg-meta-4 dark:border-strokedark">
                {page}
              </span>
              <button
                disabled={products.length < limit}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded border border-stroke bg-white text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-strokedark dark:bg-meta-4"
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteProduct}
        title="Hapus Produk?"
        message="Tindakan ini tidak dapat dibatalkan. Data produk akan hilang permanen dari database."
        isLoading={isDeleting}
      />
    </>
  );
}
