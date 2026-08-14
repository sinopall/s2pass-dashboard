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
import { PencilIcon, TrashBinIcon, PlusIcon } from "../../../icons";
import { toast } from "react-toastify";
import ConfirmationModal from "../../../components/ui/modal/ConfirmationModal";
import { Script } from "../types";
import CategoryTreeSelect from "../../../components/form/CategoryTreeSelect";

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

export default function ScriptList() {
  const navigate = useNavigate();

  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCatId, setSelectedCatId] = useState<number>(0);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalData, setTotalData] = useState(0);

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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(API.categories.tree);
        const treeData: CategoryNode[] = res.data || [];
        const flat = flattenCategoryTree(treeData);
        setFlatCategories(flat);

        const map: Record<number, string> = {};
        flat.forEach((cat) => (map[cat.id] = cat.name));
        setCategoryMap(map);
      } catch (err) {
        console.error("Gagal load kategori:", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchScripts = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        q: debouncedSearch,
        categoryId: selectedCatId,
      };
      const response = await axios.get(API.scripts.list, { params });
      setScripts(response.data.items);
      setTotalData(response.data.total);
    } catch (err) {
      console.error("Gagal load script:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScripts();
  }, [page, limit, debouncedSearch, selectedCatId]);

  const confirmDeleteScript = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);

    const deletePromise = axios.delete(API.scripts.detail(deleteTargetId));
    await toast.promise(deletePromise, {
      pending: "Menghapus script...",
      success: "Script berhasil dihapus!",
      error: {
        render({ data }: any) {
          return data.response?.data?.message || "Gagal menghapus script";
        },
      },
    });

    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    setDeleteTargetId(null);
    fetchScripts();
  };

  return (
    <>
      <div className="flex flex-col gap-5 md:gap-7 2xl:gap-10 mt-5">
        {/* CONTROL BAR */}
        <div className="rounded-sm border border-stroke bg-white px-5 py-4 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-grow">
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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
                  placeholder="Cari judul script..."
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
            </div>

            {isAdmin && (
              <div className="w-full md:w-auto flex justify-end">
                <Button onClick={() => navigate("/scripts/create")}>
                  <span className="flex items-center gap-2">
                    <PlusIcon /> Tambah Script
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
                    Info Script
                  </th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">
                    Kategori
                  </th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white text-center">
                    Status
                  </th>
                  {isAdmin && (
                    <th className="py-4 px-4 font-medium text-black dark:text-white text-right pr-8">
                      Aksi
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10">
                      Memuat data...
                    </td>
                  </tr>
                ) : scripts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">
                      Data tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  scripts.map((item, index) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 dark:hover:bg-meta-4/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/scripts/view/${item.id}`)}
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
                      </td>

                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <span
                          className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                            categoryMap[item.category_id] === "Informasi"
                              ? "bg-blue-100 text-blue-800"
                              : categoryMap[item.category_id] === "Request"
                                ? "bg-green-100 text-green-800"
                                : categoryMap[item.category_id] === "Complaint"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {categoryMap[item.category_id] ||
                            `ID: ${item.category_id}`}
                        </span>
                      </td>

                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark text-center">
                        {item.is_breaking ? (
                          <span className="inline-flex rounded-full bg-red-100 text-red-800 px-3 py-1 text-xs font-medium">
                            Breaking
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-xs font-medium">
                            Standard
                          </span>
                        )}
                      </td>

                      {isAdmin && (
                        <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                          <div className="flex items-center justify-end gap-2 pr-4">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/scripts/view/${item.id}`);
                              }}
                              className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-gray-600 hover:text-blue-500 transition"
                              title="Lihat Detail"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/scripts/edit/${item.id}`);
                              }}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 hover:text-primary transition"
                              title="Edit"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteModal(item.id);
                              }}
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-gray-600 hover:text-red-500 transition"
                              title="Hapus"
                            >
                              <TrashBinIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="py-4 px-6 border-t border-stroke dark:border-strokedark flex justify-between items-center bg-gray-50 dark:bg-meta-4/20">
            <div className="text-sm text-gray-500">
              Total <b>{totalData}</b> script
            </div>
            <div className="flex gap-2">
              <button
                type="button"
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
                type="button"
                disabled={scripts.length < limit}
                onClick={() => setPage((p) => p + 1)}
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
        onConfirm={confirmDeleteScript}
        title="Hapus Script?"
        message="Data script ini akan dihapus permanen."
        isLoading={isDeleting}
      />
    </>
  );
}
