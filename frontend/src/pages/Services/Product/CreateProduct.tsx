import { useEffect, useState, useMemo, useCallback } from "react"; // Tambah useCallback
import { useForm, useFieldArray, Control, Controller, useWatch } from "react-hook-form";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css"; 
import { useNavigate, useParams } from "react-router"; 
import axios from "../../../api/axios";
import API from "../../../api/api"; 
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import { TrashBinIcon, PlusIcon, ChevronDownIcon } from "../../../icons"; 
import { toast } from 'react-toastify';

// --- TYPES ---
interface CategoryOption { id: number; name: string; }
interface CategoryLevel { depth: number; options: CategoryOption[]; selectedId: string; isLoading: boolean; }
interface AccordionItem { title: string; body_html: string; }
interface TabItem { title: string; accordions: AccordionItem[]; }
interface ProductFormValues {
  title: string; slug: string; category_id: number; is_breaking: boolean;
  content: { tabs: TabItem[]; };
}

// --- CONFIG QUILL ---
const useQuillModules = () => {
  return useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'], 
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'], 
      ['clean']
    ],
  }), []);
};

// --- SUB-COMPONENT: ACCORDION ---
const AccordionArray = ({ nestIndex, control }: { nestIndex: number; control: Control<ProductFormValues> }) => {
  const { fields, remove, append } = useFieldArray({
    control,
    name: `content.tabs.${nestIndex}.accordions`,
  });
  const quillModules = useQuillModules(); 

  return (
    <div className="mt-6 pl-4 border-l-4 border-gray-200 dark:border-strokedark space-y-6">
      {fields.map((item, k) => (
        <div key={item.id} className="p-6 bg-gray-50 dark:bg-meta-4 rounded-lg border border-stroke dark:border-strokedark relative shadow-sm">
            <button type="button" onClick={() => remove(k)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors" title="Hapus Accordion">
                <TrashBinIcon className="w-5 h-5" />
            </button>
            <div className="mb-4 pr-10">
                <Label className="font-semibold text-gray-700 dark:text-gray-300">Judul Accordion</Label>
                <Controller
                    render={({ field }) => <Input {...field} placeholder="Contoh: Syarat & Ketentuan" className="bg-white" />}
                    name={`content.tabs.${nestIndex}.accordions.${k}.title`}
                    control={control}
                    rules={{ required: true }}
                />
            </div>
            <div>
                <Label className="font-semibold text-gray-700 dark:text-gray-300">Konten Detail (HTML)</Label>
                <div className="bg-white dark:bg-boxdark rounded overflow-hidden">
                    <Controller
                        name={`content.tabs.${nestIndex}.accordions.${k}.body_html`}
                        control={control}
                        render={({ field }) => (
                        <ReactQuill theme="snow" modules={quillModules} value={field.value} onChange={field.onChange} className="bg-white dark:bg-boxdark h-64 mb-12" />
                        )}
                    />
                </div>
            </div>
        </div>
      ))}
      <button type="button" onClick={() => append({ title: "", body_html: "" })} className="text-sm font-medium text-primary flex items-center gap-2 hover:underline py-2">
        <PlusIcon className="w-4 h-4" /> Tambah Accordion Baru
      </button>
    </div>
  );
};

// --- COMPONENT UTAMA ---
export default function CreateProduct() {
  const navigate = useNavigate();
  const { id } = useParams(); 
  const isEditMode = Boolean(id); 

  const [rootType, setRootType] = useState("Informasi");
  const [categoryLevels, setCategoryLevels] = useState<CategoryLevel[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const { register, control, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<ProductFormValues>({
    defaultValues: {
      title: "", slug: "", category_id: 1, is_breaking: false,
      content: { tabs: [{ title: "Informasi Umum", accordions: [{ title: "Deskripsi", body_html: "" }] }] }
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "content.tabs" });

  // --- HELPER FETCH CHILDREN ---
  // Gunakan useCallback agar tidak re-render loop
  const fetchChildren = useCallback(async (parentId: number) => {
    try {
      const response = await axios.get(`${API.categories.children}?parentId=${parentId}`);
      return response.data || [];
    } catch (error) { return []; }
  }, []);

  // --- LOGIC REKONSTRUKSI DROPDOWN (INTI SOLUSI) ---
  const reconstructDropdowns = useCallback(async (targetCategoryId: number) => {
    try {
        // PERUBAHAN DISINI:
        // Sesuaikan dengan endpoint Anda: /categories/path?leafId=5
        const response = await axios.get(`${API.categories.path}?leafId=${targetCategoryId}`); 
        
        const pathData: CategoryOption[] = response.data;

        if (!pathData || pathData.length === 0) return;

        // 1. Set Root Dropdown (Informasi/Request/Complaint)
        // Ambil item pertama (index 0) sebagai Root
        const rootCategory = pathData[0]; 
        let rootName = "Informasi";
        
        // Pastikan mapping ID ke Name ini sesuai dengan database Anda
        // Tips: Lebih aman jika logic ini pakai rootCategory.name saja jika namanya konsisten
        if (rootCategory.name.toLowerCase() === "informasi") rootName = "Informasi";
        else if (rootCategory.name.toLowerCase() === "request") rootName = "Request";
        else if (rootCategory.name.toLowerCase() === "complaint") rootName = "Complaint";
        
        setRootType(rootName);

        // 2. Loop Path untuk bangun Level Dropdown
        const reconstructedLevels: CategoryLevel[] = [];
        
        // Loop setiap level di path
        for (let i = 0; i < pathData.length; i++) {
             const parentId = pathData[i].id;
             
             // Ambil anak-anak dari parent ini
             const children = await fetchChildren(parentId);
             
             // Jika parent ini punya anak, tampilkan dropdown level berikutnya
             if (children.length > 0) {
                 // Cari siapa anak yang terpilih di level berikutnya (berdasarkan pathData selanjutnya)
                 const nextInPath = pathData[i + 1];
                 const selectedId = nextInPath ? String(nextInPath.id) : "";

                 reconstructedLevels.push({
                     depth: i + 1,
                     options: children,
                     selectedId: selectedId,
                     isLoading: false
                 });
             }
        }

        setCategoryLevels(reconstructedLevels);

    } catch (error) {
        console.error("Gagal merekonstruksi path kategori:", error);
    }
  }, [fetchChildren]);


  // --- 1. FETCH DATA EDIT & RECONSTRUCT ---
  useEffect(() => {
    if (isEditMode && id) {
        const fetchProductDetail = async () => {
            setLoadingData(true);
            try {
                const response = await axios.get(API.products.detail(Number(id)));
                const data = response.data; 
                
                reset({
                    title: data.title,
                    slug: data.slug,
                    category_id: data.category_id,
                    is_breaking: data.is_breaking,
                    content: data.content 
                });

                // PANGGIL FUNGSI REKONSTRUKSI
                if (data.category_id) {
                    await reconstructDropdowns(data.category_id);
                }

            } catch (error) {
                console.error("Gagal load detail:", error);
                alert("Gagal mengambil data produk.");
                navigate("/services/products");
            } finally {
                setLoadingData(false);
            }
        };
        fetchProductDetail();
    }
  }, [isEditMode, id, reset, navigate, reconstructDropdowns]);


  // --- LOGIC INIT (CREATE MODE) ---
  useEffect(() => {
    // Hanya jalan di Create Mode atau jika User mengubah Root Type secara manual
    if (!loadingData && !isEditMode) {
        const initCategory = async () => {
            let rootId = 1;
            if (rootType === "Request") rootId = 2;
            if (rootType === "Complaint") rootId = 3;
            
            setValue("category_id", rootId); // Set default value

            const children = await fetchChildren(rootId);
            setCategoryLevels(children.length > 0 ? [{ depth: 1, options: children, selectedId: "", isLoading: false }] : []);
        };
        initCategory();
    }
  }, [rootType, setValue, isEditMode, loadingData, fetchChildren]);

  // Handler Perubahan Dropdown Root Manual
  const handleRootChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newRoot = e.target.value;
      setRootType(newRoot);

      // Reset logic untuk manual change
      let rootId = 1;
      if (newRoot === "Request") rootId = 2;
      if (newRoot === "Complaint") rootId = 3;
      setValue("category_id", rootId);

      const children = await fetchChildren(rootId);
      setCategoryLevels(children.length > 0 ? [{ depth: 1, options: children, selectedId: "", isLoading: false }] : []);
  };

  const handleLevelChange = async (index: number, value: string) => {
     const updatedLevels = [...categoryLevels];
     updatedLevels[index].selectedId = value;
     if (index < updatedLevels.length - 1) updatedLevels.splice(index + 1);
     setCategoryLevels(updatedLevels);

     if (value) {
         setValue("category_id", parseInt(value));
         const nextChildren = await fetchChildren(parseInt(value));
         if (nextChildren.length > 0) {
             setCategoryLevels(prev => [...prev, { depth: prev.length + 1, options: nextChildren, selectedId: "", isLoading: false }]);
         }
     } else {
         if (index === 0) {
             // Fallback ke Root ID jika level 1 di-reset
             let rootId = 1;
             if (rootType === "Request") rootId = 2;
             if (rootType === "Complaint") rootId = 3;
             setValue("category_id", rootId);
         } else {
             // Fallback ke Parent ID sebelumnya
             const prevSelected = updatedLevels[index - 1].selectedId;
             setValue("category_id", parseInt(prevSelected));
         }
     }
  };

  // Logic Slug Update
  const titleValue = useWatch({ control, name: "title" });
  useEffect(() => {
    // Hanya update slug otomatis jika title berubah DAN form sudah "dirty" (user mengetik)
    // ATAU: Kita bisa cek apakah slug masih kosong/default
    if (titleValue) {
        const slug = titleValue.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        setValue("slug", slug, { shouldDirty: true }); 
    }
  }, [titleValue, setValue]);

  const onSubmit = async (data: ProductFormValues) => {
    if (!data.category_id || data.category_id === 0) {
        toast.error("Mohon pilih Kategori terlebih dahulu."); 
        return;
    }

    const payload = {
        title: data.title,
        slug: data.slug,
        category_id: Number(data.category_id), 
        is_breaking: Boolean(data.is_breaking), 
        content: {
            tabs: data.content.tabs.map(tab => ({
                title: tab.title,
                accordions: tab.accordions.map(accordion => ({
                    title: accordion.title,
                    body_html: accordion.body_html
                }))
            }))
        }
    };

    const saveProductPromise = isEditMode && id
        ? axios.put(API.products.detail(Number(id)), payload)
        : axios.post(API.products.list, payload);

    await toast.promise(
        saveProductPromise,
        {
            pending: 'Sedang menyimpan produk...', 
            success: 'Berhasil! Produk telah disimpan.',
            error: {
                render({ data }: any) {
                    const message = data.response?.data?.message || "Gagal menyimpan produk.";
                    return `Error: ${message}`;
                }
            }
        }
    );
    navigate("/services/products");
};

  const watchedCatId = useWatch({ control, name: "category_id" });

  if (loadingData) {
      return (
          <div className="flex h-screen items-center justify-center">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
          </div>
      );
  }

  return (
    <>
      <PageBreadcrumb pageTitle={isEditMode ? "Edit Produk" : "Tambah Produk Baru"} />

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8 mx-auto pb-10">
        
        {/* SECTION 1: INFO DASAR */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark"><h3 className="font-semibold text-lg text-black dark:text-white">1. Informasi Dasar Produk</h3></div>
            <div className="p-6.5 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Nama Produk</Label>
                    <Input {...register("title", { required: "Judul wajib diisi" })} placeholder="Masukkan nama produk..." />
                    {errors.title && <span className="text-red-500 text-sm">{errors.title.message}</span>}
                  </div>
                  <div>
                    <Label>Slug (Auto-generated)</Label>
                    <Input {...register("slug")} placeholder="Otomatis terisi..." className="bg-gray-100 text-gray-600 font-medium" />
                  </div>
              </div>

              <div className="p-5 bg-gray-50 dark:bg-meta-4 rounded border border-gray-200 dark:border-strokedark">
                 <Label className="mb-3 font-semibold text-black dark:text-white">Lokasi Kategori</Label>
                 
                 <div className="flex flex-col gap-3">
                    <div className="w-full">
                        <label className="text-xs text-gray-500 mb-1 block">Tipe Layanan (Root)</label>
                        <div className="relative bg-white dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
                            <select value={rootType} onChange={handleRootChange} className="w-full appearance-none bg-transparent py-2 px-3 outline-none transition focus:border-primary active:border-primary dark:bg-form-input">
                                <option value="Informasi">Informasi</option>
                                <option value="Request">Request</option>
                                <option value="Complaint">Complaint</option>
                            </select>
                            <span className="absolute top-1/2 right-3 -translate-y-1/2"><ChevronDownIcon className="w-4 h-4" /></span>
                        </div>
                    </div>
                    {categoryLevels.map((lvl, idx) => (
                        <div key={idx} className="w-full animate-in fade-in slide-in-from-top-2">
                             <div className="flex items-center gap-2">
                                 <div className="text-gray-400 pl-2">↳</div> 
                                 <div className="grow">
                                     <label className="text-xs text-gray-500 mb-1 block">Sub Kategori Level {lvl.depth}</label>
                                     <div className="relative bg-white dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
                                         <select value={lvl.selectedId} onChange={(e) => handleLevelChange(idx, e.target.value)} className="w-full appearance-none bg-transparent py-2 px-3 outline-none transition focus:border-primary active:border-primary dark:bg-form-input">
                                             <option value="">-- Pilih Sub Kategori --</option>
                                             {lvl.options.map((opt) => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                                         </select>
                                         <span className="absolute top-1/2 right-3 -translate-y-1/2"><ChevronDownIcon className="w-4 h-4" /></span>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    ))}
                 </div>
                 <div className="mt-3 text-right">
                     <span className="text-xs font-medium text-gray-400">Selected Category ID: <span className="text-primary">{watchedCatId}</span></span>
                 </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-white border border-stroke rounded dark:bg-boxdark dark:border-strokedark">
                 <input type="checkbox" id="breaking" {...register("is_breaking")} className="w-5 h-5 text-primary rounded focus:ring-primary" />
                 <div className="flex flex-col">
                    <label htmlFor="breaking" className="cursor-pointer font-medium text-black dark:text-white">Set as Breaking / Promo?</label>
                    <span className="text-xs text-gray-500">Produk ini akan ditampilkan di carousel/highlight utama.</span>
                 </div>
              </div>
            </div>
        </div>

        {/* SECTION 2: CONTENT BUILDER */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark flex justify-between items-center bg-gray-50 dark:bg-meta-4">
              <div>
                  <h3 className="font-semibold text-lg text-black dark:text-white">2. Konten Detail (Tabs & Accordion)</h3>
                  <p className="text-sm text-gray-500 mt-1">Atur struktur konten produk di sini.</p>
              </div>
              <button type="button" onClick={() => append({ title: "Tab Baru", accordions: [] })} className="text-sm bg-primary text-white px-4 py-2 rounded shadow hover:bg-opacity-90 flex items-center gap-2">
                <PlusIcon className="w-4 h-4 fill-current" /> Tambah Tab
              </button>
            </div>
            
            <div className="p-6.5 space-y-8">
                {fields.map((tab, index) => (
                    <div key={tab.id} className="p-6 border-2 border-dashed border-gray-300 rounded-xl dark:border-strokedark hover:border-primary/50 transition-colors">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-200 dark:border-strokedark gap-4">
                             <div className="flex-grow w-full md:w-auto">
                                <Label className="text-sm font-bold text-primary mb-1 uppercase tracking-wide">Judul Tab #{index + 1}</Label>
                                <Input {...register(`content.tabs.${index}.title` as const, { required: true })} placeholder="Contoh: Informasi Umum, Syarat, Dokumen..." className="font-semibold" />
                             </div>
                             <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-white hover:bg-red-500 border border-red-200 px-3 py-2 rounded transition-all text-sm flex items-center gap-2 shrink-0">
                                <TrashBinIcon className="w-4 h-4" /> Hapus Tab Ini
                             </button>
                        </div>
                        <AccordionArray nestIndex={index} control={control} />
                    </div>
                ))}

                {fields.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500 mb-3">Belum ada konten Tab.</p>
                        <button type="button" onClick={() => append({ title: "Tab Baru", accordions: [] })} className="text-primary font-medium hover:underline">Klik di sini untuk membuat Tab pertama</button>
                    </div>
                ) : (
                    <div className="flex justify-center pt-4 border-t border-gray-100">
                        <button type="button" onClick={() => append({ title: "Tab Baru", accordions: [] })} className="text-sm text-primary font-bold px-4 py-2 rounded border border-primary border-dashed hover:bg-primary/5 flex items-center gap-2">
                            <PlusIcon className="w-4 h-4 fill-current" /> Tambah Tab Berikutnya
                        </button>
                    </div>
                )}
            </div>
        </div>
        
        <div className="sticky bottom-4 z-20 bg-white/90 backdrop-blur dark:bg-boxdark/90 p-4 rounded-lg border border-stroke shadow-lg flex justify-end gap-4">
             <Button variant="outline" type="button" onClick={() => navigate(-1)}>Batal</Button>
             <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
                {isSubmitting ? "Menyimpan..." : (isEditMode ? "Update Produk" : "Simpan Produk")}
             </Button>
        </div>
      </form>
    </>
  );
}