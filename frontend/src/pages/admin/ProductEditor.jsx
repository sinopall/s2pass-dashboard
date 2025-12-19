import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "../../lib/api";
import { useToast } from "../../components/ToastProvider";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";

import {
  ArrowLeft,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code2,
  Link2,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Paintbrush,
  ImagePlus,
  FileUp,
  Table as TableIcon,
  Columns3,
  Rows3,
  Trash2,
  Merge,
  Split,
  Undo2,
  Redo2,
  Plus,
  ChevronDown,
  ChevronRight,
  X,
  Save,
} from "lucide-react";

function norm(s) {
  return (s || "").trim().toLowerCase();
}

/** ===== TipTap Extensions ===== */
function editorExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Underline,
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    Link.configure({
      openOnClick: true,
      autolink: true,
      linkOnPaste: true,
    }),
    Image.configure({
      inline: false,
      allowBase64: false, // kita pakai upload URL
    }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
  ];
}

/** ===== Icon Button ===== */
function IconBtn({ title, onClick, active, disabled, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={[
        "h-9 w-9 rounded-xl border flex items-center justify-center",
        "transition shadow-sm",
        disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50",
        active ? "bg-bjb-navy text-white border-bjb-navy" : "bg-white text-slate-700 border-slate-200",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/** ===== Editor Toolbar (Word-like) ===== */
function EditorToolbar({ editor, onUploadImage, onUploadFile }) {
  if (!editor) return null;

  const canUndo = editor.can().undo();
  const canRedo = editor.can().redo();

  function setLink() {
    const prev = editor.getAttributes("link").href || "";
    const url = window.prompt("Masukkan URL:", prev);
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url.trim() }).run();
  }

  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
      <div className="flex flex-wrap gap-2 items-center">
        {/* basic */}
        <IconBtn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={18} />
        </IconBtn>
        <IconBtn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={18} />
        </IconBtn>
        <IconBtn title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={18} />
        </IconBtn>
        <IconBtn title="Strike" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={18} />
        </IconBtn>

        <div className="h-8 w-px bg-slate-200 mx-1" />

        {/* align */}
        <IconBtn title="Align Left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft size={18} />
        </IconBtn>
        <IconBtn title="Align Center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter size={18} />
        </IconBtn>
        <IconBtn title="Align Right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <AlignRight size={18} />
        </IconBtn>

        <div className="h-8 w-px bg-slate-200 mx-1" />

        {/* lists */}
        <IconBtn title="Bullet List" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={18} />
        </IconBtn>
        <IconBtn title="Ordered List" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={18} />
        </IconBtn>

        <IconBtn title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={18} />
        </IconBtn>
        <IconBtn title="Code Block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code2 size={18} />
        </IconBtn>

        <div className="h-8 w-px bg-slate-200 mx-1" />

        {/* link */}
        <IconBtn title="Set Link" active={editor.isActive("link")} onClick={setLink}>
          <Link2 size={18} />
        </IconBtn>
        <IconBtn title="Remove Link" onClick={() => editor.chain().focus().unsetLink().run()}>
          <Unlink size={18} />
        </IconBtn>

        <div className="h-8 w-px bg-slate-200 mx-1" />

        {/* color */}
        <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 h-9">
          <Paintbrush size={18} className="text-slate-700" />
          <input
            title="Text color"
            type="color"
            className="h-7 w-7 cursor-pointer bg-transparent"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          />
          <button
            type="button"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            onClick={() => editor.chain().focus().unsetColor().run()}
          >
            Reset
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 h-9">
          <Highlighter size={18} className="text-slate-700" />
          <input
            title="Highlight"
            type="color"
            className="h-7 w-7 cursor-pointer bg-transparent"
            onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
          />
          <button
            type="button"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            onClick={() => editor.chain().focus().unsetHighlight().run()}
          >
            Clear
          </button>
        </div>

        <div className="h-8 w-px bg-slate-200 mx-1" />

        {/* upload */}
        <IconBtn title="Upload Image" onClick={onUploadImage}>
          <ImagePlus size={18} />
        </IconBtn>
        <IconBtn title="Attach File (PDF)" onClick={onUploadFile}>
          <FileUp size={18} />
        </IconBtn>

        <div className="h-8 w-px bg-slate-200 mx-1" />

        {/* table */}
        <IconBtn title="Insert Table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          <TableIcon size={18} />
        </IconBtn>

        <IconBtn title="Add Column Before" onClick={() => editor.chain().focus().addColumnBefore().run()}>
          <Columns3 size={18} />
        </IconBtn>
        <IconBtn title="Add Row Before" onClick={() => editor.chain().focus().addRowBefore().run()}>
          <Rows3 size={18} />
        </IconBtn>

        <IconBtn title="Delete Column" onClick={() => editor.chain().focus().deleteColumn().run()}>
          <Trash2 size={18} />
        </IconBtn>
        <IconBtn title="Delete Row" onClick={() => editor.chain().focus().deleteRow().run()}>
          <Trash2 size={18} />
        </IconBtn>
        <IconBtn title="Delete Table" onClick={() => editor.chain().focus().deleteTable().run()}>
          <Trash2 size={18} />
        </IconBtn>

        {/* merge / split */}
        <IconBtn title="Merge Cells" onClick={() => editor.chain().focus().mergeCells().run()}>
          <Merge size={18} />
        </IconBtn>
        <IconBtn title="Split Cell" onClick={() => editor.chain().focus().splitCell().run()}>
          <Split size={18} />
        </IconBtn>

        <div className="h-8 w-px bg-slate-200 mx-1" />

        <IconBtn title="Undo" disabled={!canUndo} onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 size={18} />
        </IconBtn>
        <IconBtn title="Redo" disabled={!canRedo} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 size={18} />
        </IconBtn>
      </div>
    </div>
  );
}

/** ===== TipTap Editor wrapper ===== */
function TipTap({ valueHtml, onChangeHtml, onUploadImageUrl, onUploadFileUrl }) {
  const editor = useEditor({
    extensions: editorExtensions(),
    content: valueHtml || "",
    onUpdate: ({ editor }) => onChangeHtml(editor.getHTML()),
    editorProps: {
      attributes: { class: "tiptap-editor prose-tiptap" },
    },
  });

  // sync external -> editor (edit load)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((valueHtml || "") !== (current || "")) editor.commands.setContent(valueHtml || "", false);
  }, [valueHtml, editor]);

  // upload helpers (insert into editor)
  async function upload(kind) {
    const accept = kind === "image" ? "image/*" : ".pdf";
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;

      const fd = new FormData();
      fd.append("file", f);

      const res = await api.post("/uploads", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { url, name, ext } = res.data || {};
      if (!url) return;

      // insert
      if (kind === "image") {
        editor.chain().focus().setImage({ src: url }).run();
        onUploadImageUrl?.(url);
      } else {
        // PDF link
        editor.chain().focus().setLink({ href: url }).insertContent(name || "Attachment").unsetLink().run();
        onUploadFileUrl?.(url);
      }
    };
    input.click();
  }

  return (
    <div className="space-y-3">
      <EditorToolbar
        editor={editor}
        onUploadImage={() => upload("image")}
        onUploadFile={() => upload("file")}
      />
      <EditorContent editor={editor} />
    </div>
  );
}

