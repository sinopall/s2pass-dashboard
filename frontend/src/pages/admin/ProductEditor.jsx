import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "../../lib/api";
import { useToast } from "../../components/ToastProvider";
import { DocxImporter } from "../../components/DocxImporter";

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
  Paperclip,
  Download,
  FileText,
  File as FileIcon,
} from "lucide-react";

function norm(s) {
  return (s || "").trim().toLowerCase();
}

function slugify(str) {
  return (str || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toAbsoluteUrl(url) {
  const origin = import.meta.env.VITE_API_ORIGIN || "http://localhost:8080";
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${origin}${url}`;
}

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function editorExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      underline: false,
      link: false,
    }),
    Underline,
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Link.configure({ openOnClick: true, autolink: true, linkOnPaste: true }),
    Image.configure({ inline: false, allowBase64: false }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
  ];
}

function IconBtn({ title, onClick, active, disabled, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={[
        "h-9 w-9 rounded-xl border flex items-center justify-center transition shadow-sm",
        disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50",
        active
          ? "bg-bjb-navy text-white border-bjb-navy"
          : "bg-white text-slate-700 border-slate-200",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

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
        <IconBtn
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={18} />
        </IconBtn>
        <IconBtn
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={18} />
        </IconBtn>
        <IconBtn
          title="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={18} />
        </IconBtn>
        <IconBtn
          title="Strike"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={18} />
        </IconBtn>
        <div className="h-8 w-px bg-slate-200 mx-1" />
        <IconBtn
          title="Align Left"
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft size={18} />
        </IconBtn>
        <IconBtn
          title="Align Center"
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter size={18} />
        </IconBtn>
        <IconBtn
          title="Align Right"
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight size={18} />
        </IconBtn>
        <div className="h-8 w-px bg-slate-200 mx-1" />
        <IconBtn
          title="Bullet List"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={18} />
        </IconBtn>
        <IconBtn
          title="Ordered List"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={18} />
        </IconBtn>
        <IconBtn
          title="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={18} />
        </IconBtn>
        <IconBtn
          title="Code Block"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code2 size={18} />
        </IconBtn>
        <div className="h-8 w-px bg-slate-200 mx-1" />
        <IconBtn
          title="Set Link"
          active={editor.isActive("link")}
          onClick={setLink}
        >
          <Link2 size={18} />
        </IconBtn>
        <IconBtn
          title="Remove Link"
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          <Unlink size={18} />
        </IconBtn>
        <div className="h-8 w-px bg-slate-200 mx-1" />
        <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 h-9">
          <Paintbrush size={18} className="text-slate-700" />
          <input
            title="Text color"
            type="color"
            className="h-7 w-7 cursor-pointer bg-transparent"
            onChange={(e) =>
              editor.chain().focus().setColor(e.target.value).run()
            }
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
            onChange={(e) =>
              editor
                .chain()
                .focus()
                .toggleHighlight({ color: e.target.value })
                .run()
            }
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
        <IconBtn title="Upload Image" onClick={onUploadImage}>
          <ImagePlus size={18} />
        </IconBtn>
        <IconBtn title="Attach File (PDF)" onClick={onUploadFile}>
          <FileUp size={18} />
        </IconBtn>
        <div className="h-8 w-px bg-slate-200 mx-1" />
        <IconBtn
          title="Insert Table"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          <TableIcon size={18} />
        </IconBtn>
        <IconBtn
          title="Add Column Before"
          onClick={() => editor.chain().focus().addColumnBefore().run()}
        >
          <Columns3 size={18} />
        </IconBtn>
        <IconBtn
          title="Add Row Before"
          onClick={() => editor.chain().focus().addRowBefore().run()}
        >
          <Rows3 size={18} />
        </IconBtn>
        <IconBtn
          title="Delete Column"
          onClick={() => editor.chain().focus().deleteColumn().run()}
        >
          <Trash2 size={18} />
        </IconBtn>
        <IconBtn
          title="Delete Row"
          onClick={() => editor.chain().focus().deleteRow().run()}
        >
          <Trash2 size={18} />
        </IconBtn>
        <IconBtn
          title="Delete Table"
          onClick={() => editor.chain().focus().deleteTable().run()}
        >
          <Trash2 size={18} />
        </IconBtn>
        <IconBtn
          title="Merge Cells"
          onClick={() => editor.chain().focus().mergeCells().run()}
        >
          <Merge size={18} />
        </IconBtn>
        <IconBtn
          title="Split Cell"
          onClick={() => editor.chain().focus().splitCell().run()}
        >
          <Split size={18} />
        </IconBtn>
        <div className="h-8 w-px bg-slate-200 mx-1" />
        <IconBtn
          title="Undo"
          disabled={!canUndo}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={18} />
        </IconBtn>
        <IconBtn
          title="Redo"
          disabled={!canRedo}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={18} />
        </IconBtn>
      </div>
    </div>
  );
}

function TipTap({ valueHtml, onChangeHtml }) {
  const editor = useEditor({
    extensions: editorExtensions(),
    content: valueHtml || "",
    onUpdate: ({ editor }) => onChangeHtml(editor.getHTML()),
    editorProps: { attributes: { class: "tiptap-editor prose-tiptap" } },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((valueHtml || "") !== (current || ""))
      editor.commands.setContent(valueHtml || "", false);
  }, [valueHtml, editor]);

  async function upload(kind) {
    if (!editor) return;
    const accept = kind === "image" ? "image/*" : ".pdf";
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      try {
        const fd = new FormData();
        fd.append("file", f);
        const res = await api.post("/uploads", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const { url, name } = res.data || {};
        const absoluteUrl = toAbsoluteUrl(url);
        if (!absoluteUrl) return;
        if (kind === "image") {
          editor.chain().focus().setImage({ src: absoluteUrl }).run();
        } else {
          editor
            .chain()
            .focus()
            .setLink({ href: absoluteUrl })
            .insertContent(name || "Attachment")
            .unsetLink()
            .run();
        }
      } catch (e) {
        console.error(e);
        alert(e?.response?.data?.error || "Upload gagal");
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

function AccordionCard({
  idx,
  item,
  onToggle,
  open,
  onRemove,
  onTitleChange,
  onBodyChange,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 p-3 bg-slate-50 border-b border-slate-200">
        <button
          type="button"
          onClick={onToggle}
          className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center"
        >
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
        <input
          className="input flex-1"
          value={item.title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={`Judul accordion #${idx + 1}`}
        />
        <button
          type="button"
          onClick={onRemove}
          className="h-9 w-9 rounded-xl bg-red-50 text-red-700 border border-red-100 flex items-center justify-center hover:bg-red-100"
          title="Remove accordion"
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

// ==================== ATTACHMENTS PANEL ====================

function fileIconFor(ext) {
  if (ext === ".docx") return <FileText size={18} className="text-blue-600" />;
  if (ext === ".pdf") return <FileText size={18} className="text-red-600" />;
  return <FileIcon size={18} className="text-slate-500" />;
}

function AttachmentRow({ att, onDelete }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-white">
      <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
        {fileIconFor(att.file_ext)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-900 truncate">
          {att.file_name}
        </div>
        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
          <span>{formatFileSize(att.file_size)}</span>
          <span>•</span>
          <span>{new Date(att.created_at).toLocaleString()}</span>
          {att.kind === "source_document" && (
            <>
              <span>•</span>
              <span className="text-bjb-navy font-semibold">Dokumen Asli</span>
            </>
          )}
        </div>
      </div>
      <a
        href={toAbsoluteUrl(att.file_url)}
        target="_blank"
        rel="noreferrer"
        download
        className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 shrink-0"
        title="Download"
      >
        <Download size={16} className="text-slate-700" />
      </a>
      <button
        type="button"
        onClick={() => onDelete(att.id)}
        className="h-9 w-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center hover:bg-red-100 shrink-0"
        title="Hapus lampiran"
      >
        <Trash2 size={16} className="text-red-600" />
      </button>
    </div>
  );
}

function AttachmentsPanel({ productId, toast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get(`/products/${productId}/attachments`);
      setItems(res.data || []);
    } catch (e) {
      toast.error("Gagal load lampiran", e?.response?.data?.error ?? "Unknown");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (productId) load();
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "attachment");
      await api.post(`/products/${productId}/attachments`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Berhasil", "Lampiran berhasil diupload");
      await load();
    } catch (e) {
      toast.error("Gagal upload", e?.response?.data?.error ?? "Unknown");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(attId) {
    if (!confirm("Hapus lampiran ini? File akan dihapus permanen.")) return;
    try {
      await api.delete(`/products/attachments/${attId}`);
      toast.success("Berhasil", "Lampiran dihapus");
      await load();
    } catch (e) {
      toast.error("Gagal hapus", e?.response?.data?.error ?? "Unknown");
    }
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-bold text-slate-900 inline-flex items-center gap-2">
            <Paperclip size={18} /> Lampiran
          </div>
          <div className="text-sm text-slate-500 mt-1">
            Dokumen asli (docx/pdf) dan file pendukung lainnya.
          </div>
        </div>
        <label className="rounded-2xl bg-bjb-navy px-4 py-2 text-sm font-semibold text-white hover:opacity-95 cursor-pointer inline-flex items-center gap-2">
          {uploading ? "Mengupload..." : "+ Upload File"}
          <input
            type="file"
            className="hidden"
            accept=".docx,.pdf,.png,.jpg,.jpeg,.webp"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <div className="text-sm text-slate-500 py-4 text-center">
            Memuat lampiran...
          </div>
        ) : items.length === 0 ? (
          <div className="text-sm text-slate-500 py-6 text-center">
            Belum ada lampiran untuk produk ini.
          </div>
        ) : (
          items.map((att) => (
            <AttachmentRow key={att.id} att={att} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  );
}

// ==================== MAIN ====================

export function ProductEditor({ mode }) {
  const toast = useToast();
  const nav = useNavigate();
  const { id } = useParams();

  const mainOptions = useMemo(() => ["Informasi", "Request", "Complaint"], []);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isBreaking, setIsBreaking] = useState(false);

  const [roots, setRoots] = useState([]);
  const [root, setRoot] = useState("Informasi");
  const [levels, setLevels] = useState([""]);
  const [options, setOptions] = useState({});
  const [categoryId, setCategoryId] = useState(0);

  const [tabs, setTabs] = useState([
    { title: "Default", accordions: [{ title: "", body_html: "" }] },
  ]);
  const [activeTab, setActiveTab] = useState(0);
  const [openIdx, setOpenIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  // File hasil docx import yang sudah tersimpan di server,
  // tapi BELUM ter-link ke produk manapun (karena produk baru belum punya id).
  // Akan di-link otomatis setelah produk berhasil disimpan (create).
  const [pendingAttachment, setPendingAttachment] = useState(null);

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

  useEffect(() => {
    async function run() {
      const next = {};
      const rootNode = findRootByName(root);
      if (!rootNode) {
        setOptions(next);
        setCategoryId(0);
        return;
      }
      const r1 = await api.get("/categories/children", {
        params: { parentId: rootNode.id },
      });
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
        const resp = await api.get("/categories/children", {
          params: { parentId },
        });
        next[i + 2] = resp.data || [];
      }
      setOptions(next);
      setCategoryId(lastMatchedId);
    }
    if (!roots.length) return;
    run().catch(() => {});
  }, [root, levels, roots]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function loadProduct() {
      if (mode !== "edit") return;
      try {
        const res = await api.get(`/products/${id}`);
        const p = res.data;
        setTitle(p.title || "");
        setSlug(p.slug || "");
        setIsBreaking(!!p.is_breaking);
        const content = p.content || {};
        const loadedTabs = Array.isArray(content.tabs) ? content.tabs : null;
        if (loadedTabs && loadedTabs.length) {
          setTabs(
            loadedTabs.map((t) => ({
              title: t.title || "Tab",
              accordions: Array.isArray(t.accordions)
                ? t.accordions
                : [{ title: "", body_html: "" }],
            })),
          );
        } else {
          const acc = Array.isArray(content.accordions)
            ? content.accordions
            : [];
          setTabs([
            {
              title: "Default",
              accordions: acc.length ? acc : [{ title: "", body_html: "" }],
            },
          ]);
        }
        setActiveTab(0);
        setOpenIdx(0);
        if (p.category_id) {
          const pathRes = await api.get("/categories/path", {
            params: { leafId: p.category_id },
          });
          const path = pathRes.data || [];
          if (path.length >= 2) {
            setRoot(path[0].name);
            setLevels(path.slice(1).map((x) => x.name));
          }
        }
      } catch (e) {
        toast.error(
          "Gagal load product",
          e?.response?.data?.error ?? "Unknown",
        );
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

  // ==================== DOCX IMPORT HANDLER ====================
  function handleDocxApply(result) {
    if (!title.trim() && result.title) setTitle(result.title);
    if (!slug.trim() && result.suggested_slug) setSlug(result.suggested_slug);
    if (result.tabs && result.tabs.length > 0) {
      setTabs(result.tabs);
      setActiveTab(0);
      setOpenIdx(0);
    }

    // Simpan info file asli untuk di-link setelah produk disimpan.
    // Untuk mode "edit", langsung link sekarang juga (produk sudah punya id).
    if (result.original_file_url) {
      const fileInfo = {
        file_name: result.original_file_name,
        file_url: result.original_file_url,
        file_size: result.original_file_size,
        kind: "source_document",
      };

      if (mode === "edit" && id) {
        api
          .post(`/products/${id}/attachments/link`, fileInfo)
          .then(() =>
            toast.success(
              "Dokumen tersimpan",
              "File asli berhasil dilampirkan ke produk ini",
            ),
          )
          .catch(() =>
            toast.error(
              "Gagal lampirkan",
              "File sudah ter-parse, tapi gagal disimpan sebagai lampiran",
            ),
          );
      } else {
        setPendingAttachment(fileInfo);
      }
    }

    const totalAcc = result.tabs.reduce((s, t) => s + t.accordions.length, 0);
    toast.success(
      "Berhasil diimport",
      `${result.tabs.length} tab · ${totalAcc} accordion siap diedit`,
    );
  }

  // ==================== TAB ACTIONS ====================
  function addTab() {
    setTabs((prev) => [
      ...prev,
      {
        title: `Tab ${prev.length + 1}`,
        accordions: [{ title: "", body_html: "" }],
      },
    ]);
    setActiveTab(tabs.length);
    setOpenIdx(0);
  }
  function renameTab(idx, newTitle) {
    setTabs((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, title: newTitle } : t)),
    );
  }
  function removeTab(idx) {
    setTabs((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length
        ? next
        : [{ title: "Default", accordions: [{ title: "", body_html: "" }] }];
    });
    setActiveTab((prev) => (prev === idx ? 0 : prev > idx ? prev - 1 : prev));
    setOpenIdx(0);
  }

  // ==================== ACCORDION ACTIONS ====================
  function addAccordion() {
    setTabs((prev) =>
      prev.map((t, i) => {
        if (i !== activeTab) return t;
        return {
          ...t,
          accordions: [...t.accordions, { title: "", body_html: "" }],
        };
      }),
    );
    setOpenIdx((prev) => prev + 1);
  }
  function updateAcc(accIdx, patch) {
    setTabs((prev) =>
      prev.map((t, i) => {
        if (i !== activeTab) return t;
        return {
          ...t,
          accordions: t.accordions.map((a, j) =>
            j === accIdx ? { ...a, ...patch } : a,
          ),
        };
      }),
    );
  }
  function removeAcc(accIdx) {
    setTabs((prev) =>
      prev.map((t, i) => {
        if (i !== activeTab) return t;
        const nextAcc = t.accordions.filter((_, j) => j !== accIdx);
        return {
          ...t,
          accordions: nextAcc.length ? nextAcc : [{ title: "", body_html: "" }],
        };
      }),
    );
    setOpenIdx((prev) => (prev === accIdx ? 0 : prev));
  }

  async function save() {
    const t = title.trim();
    if (!t) return toast.error("Validasi", "Judul wajib diisi");
    if (!categoryId || categoryId <= 0)
      return toast.error(
        "Validasi",
        "Pilih category existing sampai leaf (wajib)",
      );
    for (const tab of tabs) {
      if (!tab.title?.trim())
        return toast.error("Validasi", "Judul tab tidak boleh kosong");
      for (const a of tab.accordions || []) {
        if (!a.title?.trim())
          return toast.error("Validasi", "Judul accordion tidak boleh kosong");
        if (!a.body_html?.trim())
          return toast.error("Validasi", "Konten accordion tidak boleh kosong");
      }
    }
    const payload = {
      title: t,
      slug: slug.trim() ? slugify(slug.trim()) : "",
      category_id: categoryId,
      is_breaking: isBreaking,
      content: { tabs },
    };
    try {
      setSaving(true);
      if (mode === "edit") {
        await api.put(`/products/${id}`, payload);
        toast.success("Berhasil", "Product berhasil diupdate");
      } else {
        const res = await api.post("/products", payload);
        const newId = res.data?.id;

        // Kalau ada file docx pending dari proses import, link sekarang
        // setelah produk baru ini berhasil dibuat dan punya id.
        if (newId && pendingAttachment) {
          try {
            await api.post(
              `/products/${newId}/attachments/link`,
              pendingAttachment,
            );
          } catch (e) {
            // Tidak fatal — produk tetap berhasil dibuat meski lampiran gagal di-link
            console.error("Gagal link attachment:", e);
            toast.error(
              "Lampiran gagal disimpan",
              "Produk berhasil dibuat, tapi file asli gagal dilampirkan. Bisa upload manual nanti.",
            );
          }
        }

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
              Tab → Accordion. Import dari .docx atau isi manual.
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

        {/* Title & Slug */}
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="text-xs font-semibold text-slate-700">Judul</div>
            <input
              className="input mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Kredit Ghuna Bhakti"
            />
          </div>
          <div className="md:col-span-1">
            <div className="text-xs font-semibold text-slate-700">
              Slug (optional)
            </div>
            <input
              className="input mt-1"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="kredit-ghuna-bhakti"
            />
            <div className="mt-1 text-[11px] text-slate-500">
              Kosong = auto-generate dari judul.
            </div>
          </div>
          <div className="flex items-center gap-3 md:col-span-3">
            <input
              type="checkbox"
              checked={isBreaking}
              onChange={(e) => setIsBreaking(e.target.checked)}
            />
            <div className="text-sm font-semibold text-slate-900">
              Breaking News
            </div>
          </div>
        </div>

        {/* Category selector */}
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 border border-slate-100">
          <div className="font-bold text-slate-900 mb-2">
            Pilih Category (Existing)
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <div className="text-xs font-semibold text-slate-700">
                Main Category
              </div>
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
                  <div className="text-xs font-semibold text-slate-700">
                    Sub level-{levelIndex}
                  </div>
                  <select
                    className="input mt-1"
                    value={val}
                    onChange={(e) => setLevel(idx, e.target.value)}
                  >
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
            <button
              type="button"
              className="btn-ghost bg-white border border-slate-200"
              onClick={addLevel}
            >
              <span className="inline-flex items-center gap-2">
                <Plus size={16} /> tambah level
              </span>
            </button>
            <button
              type="button"
              className="btn-ghost bg-white border border-slate-200"
              onClick={removeLastLevel}
            >
              hapus level
            </button>
            <div className="ml-auto text-xs text-slate-600">
              Leaf categoryId: <b>{categoryId || "-"}</b>
            </div>
          </div>
        </div>

        {/* ==================== DOCX IMPORT ==================== */}
        <div className="mt-5">
          <div className="mb-3">
            <div className="font-bold text-slate-900">
              Import dari Dokumen Word
            </div>
            <div className="text-sm text-slate-500 mt-1">
              Upload .docx — heading otomatis jadi tab &amp; accordion. Edit
              bebas setelah import.
            </div>
          </div>
          <DocxImporter onApply={handleDocxApply} />

          {pendingAttachment && (
            <div className="mt-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-3">
              <FileText size={18} className="text-amber-700 shrink-0" />
              <div className="text-xs text-amber-800">
                File <b>{pendingAttachment.file_name}</b> akan otomatis
                tersimpan sebagai lampiran setelah kamu klik <b>Save</b> di
                bawah.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-bold text-slate-900">Tabs</div>
            <div className="text-sm text-slate-500 mt-1">
              Satu product punya banyak tab. Tiap tab berisi accordion.
            </div>
          </div>
          <button type="button" className="btn-primary" onClick={addTab}>
            + Add Tab
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map((t, i) => {
            const active = i === activeTab;
            return (
              <div
                key={i}
                className={[
                  "rounded-2xl border px-3 py-2 flex items-center gap-2",
                  active
                    ? "bg-bjb-navy text-white border-bjb-navy"
                    : "bg-white border-slate-200",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(i);
                    setOpenIdx(0);
                  }}
                  className="text-sm font-semibold"
                >
                  {t.title || `Tab ${i + 1}`}
                </button>
                <input
                  className={[
                    "ml-2 rounded-xl px-2 py-1 text-xs",
                    active
                      ? "text-slate-900"
                      : "bg-slate-50 border border-slate-200",
                  ].join(" ")}
                  value={t.title}
                  onChange={(e) => renameTab(i, e.target.value)}
                  placeholder="Nama tab"
                />
                {tabs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTab(i)}
                    className={[
                      "h-7 w-7 rounded-lg flex items-center justify-center",
                      active ? "bg-white/15" : "bg-red-50",
                    ].join(" ")}
                  >
                    <X
                      size={14}
                      className={active ? "text-white" : "text-red-700"}
                    />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Accordions */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-slate-900">
              Accordion Sections — {tabs[activeTab]?.title || "Tab"}
            </div>
            <div className="text-sm text-slate-500 mt-1">
              Konten ada di accordion (TipTap full).
            </div>
          </div>
          <button type="button" className="btn-primary" onClick={addAccordion}>
            + Add Section
          </button>
        </div>
        <div className="mt-5 space-y-4">
          {(tabs[activeTab]?.accordions || []).map((a, idx) => (
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

      {/* Lampiran — hanya tampil di mode edit (produk sudah punya id) */}
      {mode === "edit" && id && (
        <AttachmentsPanel productId={id} toast={toast} />
      )}

      {/* Sticky save bar */}
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
