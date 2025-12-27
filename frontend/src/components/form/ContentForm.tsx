import { useEffect, useState, useMemo, useCallback } from "react";
import { useForm, useFieldArray, Control, Controller, useWatch } from "react-hook-form";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css"; 
import axios from "../../api/axios";
import API from "../../api/api"; 
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { TrashBinIcon, PlusIcon, ChevronDownIcon } from "../../icons"; 

// --- TYPES (Generic) ---
export interface AccordionItem { title: string; body_html: string; }
export interface TabItem { title: string; accordions: AccordionItem[]; }

// Tipe data form yang seragam untuk Product & Script
export interface ContentFormValues {
  title: string;
  slug: string;
  category_id: number;
  is_breaking: boolean;
  content: { tabs: TabItem[]; };
}

// Props yang diterima komponen ini
interface ContentFormProps {
  initialValues?: ContentFormValues;      // Data awal (untuk Edit Mode)
  onSubmit: (data: ContentFormValues) => void; // Fungsi yang dijalankan saat Submit
  isSubmitting: boolean;                  // Status loading saat save
  onCancel: () => void;                   // Fungsi saat tombol Batal diklik
  titleLabel?: string;                    // Label judul (default: "Judul")
  typeLabel?: string;                     // Label tipe konten (default: "Produk")
}

interface CategoryOption { id: number; name: string; }
interface CategoryLevel { depth: number; options: CategoryOption[]; selectedId: string; isLoading: boolean; }

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

// --- SUB-COMPONENT: ACCORDION ARRAY ---
const AccordionArray = ({ nestIndex, control }: { nestIndex: number; control: Control<ContentFormValues> }) => {
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
                    render={({ field }) => <Input {...field} placeholder="Contoh: Deskripsi / Jawaban" className="bg-white" />}
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
export default function ContentForm({ 
  initialValues, 
  onSubmit, 
  isSubmitting, 
  onCancel,
  titleLabel = "Judul",
  typeLabel = "Konten"
}: ContentFormProps) {

  // Default values
  const defaultValues: ContentFormValues = {
      title: "", 
      slug: "", 
      category_id: 1, 
      is_breaking: false,
      content: { tabs: [{ title: "Informasi Umum", accordions: [{ title: "Deskripsi", body_html: "" }] }] }
  };

  const { register, control, handleSubmit, setValue, reset, formState: { errors } } = useForm<ContentFormValues>({
    defaultValues: initialValues || defaultValues
  });

  const { fields, append, remove } = useFieldArray({ control, name: "content.tabs" });

  // --- STATE KATEGORI ---
  const [rootType, setRootType] = useState("Informasi");
  const [categoryLevels, setCategoryLevels] = useState<CategoryLevel[]>([]);
  const watchedCatId = useWatch({ control, name: "category_id" });

  // --- HELPER FETCH CHILDREN ---
  const fetchChildren = useCallback(async (parentId: number) => {
    try {
      const response = await axios.get(`${API.categories.children}?parentId=${parentId}`);
      return response.data || [];
    } catch (error) { return []; }
  }, []);

  // --- RECONSTRUCT DROPDOWN (Saat Edit Mode) ---
  const reconstructDropdowns = useCallback(async (targetCategoryId: number) => {
    try {
        const response = await axios.get(`${API.categories.path}?leafId=${targetCategoryId}`); 
        const pathData: CategoryOption[] = response.data;
        if (!pathData || pathData.length === 0) return;

        const rootCategory = pathData[0]; 
        let rootName = "Informasi";
        if (rootCategory.name.toLowerCase() === "informasi") rootName = "Informasi";
        else if (rootCategory.name.toLowerCase() === "request") rootName = "Request";
        else if (rootCategory.name.toLowerCase() === "complaint") rootName = "Complaint";
        
        setRootType(rootName);

        const reconstructedLevels: CategoryLevel[] = [];
        for (let i = 0; i < pathData.length; i++) {
             const parentId = pathData[i].id;
             const children = await fetchChildren(parentId);
             if (children.length > 0) {
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

  // --- EFFECT: INIT DATA (EDIT MODE) ---
  useEffect(() => {
    if (initialValues) {
        reset(initialValues);
        if (initialValues.category_id) {
            reconstructDropdowns(initialValues.category_id);
        }
    } else {
        // Init untuk Create Mode (Load Root Level)
        const initCategory = async () => {
             // Default Root ID = 1 (Informasi)
             const children = await fetchChildren(1);
             setCategoryLevels(children.length > 0 ? [{ depth: 1, options: children, selectedId: "", isLoading: false }] : []);
        };
        initCategory();
    }
  }, [initialValues, reset, reconstructDropdowns, fetchChildren]);

  // --- HANDLERS KATEGORI ---
  const handleRootChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newRoot = e.target.value;
      setRootType(newRoot);

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
         // Fallback logic
         if (index === 0) {
             let rootId = 1;
             if (rootType === "Request") rootId = 2;
             if (rootType === "Complaint") rootId = 3;
             setValue("category_id", rootId);
         } else {
             const prevSelected = updatedLevels[index - 1].selectedId;
             setValue("category_id", parseInt(prevSelected));
         }
     }
  };

  // --- LOGIC SLUG ---
  const titleValue = useWatch({ control, name: "title" });
  useEffect(() => {
    // Generate slug hanya jika create mode (tidak ada initialValues) atau user belum mengetik manual
    // Disini disederhanakan: update slug jika title berubah
    if (titleValue) {
        const slug = titleValue.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        setValue("slug", slug, { shouldDirty: true }); 
    }
  }, [titleValue, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8 mx-auto pb-10">
      
      {/* SECTION 1: INFO DASAR */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark"><h3 className="font-semibold text-lg text-black dark:text-white">1. Informasi Dasar</h3></div>
          <div className="p-6.5 flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>{titleLabel}</Label>
                  <Input {...register("title", { required: "Judul wajib diisi" })} placeholder={`Masukkan nama ${typeLabel.toLowerCase()}...`} />
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
                   <label htmlFor="breaking" className="cursor-pointer font-medium text-black dark:text-white">Highlight / Breaking?</label>
                   <span className="text-xs text-gray-500">Jika dicentang, konten ini akan ditandai penting/populer.</span>
                </div>
            </div>
          </div>
      </div>

      {/* SECTION 2: CONTENT BUILDER */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark flex justify-between items-center bg-gray-50 dark:bg-meta-4">
            <div>
                <h3 className="font-semibold text-lg text-black dark:text-white">2. Konten Detail (Tabs & Accordion)</h3>
                <p className="text-sm text-gray-500 mt-1">Atur struktur tab dan accordion.</p>
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

              {fields.length === 0 && (
                  <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <p className="text-gray-500 mb-3">Belum ada konten Tab.</p>
                      <button type="button" onClick={() => append({ title: "Tab Baru", accordions: [] })} className="text-primary font-medium hover:underline">Klik di sini untuk membuat Tab pertama</button>
                  </div>
              )}
          </div>
      </div>
      
      {/* ACTION BUTTONS */}
      <div className="sticky bottom-4 z-20 bg-white/90 backdrop-blur dark:bg-boxdark/90 p-4 rounded-lg border border-stroke shadow-lg flex justify-end gap-4">
           <Button 
              variant="outline" 
              type="button" 
              onClick={(e) => {
                  e.preventDefault();
                  onCancel();
              }}
           >
              Batal
           </Button>
           <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
              {isSubmitting ? "Menyimpan..." : "Simpan Data"}
           </Button>
      </div>
    </form>
  );
}