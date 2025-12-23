import { useEffect, useState } from "react";
import { useNavigate } from "react-router"; 
import axios from "../../../api/axios";
import API from "../../../api/api";
import { flattenCategoryTree, CategoryNode, FlatCategory } from "../../../utils/categoryUtils"; 
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import { PencilIcon, TrashBinIcon, PlusIcon, ChevronDownIcon } from "../../../icons"; 
import { toast } from 'react-toastify';
import ConfirmationModal from "../../../components/ui/modal/ConfirmationModal";

// --- TYPE DEFINITIONS ---
interface Product {
  id: number;
  title: string;
  slug: string;
  category_id: number;
  is_breaking: boolean;
  updated_at: string;
}

export default function ProductPage() {
  const navigate = useNavigate();

  // --- STATE ---
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false); // Untuk loading di tombol modal
  
  // Filter & Pagination State
  const [searchTerm, setSearchTerm] = useState(""); // Input search user
  const [debouncedSearch, setDebouncedSearch] = useState(""); // Hasil delay search
  const [selectedCatId, setSelectedCatId] = useState<number>(0); // 0 = Semua
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalData, setTotalData] = useState(0);

  // Category Data State
  const [flatCategories, setFlatCategories] = useState<FlatCategory[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<number, string>>({}); // Kamus ID -> Nama

  const openDeleteModal = (id: number) => {
    setDeleteTargetId(id);
    setIsDeleteModalOpen(true);
  };

  // --- 1. FETCH CATEGORY TREE (Jalan sekali saat mount) ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(API.categories.tree);
        const treeData: CategoryNode[] = res.data || [];
        
        // Ratakan tree untuk dropdown
        const flat = flattenCategoryTree(treeData);
        setFlatCategories(flat);

        // Buat "Kamus" sederhana untuk tabel (ID -> Nama)
        const map: Record<number, string> = {};
        flat.forEach(cat => { map[cat.id] = cat.name; });
        setCategoryMap(map);

      } catch (err) {
        console.error("Gagal load kategori:", err);
      }
    };
    fetchCategories();
  }, []);

  // --- 2. DEBOUNCE SEARCH (Agar tidak spam API saat ngetik) ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset ke halaman 1 jika search berubah
    }, 500); // Tunggu 500ms berhenti ngetik
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- 3. FETCH PRODUCTS (Jalan saat filter/page berubah) ---
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page: page,
        limit: limit,
        q: debouncedSearch,
        categoryId: selectedCatId
      };

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
  }, [page, limit, debouncedSearch, selectedCatId]);

  // --- HANDLER DELETE ---
  const confirmDeleteProduct = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    const deletePromise = axios.delete(API.products.detail(deleteTargetId));
    await toast.promise(
        deletePromise,
        {
            pending: 'Menghapus produk...',
            success: 'Produk berhasil dihapus!',
            error: {
                render({ data }: any) {
                    return data.response?.data?.message || "Gagal menghapus produk";
                }
            }
        }
    );

    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    setDeleteTargetId(null);
    fetchProducts();
  };

  // --- HANDLER FILTER ---
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCatId(Number(e.target.value));
    setPage(1); // Reset page
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Daftar Produk" />

      <div className="flex flex-col gap-5 md:gap-7 2xl:gap-10">
        
        {/* CONTROL BAR (Filter & Action) */}
        <div className="rounded-sm border border-stroke bg-white px-5 py-4 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* KIRI: Search & Filter Dropdown */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-grow">
               
               {/* 1. Search Bar */}
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

               {/* 2. Single Tree Dropdown (Filter Kategori) */}
               <div className="relative w-full sm:w-64">
                  <select
                    value={selectedCatId}
                    onChange={handleCategoryChange}
                    className="w-full appearance-none bg-transparent pl-4 pr-10 py-2 border border-stroke rounded-lg outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 cursor-pointer"
                  >
                    <option value="0">Semua Kategori</option>
                    {flatCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {/* Teknik Indentasi menggunakan Unicode Space */}
                        {'\u00A0'.repeat(cat.depth * 4)}{cat.name}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronDownIcon className="w-4 h-4" />
                  </span>
               </div>
            </div>

            {/* KANAN: Tombol Tambah */}
            <div className="w-full md:w-auto flex justify-end">
               <Button onClick={() => navigate("/services/products/create")}>
                 <span className="flex items-center gap-2">
                   <PlusIcon/> Tambah Produk
                 </span>
               </Button>
            </div>
          </div>
        </div>

        {/* TABEL DATA */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                  <th className="py-4 px-4 font-medium text-black dark:text-white xl:pl-11 w-[50px]">No</th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">Info Produk</th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">Kategori</th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white text-center">Status</th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white text-right pr-8">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-10">Memuat data...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-500">Data tidak ditemukan.</td></tr>
                ) : (
                  products.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-meta-4/50 transition-colors">
                      <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                        <span className="text-gray-500">#{(page - 1) * limit + index + 1}</span>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <h5 className="font-semibold text-black dark:text-white">{item.title}</h5>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">/{item.slug}</p>
                        <p className="text-xs text-gray-400 mt-1">Update: {new Date(item.updated_at).toLocaleDateString("id-ID")}</p>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        {/* Lookup Nama Kategori dari State Map */}
                        <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                           {categoryMap[item.category_id] || `ID: ${item.category_id}`}
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
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <div className="flex items-center justify-end gap-2 pr-4">
                          <button 
                             onClick={() => navigate(`/services/products/edit/${item.id}`)}
                             className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 hover:text-primary transition"
                             title="Edit"
                          >
                            <PencilIcon className="w-5 h-5"/>
                          </button>
                          <button 
                             onClick={() => openDeleteModal(item.id)}
                             className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-gray-600 hover:text-red-500 transition"
                             title="Hapus"
                          >
                            <TrashBinIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION SIMPLE */}
          <div className="py-4 px-6 border-t border-stroke dark:border-strokedark flex justify-between items-center bg-gray-50 dark:bg-meta-4/20">
             <div className="text-sm text-gray-500">
                Total <b>{totalData}</b> produk
             </div>
             <div className="flex gap-2">
                <button
                   disabled={page === 1}
                   onClick={() => setPage(p => p - 1)}
                   className="px-3 py-1 rounded border border-stroke bg-white text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-strokedark dark:bg-meta-4"
                >
                   Prev
                </button>
                <span className="px-3 py-1 text-sm font-medium bg-white border border-stroke rounded dark:bg-meta-4 dark:border-strokedark">
                   {page}
                </span>
                <button
                   disabled={products.length < limit} 
                   onClick={() => setPage(p => p + 1)}
                   className="px-3 py-1 rounded border border-stroke bg-white text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-strokedark dark:bg-meta-4"
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