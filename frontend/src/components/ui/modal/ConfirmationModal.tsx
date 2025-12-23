import React, { useEffect, useRef } from "react";
import Button from "../button/Button"; 
import { TrashBinIcon } from "../../../icons"; 

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        ref={modalRef}
        className="w-full max-w-md bg-white dark:bg-boxdark rounded-lg shadow-2xl border border-stroke dark:border-strokedark p-6 relative animate-in zoom-in-95 duration-200"
      >
        
        {/* Icon & Title */}
        <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-500">
                <TrashBinIcon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-black dark:text-white">
                {title}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                {message}
            </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-center">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
            className="w-full justify-center border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-strokedark dark:text-gray-300 dark:hover:bg-meta-4"
          >
            Batal
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full justify-center bg-red-600 hover:bg-red-700 text-white border-red-600"
          >
            {isLoading ? "Menghapus..." : "Ya, Hapus"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;