/** ===== Accordion UI ===== */
function AccordionCard({ idx, item, onToggle, open, onRemove, onTitleChange, onBodyChange }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 p-3 bg-slate-50 border-b border-slate-200">
        <button type="button" onClick={onToggle} className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>

        <input
          className="input flex-1"
          value={item.title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={`Judul section #${idx + 1} (contoh: Jika Status Active)`}
        />

        <button
          type="button"
          onClick={onRemove}
          className="h-9 w-9 rounded-xl bg-red-50 text-red-700 border border-red-100 flex items-center justify-center hover:bg-red-100"
          title="Remove section"
        >
          <X size={18} />
        </button>
      </div>

      {open && (
        <div className="p-4">
          <TipTap valueHtml={item.body_html} onChangeHtml={onBodyChange} />
        </div>
      )}
    </div>
  );
}

/** ===== MAIN ===== */
export function ProductEditor({ mode }) {
  const toast = useToast();
  const nav = useNavigate();
  const { id } = useParams();

  const mainOptions = useMemo(() => ["Informasi", "Request", "Complaint"], []);

  const [title, setTitle] = useState("");
  const [isBreaking, setIsBreaking] = useState(false);

  // categories
  const [roots, setRoots] = useState([]);
  const [root, setRoot] = useState("Informasi");
  const [levels, setLevels] = useState([""]); // sub1..n
  const [options, setOptions] = useState({});
  const [categoryId, setCategoryId] = useState(0);

  // accordions only
  const [accordions, setAccordions] = useState([{ title: "", body_html: "" }]);
  const [openIdx, setOpenIdx] = useState(0);

  const [saving, setSaving] = useState(false);

  async function loadTree() {
    const res = await api.get("/categories/tree");
    setRoots(res.data || []);
  }

  function findRootByName(name) {
    return (roots || []).find((n) => norm(n.name) === norm(name)) || null;
  }

  useEffect(() => {
    loadTree().catch(() => {});
  }, []);

  // cascade children dropdown
  useEffect(() => {
    async function run() {
      const next = {};
      const rootNode = findRootByName(root);
      if (!rootNode) {
        setOptions(next);
        setCategoryId(0);
        return;
      }

      const r1 = await api.get("/categories/children", { params: { parentId: rootNode.id } });
      next[1] = r1.data || [];

      let parentId = rootNode.id;
      let lastMatchedId = 0;

      for (let i = 0; i < levels.length; i++) {
        const name = (levels[i] || "").trim();
        if (!name) break;

        const list = next[i + 1] || [];
        const found = list.find((c) => norm(c.name) === norm(name));
        if (!found) break;

        lastMatchedId = found.id;
        parentId = found.id;

        const resp = await api.get("/categories/children", { params: { parentId } });
        next[i + 2] = resp.data || [];
      }

      setOptions(next);
      setCategoryId(lastMatchedId);
    }

    if (!roots.length) return;
    run().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, levels, roots]);

  // edit load
  useEffect(() => {
    async function loadProduct() {
      if (mode !== "edit") return;
      try {
        const res = await api.get(`/products/${id}`);
        const p = res.data;

        setTitle(p.title || "");
        setIsBreaking(!!p.is_breaking);

        // content already JSON object (after backend fix to json.RawMessage)
        const content = p.content || {};
        const acc = Array.isArray(content.accordions) ? content.accordions : [];
        setAccordions(acc.length ? acc : [{ title: "", body_html: "" }]);

        // prefill category chain
        if (p.category_id) {
          const pathRes = await api.get("/categories/path", { params: { leafId: p.category_id } });
          const path = pathRes.data || []; // [{id,name,level...}] root->leaf
          if (path.length >= 2) {
            setRoot(path[0].name);
            setLevels(path.slice(1).map((x) => x.name));
            setOpenIdx(0);
          }
        }
      } catch (e) {
        toast.error("Gagal load product", e?.response?.data?.error ?? "Unknown");
      }
    }
    loadProduct();
  }, [mode, id]); // eslint-disable-line react-hooks/exhaustive-deps

  function setLevel(idx, val) {
    setLevels((prev) => {
      const copy = [...prev];
      copy[idx] = val;
      for (let i = idx + 1; i < copy.length; i++) copy[i] = "";
      return copy;
    });
  }

  function addLevel() {
    setLevels((p) => [...p, ""]);
  }
  function removeLastLevel() {
    setLevels((p) => (p.length <= 1 ? p : p.slice(0, p.length - 1)));
  }

  function addAccordion() {
    setAccordions((p) => [...p, { title: "", body_html: "" }]);
    setOpenIdx(accordions.length);
  }

  function updateAcc(i, patch) {
    setAccordions((p) => p.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }

  function removeAcc(i) {
    setAccordions((p) => {
      const next = p.filter((_, idx) => idx !== i);
      if (next.length === 0) return [{ title: "", body_html: "" }];
      return next;
    });
    setOpenIdx((prev) => (prev === i ? 0 : prev));
  }

  async function save() {
    if (!title.trim()) return toast.error("Validasi", "Judul wajib diisi");
    if (!categoryId || categoryId <= 0) return toast.error("Validasi", "Pilih category existing sampai leaf (wajib)");

    // validate accordion
    for (const a of accordions) {
      if (!a.title?.trim()) return toast.error("Validasi", "Judul accordion tidak boleh kosong");
      if (!a.body_html?.trim()) return toast.error("Validasi", "Konten accordion tidak boleh kosong");
    }

    const payload = {
      title: title.trim(),
      category_id: categoryId,
      is_breaking: isBreaking,
      content: { accordions },
    };

    try {
      setSaving(true);
      if (mode === "edit") {
        await api.put(`/products/${id}`, payload);
        toast.success("Berhasil", "Product berhasil diupdate");
      } else {
        await api.post("/products", payload);
        toast.success("Berhasil", "Product berhasil dibuat");
      }
      nav("/admin/products");
    } catch (e) {
      toast.error("Gagal save", e?.response?.data?.error ?? "Unknown");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 pb-24">
      {/* Header card */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-bold text-slate-900">
              {mode === "edit" ? "Edit Product" : "Create Product"}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              Editor ala Word: icon toolbar, warna, highlight, tabel merge/split, upload image & PDF. Semua konten di accordion.
            </div>
          </div>

          <button
            type="button"
            onClick={() => nav(-1)}
            className="rounded-2xl bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <span className="inline-flex items-center gap-2">
              <ArrowLeft size={16} /> Back
            </span>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="text-xs font-semibold text-slate-700">Judul</div>
            <input
              className="input mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Reset DIGI - Jika Status Active"
            />
          </div>

          <div className="flex items-center gap-3 mt-6 md:mt-0">
            <input type="checkbox" checked={isBreaking} onChange={(e) => setIsBreaking(e.target.checked)} />
            <div className="text-sm font-semibold text-slate-900">Breaking News</div>
          </div>
        </div>

        {/* Category selector */}
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 border border-slate-100">
          <div className="font-bold text-slate-900 mb-2">Pilih Category (Existing)</div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <div className="text-xs font-semibold text-slate-700">Main Category</div>
              <select
                className="input mt-1"
                value={root}
                onChange={(e) => {
                  setRoot(e.target.value);
                  setLevels([""]);
                }}
              >
                {mainOptions.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            {levels.map((val, idx) => {
              const levelIndex = idx + 1;
              const opts = options[levelIndex] || [];
              return (
                <div key={levelIndex}>
                  <div className="text-xs font-semibold text-slate-700">Sub level-{levelIndex}</div>
                  <select className="input mt-1" value={val} onChange={(e) => setLevel(idx, e.target.value)}>
                    <option value="">-- pilih --</option>
                    {opts.map((o) => (
                      <option key={o.id} value={o.name}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex gap-2 flex-wrap items-center">
            <button type="button" className="btn-ghost bg-white border border-slate-200" onClick={addLevel}>
              <span className="inline-flex items-center gap-2"><Plus size={16}/> tambah level</span>
            </button>
            <button type="button" className="btn-ghost bg-white border border-slate-200" onClick={removeLastLevel}>
              hapus level
            </button>
            <div className="ml-auto text-xs text-slate-600">
              Leaf categoryId: <b>{categoryId || "-"}</b>
            </div>
          </div>
        </div>
      </div>

      {/* Accordions */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-slate-900">Accordion Sections</div>
            <div className="text-sm text-slate-500 mt-1">Semua konten product disimpan di section ini.</div>
          </div>
          <button type="button" className="btn-primary" onClick={addAccordion}>
            + Add Section
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {accordions.map((a, idx) => (
            <AccordionCard
              key={idx}
              idx={idx}
              item={a}
              open={openIdx === idx}
              onToggle={() => setOpenIdx(openIdx === idx ? -1 : idx)}
              onRemove={() => removeAcc(idx)}
              onTitleChange={(v) => updateAcc(idx, { title: v })}
              onBodyChange={(html) => updateAcc(idx, { body_html: html })}
            />
          ))}
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => nav(-1)}
            className="rounded-2xl bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <span className="inline-flex items-center gap-2">
              <ArrowLeft size={16} /> Back
            </span>
          </button>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-2xl bg-bjb-navy px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2">
              <Save size={16} /> {saving ? "Saving..." : "Save"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
