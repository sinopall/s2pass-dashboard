import Button from "../../../components/ui/button/Button";
import { CloseIcon, TrashBinIcon } from "../../../icons";

interface Props {
  isOpen: boolean;
  title?: string;
  description?: string;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal({
  isOpen,
  title = "Hapus Kategori",
  description = "Yakin ingin menghapus kategori ini?",
  isLoading = false,
  onClose,
  onConfirm,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-boxdark animate-in fade-in zoom-in duration-200">
        <div className="mb-4 flex items-center justify-between border-b border-stroke pb-4 dark:border-strokedark">
          <h3 className="text-lg font-semibold text-black dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">
            <CloseIcon className="h-6 w-6 fill-current" />
          </button>
        </div>

        <div className="flex gap-3">
          <div className="mt-0.5 text-red-500">
            <TrashBinIcon className="w-5 h-5" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? "Menghapus..." : "Hapus"}
          </Button>
        </div>
      </div>
    </div>
  );
}
