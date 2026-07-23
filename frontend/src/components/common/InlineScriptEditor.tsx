import React, { useState } from "react";
// Asumsi Anda menggunakan react-icons (karena saya melihatnya di dependencies Anda)
import { FiEdit2, FiSave, FiX } from "react-icons/fi";
import { CardSection } from "./CardSection";

interface InlineScriptEditorProps {
  title?: string;
  initialContent: string;
  // onSave mengembalikan Promise agar komponen tahu kapan loading selesai
  onSave: (newContent: string) => Promise<void>;
  children?: React.ReactNode;
}

export const InlineScriptEditor: React.FC<InlineScriptEditorProps> = ({
  title = "Script Pembuka",
  initialContent,
  onSave,
  children,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onSave(content); // Panggil fungsi API dari parent
      setIsEditing(false); // Tutup mode edit jika sukses
    } catch (error) {
      console.error("Gagal menyimpan script:", error);
      // Di sini Anda bisa trigger komponen Alert/Toast error
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setContent(initialContent); // Kembalikan ke teks awal
    setIsEditing(false);
  };

  return (
    <CardSection>
      {/* Header Panel */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          {title}
        </h3>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
          >
            <FiEdit2 /> Edit Script
          </button>
        )}
      </div>

      {/* Content Panel */}
      {isEditing ? (
        <div className="space-y-4">
          {/* NOTE UNTUK ANDA: 
              Jika Anda sudah punya komponen Rich Text Editor (seperti Quill/TipTap), 
              ganti tag <textarea> ini dengan komponen tersebut. 
              Pastikan me-passing props `value={content}` dan `onChange={(val) => setContent(val)}` 
          */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="w-full rounded-lg border border-gray-300 p-4 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            placeholder="Tulis script di sini..."
          />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <FiX /> Batal
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="animate-pulse">Menyimpan...</span>
              ) : (
                <>
                  <FiSave /> Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="prose prose-blue dark:prose-invert max-w-none rounded-lg bg-gray-50 p-4 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
          {/* Jika content berupa HTML dari Rich Text Editor, gunakan dangerouslySetInnerHTML */}
          {/* <div dangerouslySetInnerHTML={{ __html: content }} /> */}
          <p className="whitespace-pre-wrap">
            {content || "Belum ada script yang diatur."}
          </p>
        </div>
      )}
      {children}
    </CardSection>
  );
};
