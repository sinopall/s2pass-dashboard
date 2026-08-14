import { useEffect, useState } from "react";
import {
  useForm,
  useFieldArray,
  Control,
  Controller,
  useWatch,
} from "react-hook-form";
import { Editor } from "@tinymce/tinymce-react";
import CategoryTreeSelect from "./CategoryTreeSelect";
import {
  flattenCategoryTree,
  CategoryNode,
  FlatCategory,
} from "../../utils/categoryUtils";

import axios from "../../api/axios";
import API from "../../api/api";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { TrashBinIcon, PlusIcon } from "../../icons";

// --- TYPES (Generic) ---
export interface AccordionItem {
  title: string;
  body_html: string;
}
export interface TabItem {
  title: string;
  accordions: AccordionItem[];
}

export interface ProductFormValues {
  title: string;
  slug: string;
  category_id: number;
  is_breaking: boolean;
  content: { tabs: TabItem[] };
}

interface ProductFormProps {
  initialValues?: ProductFormValues;
  onSubmit: (data: ProductFormValues) => void;
  isSubmitting: boolean;
  onCancel: () => void;
  titleLabel?: string;
  typeLabel?: string;
}

// --- SETTING TINYMCE (SELF-HOSTED) ---
// Tidak butuh API Key. Script TinyMCE di-load dari folder public/tinymce
// (hasil copy dari node_modules/tinymce, lihat panduan setup).
const TINY_SCRIPT_SRC = "/tinymce/tinymce.min.js";

// --- SUB-COMPONENT: ACCORDION ARRAY ---
const AccordionArray = ({
  nestIndex,
  control,
}: {
  nestIndex: number;
  control: Control<ProductFormValues>;
}) => {
  const { fields, remove, append } = useFieldArray({
    control,
    name: `content.tabs.${nestIndex}.accordions`,
  });

  return (
    <div className="mt-6 pl-4 border-l-4 border-gray-200 dark:border-strokedark space-y-6">
      {fields.map((item, k) => (
        <div
          key={item.id}
          className="p-6 bg-gray-50 dark:bg-meta-4 rounded-lg border border-stroke dark:border-strokedark relative shadow-sm"
        >
          <button
            type="button"
            onClick={() => remove(k)}
            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
            title="Hapus Accordion"
          >
            <TrashBinIcon className="w-5 h-5" />
          </button>
          <div className="mb-4 pr-10">
            <Label className="font-semibold text-gray-700 dark:text-gray-300">
              Judul Accordion
            </Label>
            <Controller
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Contoh: Deskripsi / Jawaban"
                  className="bg-white"
                />
              )}
              name={`content.tabs.${nestIndex}.accordions.${k}.title`}
              control={control}
              rules={{ required: true }}
            />
          </div>
          <div>
            <Label className="font-semibold text-gray-700 dark:text-gray-300">
              Konten Detail (HTML)
            </Label>
            <div className="rounded overflow-hidden border border-stroke dark:border-strokedark">
              {/* 2. IMPLEMENTASI TINYMCE EDITOR */}
              <Controller
                name={`content.tabs.${nestIndex}.accordions.${k}.body_html`}
                control={control}
                render={({ field }) => (
                  <Editor
                    tinymceScriptSrc={TINY_SCRIPT_SRC}
                    licenseKey="gpl"
                    value={field.value}
                    onEditorChange={(content) => field.onChange(content)}
                    init={{
                      // Tinggi awal pendek, otomatis mengikuti konten (autoresize),
                      // dan dibatasi max_height supaya tidak kepanjangan kalau
                      // kontennya banyak (nanti scroll internal di dalam editor).
                      min_height: 200,
                      max_height: 550,
                      autoresize_bottom_margin: 16,
                      menubar: true, // Tampilkan menu bar agar akses ke Tabel lebih lengkap
                      plugins: [
                        "advlist",
                        "autolink",
                        "autoresize",
                        "lists",
                        "link",
                        "image",
                        "charmap",
                        "preview",
                        "anchor",
                        "searchreplace",
                        "visualblocks",
                        "code",
                        "fullscreen",
                        "insertdatetime",
                        "media",
                        "table",
                        "code",
                        "help",
                        "wordcount",
                      ],
                      toolbar:
                        "undo redo | blocks | " +
                        "bold italic forecolor | alignleft aligncenter " +
                        "alignright alignjustify | bullist numlist outdent indent | " +
                        "table image link | removeformat | code", // Tombol Table & Image ada disini
                      content_style:
                        "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",

                      // Opsi tambahan untuk Image Upload (jika ingin convert ke base64 otomatis)
                      images_upload_handler: (blobInfo: any) =>
                        new Promise((resolve) => {
                          const reader = new FileReader();
                          reader.readAsDataURL(blobInfo.blob());
                          reader.onload = () =>
                            resolve(reader.result as string);
                        }),

                      // Opsi Tabel agar lebih fleksibel
                      table_sizing_mode: "responsive",
                      table_class_list: [
                        { title: "None", value: "" },
                        { title: "Bordered", value: "table-bordered" }, // Bisa sesuaikan dengan class CSS Anda
                      ],
                    }}
                  />
                )}
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append({ title: "", body_html: "" })}
        className="text-sm font-medium text-primary flex items-center gap-2 hover:underline py-2"
      >
        <PlusIcon className="w-4 h-4" /> Tambah Accordion Baru
      </button>
    </div>
  );
};

