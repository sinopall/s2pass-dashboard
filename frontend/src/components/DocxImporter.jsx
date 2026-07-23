import { useRef, useState } from "react";
import { FileText, Upload, X, ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { api } from "../lib/api";

// ==================== PREVIEW ACCORDION ====================

function PreviewAccordion({ acc, open, onToggle }) {
  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 p-3 bg-slate-50 text-left"
      >
        <span className="text-sm font-semibold text-slate-800 truncate">{acc.title}</span>
        {open ? <ChevronDown size={16} className="shrink-0 text-slate-500" /> : <ChevronRight size={16} className="shrink-0 text-slate-500" />}
      </button>
      {open && (
        <div
          className="p-3 text-xs text-slate-600 prose max-w-none prose-sm border-t border-slate-100"
          dangerouslySetInnerHTML={{ __html: acc.body_html }}
        />
      )}
    </div>
  );
}

// ==================== PREVIEW PANEL ====================

function ImportPreview({ result, onClose, onApply }) {
  const [openTab, setOpenTab] = useState(0);
  const [openAcc, setOpenAcc] = useState(0);

  const strategyLabel = {
    h1_title_h2_tabs: "H1 = judul produk, H2 = tab, H3 = accordion",
    h2_accordions: "H2 = accordion (1 tab Default)",
    h1_accordions: "H1 = accordion",
    flat: "Flat (tidak ada heading)",
  }[result.strategy] || result.strategy;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-bjb-navy to-slate-900 text-white shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-bold">Preview Import Dokumen</div>
              <div className="mt-1 text-xs text-white/70">
                Strategi parsing: <span className="text-bjb-gold font-semibold">{strategyLabel}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Info */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 w-28 shrink-0">Judul terdeteksi</span>
              <span className="font-bold text-slate-900">{result.title || "-"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 w-28 shrink-0">Slug disarankan</span>
              <code className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700">{result.suggested_slug || "-"}</code>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 w-28 shrink-0">Jumlah tab</span>
              <span className="font-semibold text-slate-800">{result.tabs.length} tab</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">{result.tabs.reduce((s, t) => s + t.accordions.length, 0)} accordion</span>
            </div>
          </div>

          {/* Tab navigation */}
          {result.tabs.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {result.tabs.map((t, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setOpenTab(i); setOpenAcc(0); }}
                  className={[
                    "rounded-2xl px-4 py-2 text-sm font-semibold border",
                    openTab === i
                      ? "bg-bjb-navy text-white border-bjb-navy"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {t.title}
                </button>
              ))}
            </div>
          )}

          {/* Accordion list */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {result.tabs.length === 1 ? result.tabs[0].title : result.tabs[openTab]?.title}
            </div>
            {(result.tabs[openTab]?.accordions || []).map((a, i) => (
              <PreviewAccordion
                key={i}
                acc={a}
                open={openAcc === i}
                onToggle={() => setOpenAcc(openAcc === i ? -1 : i)}
              />
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Kamu bisa edit konten setelah di-apply ke editor.
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => onApply(result)}
              className="rounded-2xl px-5 py-2 text-sm font-semibold text-white bg-bjb-navy hover:opacity-95"
            >
              Apply ke Editor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

/**
 * DocxImporter
 * Props:
 *   onApply(result) — dipanggil saat user klik "Apply ke Editor"
 *                     result: { title, suggested_slug, tabs: [{title, accordions:[{title,body_html}]}] }
 */
export function DocxImporter({ onApply }) {
  const inputRef = useRef(null);
  const [state, setState] = useState("idle"); // idle | uploading | preview | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".docx")) {
      setError("Hanya file .docx yang didukung.");
      setState("error");
      return;
    }

    setState("uploading");
    setError("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/docx/import", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
      setState("preview");
    } catch (e) {
      setError(e?.response?.data?.error ?? "Gagal memproses file. Pastikan file adalah .docx yang valid.");
      setState("error");
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleClose() {
    setState("idle");
    setResult(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleApply(r) {
    onApply(r);
    handleClose();
  }

  return (
    <>
      {/* Drop zone / upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={[
          "rounded-3xl border-2 border-dashed transition-all p-6",
          isDragging
            ? "border-bjb-navy bg-bjb-navy/5 scale-[1.01]"
            : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".docx"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {state === "idle" && (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
              <FileText size={28} className="text-bjb-navy" />
            </div>
            <div>
              <div className="font-bold text-slate-900">Import dari Word (.docx)</div>
              <div className="mt-1 text-sm text-slate-500">
                Upload dokumen Word — heading akan otomatis jadi tab & accordion
              </div>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-1 rounded-2xl bg-bjb-navy px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95 inline-flex items-center gap-2"
            >
              <Upload size={16} /> Pilih File .docx
            </button>
            <div className="text-xs text-slate-400">
              atau drag & drop file ke sini
            </div>
          </div>
        )}

        {state === "uploading" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 size={32} className="text-bjb-navy animate-spin" />
            <div className="text-sm font-semibold text-slate-700">Memproses dokumen...</div>
            <div className="text-xs text-slate-400">Menganalisis struktur heading & konten</div>
          </div>
        )}

        {state === "error" && (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="h-12 w-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
              <AlertCircle size={24} className="text-red-500" />
            </div>
            <div className="text-sm font-semibold text-red-700">{error}</div>
            <button
              type="button"
              onClick={() => { setState("idle"); setError(""); if (inputRef.current) inputRef.current.value = ""; }}
              className="rounded-2xl bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {state === "preview" && result && (
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 size={24} className="text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-900 truncate">{result.title || "Dokumen berhasil diproses"}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {result.tabs.length} tab · {result.tabs.reduce((s, t) => s + t.accordions.length, 0)} accordion · klik preview untuk lihat detail
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setState("preview_open")}
                className="rounded-2xl bg-white border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => handleApply(result)}
                className="rounded-2xl bg-bjb-navy px-3 py-2 text-xs font-semibold text-white hover:opacity-95"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="h-9 w-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center hover:bg-red-100"
              >
                <X size={14} className="text-red-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Full preview modal */}
      {(state === "preview_open" || state === "preview") && result && state !== "preview" && (
        <ImportPreview
          result={result}
          onClose={() => setState("preview")}
          onApply={handleApply}
        />
      )}
      {state === "preview_open" && result && (
        <ImportPreview
          result={result}
          onClose={() => setState("preview")}
          onApply={handleApply}
        />
      )}
    </>
  );
}
