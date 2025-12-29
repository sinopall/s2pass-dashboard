import { useEffect, useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
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

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // HANDLER: Saat tombol (+) diklik (CREATE CHILD)
  const handleAddChild = (parent: Category, rootType: string, ancestors: Category[]) => {
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
  const handleEdit = (category: Category, rootType: string, ancestors: Category[]) => {
    setModalMode("edit");
    setModalParentData(category); // target rename
    setModalRootType(rootType);   // tipe root
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
      const msg = err.response?.data?.message || "Terjadi kesalahan saat menyimpan data.";
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
      const msg = err.response?.data?.message || "Terjadi kesalahan saat update data.";
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
      <PageBreadcrumb pageTitle="Kategori Layanan" />

      <div className="flex flex-col gap-5 md:gap-7 2xl:gap-10">
        {successMessage && (
          <div className="mb-4">
            <Alert variant="success" title="Berhasil" message={successMessage} showLink={false} />
          </div>
        )}

        {errorMessage && (
          <div className="mb-4">
            <Alert variant="error" title="Gagal" message={errorMessage} showLink={false} />
          </div>
        )}

        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          {/* Header */}
          <div className="py-6 px-4 md:px-6 xl:px-7.5 flex justify-between items-center border-b border-stroke dark:border-strokedark">
            <h4 className="text-xl font-semibold text-black dark:text-white">Daftar Kategori</h4>

            <Button size="sm" className="flex items-center gap-2" onClick={handleAddRoot}>
              <PlusIcon />
              Tambah Kategori
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-6 pb-0">
              <Alert variant="error" title="Error" message={error} showLink={false} />
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
                  <th className="py-4 px-4 font-medium text-black dark:text-white text-right">
                    Aksi
                  </th>
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
