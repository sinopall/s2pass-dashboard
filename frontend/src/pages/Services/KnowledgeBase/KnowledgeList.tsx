import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import axios from "../../../api/axios";
import API from "../../../api/api"; // Pastikan API.knowledge.all sudah didaftarkan atau ketik manual stringnya
import {
  flattenCategoryTree,
  FlatCategory,
} from "../../../utils/categoryUtils";
import { ChevronDownIcon } from "../../../icons"; // Sesuaikan import icon Anda

// 1. Tipe Data Sesuai DTO Backend
interface KnowledgeItem {
  id: number;
  title: string;
  slug: string;
  type: "product" | "script";
  category_name: string;
  updated_at: string;
}

export default function KnowledgeList() {
  const navigate = useNavigate();

  // --- STATE DATA ---
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE FILTER ---
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCatId, setSelectedCatId] = useState<number>(0);

  // --- STATE PAGINATION ---
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalData, setTotalData] = useState(0);

  // --- STATE KATEGORI (Untuk Dropdown) ---
  const [flatCategories, setFlatCategories] = useState<FlatCategory[]>([]);

  // 1. FETCH KATEGORI (Untuk Filter Dropdown)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(API.categories.tree);
        const flat = flattenCategoryTree(res.data || []);
        setFlatCategories(flat);
      } catch (err) {
        console.error("Gagal load kategori:", err);
      }
    };
    fetchCategories();
  }, []);

  // 2. DEBOUNCE SEARCH
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset ke halaman 1 saat search berubah
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 3. FETCH DATA GABUNGAN (API BARU)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Panggil endpoint baru
        const res = await axios.get("/knowledge-base/all", {
          params: {
            q: debouncedSearch,
            categoryId: selectedCatId,
            page: page,
            limit: limit,
          },
        });

        setItems(res.data.items || []);
        setTotalData(res.data.total || 0);
      } catch (error) {
        console.error("Gagal load knowledge base:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [debouncedSearch, selectedCatId, page, limit]);

  // Handler Navigasi
  const handleItemClick = (item: KnowledgeItem) => {
    // Arahkan ke rute view masing-masing
    if (item.type === "product") {
      navigate(`/knowledge-base/products/view/${item.id}`);
    } else {
      navigate(`/knowledge-base/scripts/view/${item.id}`);
    }
  };

  return (
    <div className="flex flex-col gap-5 md:gap-7 2xl:gap-10">
      {/* --- CONTROL BAR (Search & Filter) --- */}
      <div className="rounded-sm border border-stroke bg-white px-5 py-4 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="relative w-full sm:w-1/2">
            <input
              type="text"
              placeholder="Cari kata kunci (cth: Bunga, Tabungan)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-4 py-2 border border-stroke rounded-lg outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary transition"
            />
          </div>

          {/* Category Filter */}
          <div className="relative w-full sm:w-1/2">
            <select
              value={selectedCatId}
              onChange={(e) => {
                setSelectedCatId(Number(e.target.value));
                setPage(1);
              }}
              className="w-full appearance-none bg-transparent pl-4 pr-10 py-2 border border-stroke rounded-lg outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 cursor-pointer"
            >
              <option value="0">Semua Kategori</option>
              {flatCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {"\u00A0".repeat(cat.depth * 4)}
                  {cat.name}
                </option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <ChevronDownIcon className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>

      {/* --- LIST ITEMS (CARD STYLE) --- */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="text-center py-10 bg-white dark:bg-boxdark rounded-sm border border-stroke dark:border-strokedark">
            Memuat data...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-boxdark rounded-sm border border-stroke dark:border-strokedark text-gray-500">
            Tidak ada data ditemukan.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              onClick={() => handleItemClick(item)}
              className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white border border-stroke rounded-sm shadow-sm hover:shadow-md hover:border-primary cursor-pointer transition-all dark:bg-boxdark dark:border-strokedark dark:hover:border-primary"
            >
              {/* Info Kiri */}
              <div className="flex items-start gap-4">
                {/* Icon/Badge Tipe */}
                <div
                  className={`shrink-0 flex items-center justify-center w-12 h-12 rounded-full ${
                    item.type === "product"
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      : "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {item.type.substring(0, 4)}
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-black dark:text-white group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>

                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    {/* Badge Kategori */}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                      {item.category_name || "Tanpa Kategori"}
                    </span>

                    {/* Tanggal Update */}
                    <span className="text-xs text-gray-500">
                      Diperbarui:{" "}
                      {new Date(item.updated_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Icon Panah Kanan (Visual Cue) */}
              <div className="hidden md:block pr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- PAGINATION --- */}
      {items.length > 0 && (
        <div className="py-4 px-6 border border-stroke rounded-sm bg-white dark:bg-boxdark dark:border-strokedark flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Total <b>{totalData}</b> data
          </div>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 rounded border border-stroke bg-white text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-strokedark dark:bg-meta-4"
            >
              Prev
            </button>
            <span className="px-3 py-1 text-sm font-medium bg-white border border-stroke rounded dark:bg-meta-4 dark:border-strokedark">
              {page}
            </span>
            <button
              disabled={items.length < limit} // Simple logic, bisa diperbaiki dgn total pages
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded border border-stroke bg-white text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-strokedark dark:bg-meta-4"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
