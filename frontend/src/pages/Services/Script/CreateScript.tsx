import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import axios from "../../../api/axios";
import API from "../../../api/api";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import { toast } from "react-toastify";
// Import Form Reusable yang sudah Anda buat
import ContentForm, {
  ContentFormValues,
} from "../../../components/form/ContentForm";

export default function CreateScript() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [initialData, setInitialData] = useState<ContentFormValues | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Data jika Edit Mode
  useEffect(() => {
    if (isEditMode && id) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const res = await axios.get(API.scripts.detail(Number(id)));
          const data = res.data;
          // Mapping response API ke Form Values
          setInitialData({
            title: data.title,
            slug: data.slug,
            category_id: data.category_id,
            is_breaking: data.is_breaking,
            content: data.content,
          });
        } catch (err) {
          console.error(err);
          toast.error("Gagal mengambil data script.");
          navigate("/products");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isEditMode, id, navigate]);

  // 2. Handler Simpan
  const handleSave = async (data: ContentFormValues) => {
    setIsSubmitting(true);

    // Validasi
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
      const savePromise =
        isEditMode && id
          ? axios.put(API.scripts.detail(Number(id)), payload)
          : axios.post(API.scripts.list, payload);

      await toast.promise(savePromise, {
        pending: "Menyimpan script...",
        success: `Berhasil! Script telah ${isEditMode ? "diupdate" : "dibuat"}.`,
        error: {
          render({ data }: any) {
            return data.response?.data?.message || "Gagal menyimpan script.";
          },
        },
      });

      navigate("/products", { state: { activeTab: "script" } });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Memuat data...</div>;

  return (
    <>
      <PageBreadcrumb
        pageTitle={isEditMode ? "Edit Script" : "Tambah Script Baru"}
      />
      <ContentForm
        initialValues={initialData}
        onSubmit={handleSave}
        isSubmitting={isSubmitting}
        onCancel={() =>
          navigate("/scripts", { state: { activeTab: "script" } })
        }
        titleLabel="Judul Script"
        typeLabel="Script"
      />
    </>
  );
}
