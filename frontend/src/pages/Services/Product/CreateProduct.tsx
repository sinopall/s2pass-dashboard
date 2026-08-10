import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import axios from "../../../api/axios";
import API from "../../../api/api";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import { toast } from "react-toastify";
import ContentForm, {
  ContentFormValues,
} from "../../../components/form/ContentForm";

export default function CreateProduct() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [initialData, setInitialData] = useState<ContentFormValues | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 1. FETCH DATA (JIKA EDIT MODE) ---
  useEffect(() => {
    if (isEditMode && id) {
      const fetchProductDetail = async () => {
        setLoading(true);
        try {
          // Panggil API Product Detail
          const response = await axios.get(API.products.detail(Number(id)));
          const data = response.data;

          // Set data awal untuk form
          setInitialData({
            title: data.title,
            slug: data.slug,
            category_id: data.category_id,
            is_breaking: data.is_breaking,
            content: data.content,
          });
        } catch (error) {
          console.error("Gagal load detail:", error);
          toast.error("Gagal mengambil data produk.");
          navigate("/products");
        } finally {
          setLoading(false);
        }
      };
      fetchProductDetail();
    }
  }, [isEditMode, id, navigate]);

  // --- 2. HANDLER SIMPAN ---
  const handleSave = async (data: ContentFormValues) => {
    setIsSubmitting(true);

    // Validasi Manual untuk Kategori
    if (!data.category_id || data.category_id === 0 || data.category_id === 1) {
      toast.error("Mohon pilih sub-kategori spesifik untuk Informasi.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      title: data.title,
      slug: data.slug,
      category_id: Number(data.category_id),
      is_breaking: Boolean(data.is_breaking),
      content: data.content,
    };

    try {
      // Tentukan API: PUT (Update) atau POST (Create)
      const saveProductPromise =
        isEditMode && id
          ? axios.put(API.products.detail(Number(id)), payload)
          : axios.post(API.products.list, payload);

      await toast.promise(saveProductPromise, {
        pending: "Sedang menyimpan produk...",
        success: `Berhasil! Produk telah ${isEditMode ? "diupdate" : "dibuat"}.`,
        error: {
          render({ data }: any) {
            const message =
              data.response?.data?.message || "Gagal menyimpan produk.";
            return `Error: ${message}`;
          },
        },
      });

      // Redirect ke Knowledge Base setelah sukses
      navigate("/products");
    } catch (error) {
      console.error(error);
      // Error sudah dihandle oleh toast.promise
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <PageBreadcrumb
        pageTitle={isEditMode ? "Edit Produk" : "Tambah Produk Baru"}
      />

      {/* Panggil ContentForm */}
      <ContentForm
        initialValues={initialData}
        onSubmit={handleSave}
        isSubmitting={isSubmitting}
        onCancel={() => navigate("/products")} // Arahkan tombol batal ke Knowledge Base
        titleLabel="Nama Produk"
        typeLabel="Produk"
      />
    </>
  );
}
