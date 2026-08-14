import { useEffect, useRef, useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import Button from "../../../components/ui/button/Button";
import CategoryTableItem from "./CategoryTableItem";
import { Category } from "./types";
import { PlusIcon } from "../../../icons";
import axios from "../../../api/axios";
import API from "../../../api/api";
import Alert from "../../../components/ui/alert/Alert";
import CategoryFormModal from "./CategoryFormModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

type ModalMode = "create" | "edit";

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [modalParentData, setModalParentData] = useState<Category | null>(null);
  const [modalRootType, setModalRootType] = useState("Informasi");
  const [modalAncestors, setModalAncestors] = useState<Category[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ==================== SEARCH -> JUMP TO PRODUCT/SCRIPT ====================
  interface SearchResult {
    id: number;
    title: string;
    category_id: number;
    kind: "product" | "script";
  }

  const [searchQ, setSearchQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  // Set berisi id kategori (root..leaf) yang harus di-force-expand
  const [expandIds, setExpandIds] = useState<Set<number> | null>(null);
  // target highlight (id dan jenisnya)
  const [highlightTarget, setHighlightTarget] = useState<{ id: number, kind: "product"|"script" } | null>(
    null,
  );
  // nonce -> supaya effect scroll tetap ke-trigger walau user pilih ulang produk yang sama
  const [highlightNonce, setHighlightNonce] = useState(0);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQ.trim()), 350);
    return () => clearTimeout(t);
  }, [searchQ]);

  // fetch produk yang cocok
  useEffect(() => {
    if (!debouncedQ) {
      setSearchResults([]);
      return;
    }
    (async () => {
      setSearchLoading(true);
      try {
        const [prodRes, scriptRes] = await Promise.all([
          axios.get(API.products.list, { params: { q: debouncedQ, page: 1, limit: 5 } }),
          axios.get(API.scripts.list, { params: { q: debouncedQ, page: 1, limit: 5 } }),
        ]);

        const products = (prodRes.data?.items || []).map((p: any) => ({ ...p, kind: "product" }));
        const scripts = (scriptRes.data?.items || []).map((s: any) => ({ ...s, kind: "script" }));

        setSearchResults([...products, ...scripts]);
      } catch (err) {
        console.error("Gagal search produk/script:", err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    })();
  }, [debouncedQ]);

  // tutup dropdown search saat klik di luar
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!searchBoxRef.current) return;
      if (!searchBoxRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handlePickSearchResult = async (item: SearchResult) => {
    setSearchOpen(false);
    setSearchQ(item.title);

    try {
      const res = await axios.get(API.categories.path, {
        params: { leafId: item.category_id },
      });
      const path: Category[] = res.data || [];
      setExpandIds(new Set(path.map((c) => c.id)));
      setHighlightTarget({ id: item.id, kind: item.kind });
      setHighlightNonce((n) => n + 1);
    } catch (err) {
      console.error("Gagal ambil jalur kategori:", err);
    }
  };
  // =====================================================================

  // HANDLER: Saat tombol (+) diklik (CREATE CHILD)
  const handleAddChild = (
    parent: Category,
    rootType: string,
    ancestors: Category[],
  ) => {
    setModalMode("create");
    setModalParentData(parent);
    setModalRootType(rootType);
    setModalAncestors(ancestors);
    setIsModalOpen(true);
  };

  // HANDLER: Saat tombol "Tambah Kategori Utama" diklik (CREATE ROOT)
  const handleAddRoot = () => {
    setModalMode("create");
    setModalParentData(null);
    setModalRootType("Informasi");
    setModalAncestors([]);
    setIsModalOpen(true);
  };

  // HANDLER: EDIT CLICK
  const handleEdit = (
    category: Category,
    rootType: string,
    ancestors: Category[],
  ) => {
    setModalMode("edit");
    setModalParentData(category); // target rename
    setModalRootType(rootType); // tipe root
    setModalAncestors(ancestors); // path ancestors dari table recursion
    setIsModalOpen(true);
  };

  // HANDLER: DELETE CLICK
  const handleDelete = (category: Category) => {
    setDeleteTarget(category);
    setIsDeleteOpen(true);
  };

  // CREATE SUBMIT (existing)
  const handleModalSubmitCreate = async (fullPath: string[]) => {
    try {
      setSuccessMessage("");
      setErrorMessage("");

      const payload = { path: fullPath };
      const response = await axios.post(API.categories.path, payload);

      if (response.status === 200 || response.status === 201) {
        setSuccessMessage("Kategori berhasil disimpan!");
        setIsModalOpen(false);
        fetchCategories();
      }
    } catch (err: any) {
      console.error("Gagal menyimpan kategori:", err);
      const msg =
        err.response?.data?.message || "Terjadi kesalahan saat menyimpan data.";
      setErrorMessage(msg);
    }
  };

  // RENAME SUBMIT
  const handleModalSubmitRename = async (id: number, newName: string) => {
    try {
      setSuccessMessage("");
      setErrorMessage("");

      const payload = { name: newName };
      const response = await axios.put(API.categories.rename(id), payload);

      if (response.status === 200) {
        setSuccessMessage("Kategori berhasil diupdate!");
        setIsModalOpen(false);
        fetchCategories();
      }
    } catch (err: any) {
      console.error("Gagal rename kategori:", err);
      const msg =
        err.response?.data?.message || "Terjadi kesalahan saat update data.";
      setErrorMessage(msg);
    }
  };

  // CONFIRM DELETE
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    try {
      setSuccessMessage("");
      setErrorMessage("");

      await axios.delete(API.categories.delete(deleteTarget.id));

      setSuccessMessage("Kategori berhasil dihapus!");
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      fetchCategories();
    } catch (err: any) {
      console.error("Gagal hapus kategori:", err);
      const msg = err.response?.data?.message || "Gagal menghapus kategori.";
      setErrorMessage(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API.categories.tree);
      setCategories(response.data);
    } catch (err) {
      console.error("Gagal mengambil kategori:", err);
      setError("Gagal memuat data kategori.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const storedData = localStorage.getItem("user_data");
    if (storedData) {
      try {
        const user = JSON.parse(storedData);
        setIsAdmin(user.role === "admin");
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  return (
    <>
      <PageMeta
        title="Kategori Layanan | S2PAS"
        description="Halaman pengelolaan kategori layanan, request, dan complaint untuk sistem S2PAS Bank BJB."
      />

      <div className="flex flex-col gap-5 md:gap-7 2xl:gap-10">
        {successMessage && (
          <div className="mb-4">
            <Alert
              variant="success"
              title="Berhasil"
              message={successMessage}
              showLink={false}
            />
          </div>
        )}

        {errorMessage && (
          <div className="mb-4">
            <Alert
              variant="error"
              title="Gagal"
              message={errorMessage}
              showLink={false}
            />
          </div>
        )}

        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          {/* Header */}
          <div className="py-6 px-4 md:px-6 xl:px-7.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-stroke dark:border-strokedark">
            <h4 className="text-xl font-semibold text-black dark:text-white shrink-0">
              Daftar Kategori
            </h4>

            <div className="flex items-center gap-3 flex-1 md:justify-end">
              {/* Search jump-to-product */}
              <div ref={searchBoxRef} className="relative w-full max-w-xs">
                <input
                  type="text"
                  value={searchQ}
                  onChange={(e) => {
                    setSearchQ(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Cari produk atau script..."
                  className="w-full rounded-lg border border-stroke bg-white pl-4 pr-9 py-2.5 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="11"
                      cy="11"
                      r="7"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M21 21l-4-4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>

                {searchOpen && searchQ.trim() && (
                  <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark">
                    {searchLoading ? (
                      <div className="px-4 py-3 text-xs text-gray-400">
                        Mencari...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-gray-400">
                        Tidak ada produk atau script yang cocok.
                      </div>
                    ) : (
                      searchResults.map((p) => (
                        <button
                          key={`${p.kind}-${p.id}`}
                          type="button"
                          onClick={() => handlePickSearchResult(p)}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-meta-4 transition flex justify-between items-center"
                        >
                          <span className="truncate pr-2">{p.title}</span>
                          <span className="text-[10px] uppercase font-bold text-gray-400 shrink-0 border border-gray-200 dark:border-gray-600 rounded-full px-2 py-0.5">
                            {p.kind}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {isAdmin && (
                <Button
                  size="sm"
                  className="flex items-center gap-2 shrink-0"
                  onClick={handleAddRoot}
                >
                  <PlusIcon />
                  Tambah Kategori
                </Button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-6 pb-0">
              <Alert
                variant="error"
                title="Error"
                message={error}
                showLink={false}
              />
            </div>
          )}

          {/* Table */}
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                  <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                    Nama Kategori
                  </th>
                  <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                    Tipe
                  </th>
                  {isAdmin && (
                    <>
                      <th className="py-4 px-4 font-medium text-black dark:text-white text-right">
                        Aksi
                      </th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-gray-500">
                      Memuat data...
                    </td>
                  </tr>
                ) : categories.length > 0 ? (
                  categories.map((category) => (
                    <CategoryTableItem
                      key={category.id}
                      category={category}
                      level={0}
                      rootType={category.name}
                      onAddChild={handleAddChild}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      isAdmin={isAdmin}
                      expandIds={expandIds}
                      highlightTarget={highlightTarget}
                      highlightNonce={highlightNonce}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-gray-500">
                      Tidak ada data kategori.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Create/Edit */}
      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmitCreate}
        onSubmitRename={handleModalSubmitRename}
        mode={modalMode}
        parentData={modalParentData}
        initialRootType={modalRootType}
        ancestors={modalAncestors}
      />

      {/* Confirm Delete */}
      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        isLoading={deleteLoading}
        title="Hapus Kategori"
        description={
          deleteTarget
            ? `Yakin ingin menghapus "${deleteTarget.name}"? Jika kategori punya child, backend akan menolak (restrict).`
            : "Yakin ingin menghapus kategori ini?"
        }
      />
    </>
  );
}
