import { useEffect, useState, useMemo } from "react";
import axios from "../../../api/axios";
import API from "../../../api/api";
import { Category } from "./types";
import {
  CloseIcon,
  PlusIcon,
  TrashBinIcon,
  ChevronDownIcon,
  FolderIcon,
} from "../../../icons";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";

// --- TYPES ---
interface ExistingLevel {
  depth: number;
  options: Category[];
  selectedId: string;
  selectedName: string;
  isLoading: boolean;
  isLocked: boolean;
}

interface NewCategoryItem {
  id: number;
  name: string;
}

type ModalMode = "create" | "edit";

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;

  // CREATE (existing)
  onSubmit: (fullPath: string[]) => void;

  // EDIT (new)
  onSubmitRename?: (id: number, newName: string) => void;
  mode?: ModalMode;

  parentData: Category | null;
  initialRootType?: string;
  ancestors?: Category[];
}

export default function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  onSubmitRename,
  mode = "create",
  parentData,
  initialRootType = "Informasi",
  ancestors = [],
}: CategoryFormModalProps) {
  // --- STATE ---
  const [rootType, setRootType] = useState(initialRootType);
  const [existingLevels, setExistingLevels] = useState<ExistingLevel[]>([]);
  const [newCategoryChain, setNewCategoryChain] = useState<NewCategoryItem[]>([
    { id: Date.now(), name: "" },
  ]);

  // --- API FETCH HELPER ---
  const fetchChildren = async (parentId: number) => {
    try {
      const response = await axios.get(
        `${API.categories.children}?parentId=${parentId}`
      );
      if (!response.data || response.data.length === 0) return [];
      return response.data;
    } catch (error) {
      return [];
    }
  };

  // helper rootId
  const getRootId = (rootName: string) => {
    if (rootName === "Informasi") return 1;
    if (rootName === "Request") return 2;
    if (rootName === "Complaint") return 3;
    return 1;
  };

  // --- HELPER: INITIALIZE FORM ---
  const initializeForm = async () => {
    setExistingLevels([]);

    // SET chain
    if (mode === "edit" && parentData) {
      setNewCategoryChain([{ id: Date.now(), name: parentData.name }]);
    } else {
      setNewCategoryChain([{ id: Date.now(), name: "" }]);
    }

    const currentRoot = parentData ? initialRootType : "Informasi";
    setRootType(currentRoot);

    const rootId = getRootId(currentRoot);

    const level1Children = await fetchChildren(rootId);

    if (parentData) {
      const rawPath = [...ancestors, parentData];
      const pathForDropdowns = rawPath.filter((node) => node.id !== rootId);

      const newExistingLevels: ExistingLevel[] = [];

      for (let i = 0; i < pathForDropdowns.length; i++) {
        const currentNode = pathForDropdowns[i];
        const parentIdOfCurrentNode = i === 0 ? rootId : pathForDropdowns[i - 1].id;
        const options = await fetchChildren(parentIdOfCurrentNode);

        newExistingLevels.push({
          depth: i + 1,
          options,
          selectedId: String(currentNode.id),
          selectedName: currentNode.name,
          isLoading: false,
          isLocked: true,
        });
      }

      // create mode: dropdown kosong untuk anak dari parentData
      if (mode === "create") {
        const nextChildren = await fetchChildren(parentData.id);
        newExistingLevels.push({
          depth: pathForDropdowns.length + 1,
          options: nextChildren,
          selectedId: "",
          selectedName: "",
          isLoading: false,
          isLocked: false,
        });
      }

      setExistingLevels(newExistingLevels);
    } else {
      if (level1Children.length > 0) {
        setExistingLevels([
          {
            depth: 1,
            options: level1Children,
            selectedId: "",
            selectedName: "",
            isLoading: false,
            isLocked: false,
          },
        ]);
      }
    }
  };

  // --- EFFECT: INIT ---
  useEffect(() => {
    if (isOpen) initializeForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, parentData, initialRootType, mode]);

  // --- HANDLERS ---
  const handleRootChange = async (newRoot: string) => {
    if (mode === "edit") return;
    setRootType(newRoot);
    setExistingLevels([]);

    const rootId = getRootId(newRoot);
    const children = await fetchChildren(rootId);

    if (children.length > 0) {
      setExistingLevels([
        {
          depth: 1,
          options: children,
          selectedId: "",
          selectedName: "",
          isLoading: false,
          isLocked: false,
        },
      ]);
    }
  };

  const handleLevelChange = async (index: number, value: string) => {
    if (mode === "edit") return;

    const updatedLevels = [...existingLevels];
    const currentLevel = updatedLevels[index];
    currentLevel.selectedId = value;

    const selectedOption = currentLevel.options.find((o) => String(o.id) === value);
    currentLevel.selectedName = selectedOption ? selectedOption.name : "";

    if (index < updatedLevels.length - 1) {
      updatedLevels.splice(index + 1);
    }

    setExistingLevels(updatedLevels);

    if (value) {
      const parentId = parseInt(value);
      const children = await fetchChildren(parentId);

      if (children.length > 0) {
        setExistingLevels((prev) => [
          ...prev,
          {
            depth: prev.length + 1,
            options: children,
            selectedId: "",
            selectedName: "",
            isLoading: false,
            isLocked: false,
          },
        ]);
      }
    }
  };

  const handleAddNewInput = () => {
    if (mode === "edit") return;

    const lastInput = newCategoryChain[newCategoryChain.length - 1];
    if (lastInput.name.trim()) {
      setNewCategoryChain([...newCategoryChain, { id: Date.now(), name: "" }]);
    }
  };

  const handleNewInputChange = (index: number, val: string) => {
    const updated = [...newCategoryChain];
    updated[index].name = val;
    setNewCategoryChain(updated);
  };

  const handleRemoveNewInput = (index: number) => {
    if (mode === "edit") return;

    if (newCategoryChain.length === 1) {
      setNewCategoryChain([{ id: Date.now(), name: "" }]);
      return;
    }
    const updated = [...newCategoryChain];
    updated.splice(index, 1);
    setNewCategoryChain(updated);
  };

  // --- PREVIEW PATH ---
  // --- PREVIEW PATH ---
  const previewPath = useMemo(() => {
    const parts: { name: string; type: "root" | "existing" | "new" }[] = [];
    parts.push({ name: rootType, type: "root" });

    // Ambil nama input (rename / new chain)
    const newName = (newCategoryChain[0]?.name || "").trim();

    // MODE EDIT: jangan tampilkan node terakhir dari existingLevels (itu node lama yg diedit),
    // karena akan digantikan oleh input newName
    if (mode === "edit" && parentData) {
      existingLevels.forEach((lvl, idx) => {
        const isLast = idx === existingLevels.length - 1;
        if (lvl.selectedName && lvl.selectedId && !isLast) {
          parts.push({ name: lvl.selectedName, type: "existing" });
        }
      });

      if (newName) parts.push({ name: newName, type: "new" });
      return parts;
    }

    // MODE CREATE: normal seperti sebelumnya
    existingLevels.forEach((lvl) => {
      if (lvl.selectedName && lvl.selectedId) {
        parts.push({ name: lvl.selectedName, type: "existing" });
      }
    });

    newCategoryChain.forEach((newItem) => {
      if (newItem.name.trim()) {
        parts.push({ name: newItem.name.trim(), type: "new" });
      }
    });

    return parts;
  }, [rootType, existingLevels, newCategoryChain, mode, parentData]);


  // --- SUBMIT ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // EDIT
    if (mode === "edit") {
      if (!parentData) return;

      const newName = (newCategoryChain[0]?.name || "").trim();
      if (!newName) {
        alert("Mohon isi nama kategori.");
        return;
      }

      if (!onSubmitRename) {
        alert("Handler rename belum tersedia.");
        return;
      }

      onSubmitRename(parentData.id, newName);
      return;
    }

    // CREATE (existing behavior)
    const validNames = newCategoryChain.map((c) => c.name.trim()).filter((n) => n !== "");
    if (validNames.length === 0) {
      alert("Mohon isi nama kategori baru.");
      return;
    }

    const payloadPath = previewPath.map((item) => item.name);
    onSubmit(payloadPath);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg dark:bg-boxdark animate-in fade-in zoom-in duration-200 max-h-[95vh] overflow-y-auto">
        {/* HEADER */}
        <div className="mb-4 flex items-center justify-between border-b border-stroke pb-4 dark:border-strokedark">
          <h3 className="text-xl font-semibold text-black dark:text-white">
            {mode === "edit"
              ? "Edit Kategori"
              : parentData
              ? "Tambah Sub-Kategori"
              : "Tambah Kategori Baru"}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">
            <CloseIcon className="h-6 w-6 fill-current" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* --- BAGIAN 1: LOKASI INDUK --- */}
          <div className="mb-6 space-y-3">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 dark:bg-meta-4 dark:border-strokedark">
              <Label className="mb-2 text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                <FolderIcon className="w-4 h-4" /> Kategori Utama
              </Label>

              {/* ROOT DROPDOWN */}
              <select
                value={rootType}
                onChange={(e) => handleRootChange(e.target.value)}
                disabled={!!parentData || mode === "edit"}
                className={`w-full mb-3 rounded bg-white py-2 px-3 text-sm outline-none border border-stroke focus:border-primary dark:bg-boxdark dark:border-strokedark font-medium ${
                  parentData || mode === "edit" ? "bg-gray-100 opacity-80 cursor-not-allowed" : ""
                }`}
              >
                <option value="Informasi">Informasi</option>
                <option value="Request">Request</option>
                <option value="Complaint">Complaint</option>
              </select>

              {/* CASCADING LEVELS */}
              <div className="space-y-2 relative pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                {existingLevels.map((lvl, idx) => (
                  <div key={idx} className="animate-in slide-in-from-top-2 duration-300">
                    <Label className="text-[10px] text-gray-400 mb-0.5">
                      Sub-Kategori Level {lvl.depth}
                    </Label>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-px bg-gray-300 dark:bg-gray-500 -ml-4"></div>
                      <select
                        value={lvl.selectedId}
                        onChange={(e) => handleLevelChange(idx, e.target.value)}
                        disabled={lvl.isLocked || mode === "edit"}
                        className={`w-full rounded bg-white py-2 px-3 text-sm outline-none border border-stroke focus:border-primary dark:bg-boxdark dark:border-strokedark ${
                          lvl.isLocked || mode === "edit"
                            ? "bg-blue-50 border-blue-200 text-blue-800 font-bold opacity-100 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <option value="">-- Pilih (Opsional) --</option>
                        {lvl.options.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-center -mt-9 mb-3 relative z-10">
            <div className="bg-primary text-white p-1.5 rounded-full shadow-md">
              <ChevronDownIcon className="w-4 h-4" />
            </div>
          </div>

          {/* --- BAGIAN 2 --- */}
          <div className="mb-6">
            <Label className="mb-3 block font-semibold text-black dark:text-white">
              {mode === "edit" ? "Ubah Nama Kategori" : "Rangkaian Kategori Baru"}
            </Label>

            <div className="space-y-3 pl-2">
              {newCategoryChain.map((item, index) => (
                <div
                  key={item.id}
                  className="relative flex items-center gap-3 animate-in fade-in slide-in-from-left-2"
                >
                  <div className="flex flex-col items-center justify-center w-6 shrink-0">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        index === 0 ? "bg-primary" : "bg-primary/70"
                      }`}
                    >
                      {index + 1}
                    </div>
                    {index < newCategoryChain.length - 1 && (
                      <div className="w-0.5 h-10 bg-gray-200 dark:bg-gray-700 -mb-6 mt-1"></div>
                    )}
                  </div>

                  <div className="grow">
                    <Input
                      placeholder={
                        mode === "edit"
                          ? "Nama kategori"
                          : `Nama Kategori ${index === 0 ? "(Child Baru)" : "(Sub-Child)"}`
                      }
                      value={item.name}
                      onChange={(e: any) => handleNewInputChange(index, e.target.value)}
                      className="focus:border-primary"
                      autoFocus={index === 0}
                    />
                  </div>

                  {mode === "create" && (
                    <button
                      type="button"
                      onClick={() => handleRemoveNewInput(index)}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <TrashBinIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {mode === "create" && (
              <button
                type="button"
                onClick={handleAddNewInput}
                className="mt-4 ml-11 flex items-center gap-2 text-sm font-medium text-primary hover:text-blue-700"
              >
                <PlusIcon className="w-4 h-4" />
                Tambah Sub-Level Berikutnya
              </button>
            )}
          </div>

          {/* --- BAGIAN 3: PREVIEW PATH --- */}
          <div className="mb-6 p-3 bg-gray-100 dark:bg-boxdark-2 rounded border border-gray-200 dark:border-strokedark">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Preview Path Hasil Akhir
            </span>
            <div className="flex flex-wrap items-center gap-1.5 text-sm leading-relaxed">
              {previewPath.map((part, idx) => (
                <div key={idx} className="flex items-center">
                  {idx > 0 && (
                    <ChevronDownIcon className="w-3 h-3 text-gray-400 -rotate-90 mx-1" />
                  )}
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium border ${
                      part.type === "root"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : part.type === "existing"
                        ? "bg-gray-200 text-gray-700 border-gray-300"
                        : "bg-green-50 text-green-700 border-green-200 shadow-sm"
                    }`}
                  >
                    {part.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-3 pt-4 border-t border-stroke dark:border-strokedark">
            <Button
              variant="outline"
              onClick={(e?: React.MouseEvent) => {
                e?.preventDefault();
                onClose();
              }}
            >
              Batal
            </Button>
            <Button>{mode === "edit" ? "Simpan Perubahan" : "Simpan"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