// --- COMPONENT UTAMA ---
export default function ProductForm({
  initialValues,
  onSubmit,
  isSubmitting,
  onCancel,
  titleLabel = "Judul",
  typeLabel = "Konten",
}: ProductFormProps) {
  // Default values
  const defaultValues: ProductFormValues = {
    title: "",
    slug: "",
    category_id: 1,
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

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    defaultValues: initialValues || defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "content.tabs",
  });

  // --- STATE KATEGORI ---
  const [flatCategories, setFlatCategories] = useState<FlatCategory[]>([]);
  const watchedCatId = useWatch({ control, name: "category_id" });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(API.categories.tree);
        const treeData: CategoryNode[] = res.data || [];
        const flat = flattenCategoryTree(treeData);
        setFlatCategories(flat);
      } catch (err) {
        console.error("Gagal load kategori:", err);
      }
    };
    fetchCategories();
  }, []);

  // --- EFFECT: INIT DATA (EDIT MODE) ---
  useEffect(() => {
    if (initialValues) {
      reset(initialValues);
    }
  }, [initialValues, reset]);

  const titleValue = useWatch({ control, name: "title" });
  useEffect(() => {
    if (titleValue) {
      const slug = titleValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setValue("slug", slug, { shouldDirty: true });
    }
  }, [titleValue, setValue]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-8 mx-auto pb-10"
    >
      {/* SECTION 1: INFO DASAR */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-semibold text-lg text-black dark:text-white">
            1. Informasi Dasar
          </h3>
        </div>
        <div className="p-6.5 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>{titleLabel}</Label>
              <Input
                {...register("title", { required: "Judul wajib diisi" })}
                placeholder={`Masukkan nama ${typeLabel.toLowerCase()}...`}
              />
              {errors.title && (
                <span className="text-red-500 text-sm">
                  {errors.title.message}
                </span>
              )}
            </div>
            <div>
              <Label>Slug (Auto-generated)</Label>
              <Input
                {...register("slug")}
                placeholder="Otomatis terisi..."
                className="bg-gray-100 text-gray-600 font-medium"
              />
            </div>
          </div>

          <div className="p-4 bg-white border border-stroke rounded dark:bg-boxdark dark:border-strokedark">
            <Label className="mb-3 font-semibold text-black dark:text-white">
              Lokasi Kategori
            </Label>

            <div className="flex flex-col gap-3">
              <div className="w-full">
                <label className="text-xs text-gray-500 mb-1 block">
                  Pilih Kategori
                </label>
                <CategoryTreeSelect
                  categories={flatCategories}
                  value={watchedCatId}
                  className="relative w-full"
                  onChange={(id) =>
                    setValue("category_id", id, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                />
              </div>
            </div>
            <div className="mt-3 text-right">
              <span className="text-xs font-medium text-gray-400">
                Selected Category ID:{" "}
                <span className="text-primary">{watchedCatId}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white border border-stroke rounded dark:bg-boxdark dark:border-strokedark">
            <input
              type="checkbox"
              id="breaking"
              {...register("is_breaking")}
              className="w-5 h-5 text-primary rounded focus:ring-primary"
            />
            <div className="flex flex-col">
              <label
                htmlFor="breaking"
                className="cursor-pointer font-medium text-black dark:text-white"
              >
                Highlight / Breaking?
              </label>
              <span className="text-xs text-gray-500">
                Jika dicentang, konten ini akan ditandai penting/populer.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: CONTENT BUILDER */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark flex justify-between items-center bg-gray-50 dark:bg-meta-4">
          <div>
            <h3 className="font-semibold text-lg text-black dark:text-white">
              2. Konten Detail (Accordion)
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Atur struktur konten.
            </p>
          </div>
          <button
            type="button"
            onClick={() => append({ title: "Tab Baru", accordions: [] })}
            className="hidden text-sm bg-primary text-white px-4 py-2 rounded shadow hover:bg-opacity-90 items-center gap-2"
          >
            <PlusIcon className="w-4 h-4 fill-current" /> Tambah Tab
          </button>
        </div>

        <div className="p-6.5 space-y-8">
          {fields.map((tab, index) => (
            <div
              key={tab.id}
              className="p-6 border-2 border-dashed border-gray-300 rounded-xl dark:border-strokedark hover:border-primary/50 transition-colors"
            >
              <div className="hidden mb-6 pb-4 border-b border-gray-200 dark:border-strokedark gap-4">
                <div className="flex-grow min-w-0">
                  <Label className="text-sm font-bold text-primary mb-1 uppercase tracking-wide">
                    Judul Tab #{index + 1}
                  </Label>
                  <Input
                    {...register(`content.tabs.${index}.title` as const, {
                      required: true,
                    })}
                    placeholder="Contoh: Informasi Umum, Syarat, Dokumen..."
                    className="font-semibold"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="shrink-0 inline-flex items-center gap-2 bg-white text-red-500 hover:text-white hover:bg-red-500 border border-red-300 px-3 py-3 rounded-lg transition-all text-sm font-medium"
                >
                  <TrashBinIcon className="w-4 h-4" />
                  <span>Hapus Tab Ini</span>
                </button>
              </div>
              <AccordionArray nestIndex={index} control={control} />
            </div>
          ))}

          {fields.length === 0 && (
            <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500 mb-3">Belum ada konten Tab.</p>
              <button
                type="button"
                onClick={() => append({ title: "Tab Baru", accordions: [] })}
                className="text-primary font-medium hover:underline"
              >
                Klik di sini untuk membuat Tab pertama
              </button>
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
