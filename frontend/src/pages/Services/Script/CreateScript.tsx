import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import axios from "../../../api/axios";
import API from "../../../api/api";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import { toast } from "react-toastify";
// Import Form Reusable yang sudah Anda buat
import ScriptForm, {
  ScriptFormValues,
} from "../../../components/form/ScriptForm";

export default function CreateScript() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEditMode = Boolean(id);

  const prefillCategoryId = location.state?.prefillCategoryId;
  const prefillProductId = location.state?.prefillProductId;

  const [initialData, setInitialData] = useState<ScriptFormValues | undefined>(
    () => {
      // Jika mode BUAT BARU dan ada data prefill dari halaman produk
      if (!isEditMode && (prefillCategoryId || prefillProductId)) {
        return {
          title: "",
          slug: "",
          category_id: prefillCategoryId || 1,
          product_id: prefillProductId,
          is_breaking: false,
          content: {
            tabs: [
              {
                title: "Informasi Umum",
                accordions: [{ title: "Deskripsi", body_html: "" }],
              },
            ],
          },
        };
      }
      return undefined; // Jika tidak ada prefill, biarkan undefined (menggunakan default ScriptForm)
    },
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
            product_id: data.product_id,
            is_breaking: data.is_breaking,
            content: data.content,
          });
        } catch (err) {
          console.error(err);
          toast.error("Gagal mengambil data script.");
          navigate("/scripts");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isEditMode, id, navigate]);

  // 2. Handler Simpan
  const handleSave = async (data: ScriptFormValues) => {
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
      product_id: data.product_id ? Number(data.product_id) : undefined,
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

      navigate("/scripts", { state: { activeTab: "script" } });
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
      <ScriptForm
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
