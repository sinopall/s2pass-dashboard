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

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalParentData, setModalParentData] = useState<Category | null>(null);
  const [modalRootType, setModalRootType] = useState("Informasi");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [modalAncestors, setModalAncestors] = useState<Category[]>([]);

  // HANDLER: Saat tombol (+) diklik
  const handleAddChild = (parent: Category, rootType: string, ancestors: Category[]) => {
    setModalParentData(parent); // Simpan data parent
    setModalRootType(rootType); // Simpan root type (Informasi/Request/etc)
    setModalAncestors(ancestors);
    setIsModalOpen(true);
  };

  // HANDLER: Saat tombol "Tambah Kategori Utama" diklik
  const handleAddRoot = () => {
    setModalParentData(null);
    setModalRootType("Informasi"); // Default
    setModalAncestors([]);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (fullPath: string[]) => {
    try {
      // Reset alert
      setSuccessMessage("");
      setErrorMessage("");

      // Request Body sesuai spesifikasi Anda
      const payload = {
        path: fullPath
      };

      console.log("Sending Payload:", payload); // Debugging

      // POST Request
      const response = await axios.post(API.categories.path, payload);

      if (response.status === 200 || response.status === 201) {
        setSuccessMessage("Kategori berhasil disimpan!");
        setIsModalOpen(false); // Tutup modal
        fetchCategories();     // Refresh tabel tree
      }

    } catch (err: any) {
      console.error("Gagal menyimpan kategori:", err);
      // Menangani pesan error dari backend jika ada
      const msg = err.response?.data?.message || "Terjadi kesalahan saat menyimpan data.";
      setErrorMessage(msg);
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
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("");
      }, 2000);

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
            <h4 className="text-xl font-semibold text-black dark:text-white">
              Daftar Kategori
            </h4>
            
            <Button size="sm" className="flex items-center gap-2" onClick={handleAddRoot}>
               <PlusIcon />
               Tambah Kategori
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-6 pb-0">
               <Alert variant="error" title="Error" message={error} showLink={false}/>
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
                    Actions
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
      <CategoryFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        parentData={modalParentData}
        initialRootType={modalRootType}
        ancestors={modalAncestors}
      />
    </>
  );
}