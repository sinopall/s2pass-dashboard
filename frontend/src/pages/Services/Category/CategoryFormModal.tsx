import { useEffect, useState, useMemo } from "react";
import axios from "../../../api/axios";
import API from "../../../api/api";
import { Category } from "./types";
import { CloseIcon, PlusIcon, TrashBinIcon, ChevronDownIcon, FolderIcon } from "../../../icons"; 
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
  isLocked: boolean; // Menandakan apakah level ini dikunci (karena parentData)
}

interface NewCategoryItem {
  id: number;
  name: string;
}

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fullPath: string[]) => void;
  parentData: Category | null;
  initialRootType?: string; 
  ancestors?: Category[];
}

export default function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  parentData,
  initialRootType = "Informasi",
  ancestors = [],
}: CategoryFormModalProps) {
  
  // --- STATE ---
  const [rootType, setRootType] = useState(initialRootType);
  
  // State 1: Cascading Dropdowns
  const [existingLevels, setExistingLevels] = useState<ExistingLevel[]>([]);

  // State 2: Chain Builder (Data Baru)
  const [newCategoryChain, setNewCategoryChain] = useState<NewCategoryItem[]>([
    { id: Date.now(), name: "" }
  ]);

  // --- API FETCH HELPER ---
  const fetchChildren = async (parentId: number) => {
    try {
      const response = await axios.get(`${API.categories.children}?parentId=${parentId}`);
      if (!response.data || response.data.length === 0) return [];
      return response.data;
    } catch (error) {
      return [];
    }
  };

  // --- HELPER: INITIALIZE FORM ---
  const initializeForm = async () => {
    // 1. Reset State
    setExistingLevels([]);
    setNewCategoryChain([{ id: Date.now(), name: "" }]);
    
    // Tentukan Root Type & ID
    const currentRoot = parentData ? initialRootType : "Informasi"; 
    setRootType(currentRoot);

    let rootId = 0;
    if (currentRoot === "Informasi") rootId = 1;
    else if (currentRoot === "Request") rootId = 2;
    else if (currentRoot === "Complaint") rootId = 3;

    // 2. Fetch Level 1 (Anak Langsung dari Root)
    // Ini digunakan untuk opsi dropdown pertama
    const level1Children = await fetchChildren(rootId);
    
    // --- LOGIKA UTAMA PERBAIKAN ---
    if (parentData) {
        // Gabungkan Ancestors + ParentData
        const rawPath = [...ancestors, parentData];
        
        // FILTER PENTING: Hapus Root Node dari path
        // Karena Root sudah dihandle oleh dropdown "Lokasi Induk" paling atas.
        // Kita hanya butuh path mulai dari Level 1 (misal: Kredit, KGB, dst)
        const pathForDropdowns = rawPath.filter(node => node.id !== rootId);

        const newExistingLevels: ExistingLevel[] = [];

        // Loop path yang sudah bersih (tanpa root)
        for (let i = 0; i < pathForDropdowns.length; i++) {
            const currentNode = pathForDropdowns[i];
            
            // Tentukan Parent ID untuk node ini
            // Jika i=0 (Node pertama di list ini, misal Kredit), maka parent-nya pasti Root ID
            // Jika i>0 (Misal KGB), parent-nya adalah node sebelumnya
            const parentIdOfCurrentNode = (i === 0) ? rootId : pathForDropdowns[i-1].id;

            // Fetch opsi teman-teman selevel (siblings)
            const options = await fetchChildren(parentIdOfCurrentNode);

            newExistingLevels.push({
                depth: i + 1, // Depth visual mulai dari 1
                options: options,
                selectedId: String(currentNode.id),
                selectedName: currentNode.name,
                isLoading: false,
                isLocked: true // Kunci karena ini adalah history path
            });
        }

        // TERAKHIR: Tambahkan dropdown kosong di bawahnya (Anak dari node yang diklik)
        // Parent dari dropdown baru ini adalah parentData yang diklik user
        const nextChildren = await fetchChildren(parentData.id);

        newExistingLevels.push({
            depth: pathForDropdowns.length + 1,
            options: nextChildren, 
            selectedId: "",
            selectedName: "",
            isLoading: false,
            isLocked: false
        });

        setExistingLevels(newExistingLevels);

    } else {
        if (level1Children.length > 0) {
            setExistingLevels([{
                depth: 1,
                options: level1Children,
                selectedId: "",
                selectedName: "",
                isLoading: false,
                isLocked: false
            }]);
        }
    }
  };

  // --- EFFECT: INIT ---
  useEffect(() => {
    if (isOpen) {
        initializeForm();
    }
  }, [isOpen, parentData, initialRootType]);

  // --- HANDLERS ---

  const handleRootChange = async (newRoot: string) => {
    setRootType(newRoot);
    setExistingLevels([]); 

    let rootId = 0;
    if (newRoot === "Informasi") rootId = 1;
    else if (newRoot === "Request") rootId = 2;
    else if (newRoot === "Complaint") rootId = 3;

    const children = await fetchChildren(rootId);
    if (children.length > 0) {
        setExistingLevels([{
            depth: 1,
            options: children,
            selectedId: "",
            selectedName: "",
            isLoading: false,
            isLocked: false
        }]);
    }
  };

  const handleLevelChange = async (index: number, value: string) => {
    const updatedLevels = [...existingLevels];
    const currentLevel = updatedLevels[index];
    currentLevel.selectedId = value;
    
    const selectedOption = currentLevel.options.find(o => String(o.id) === value);
    currentLevel.selectedName = selectedOption ? selectedOption.name : "";

    // Hapus level di bawahnya jika berubah
    if (index < updatedLevels.length - 1) {
        updatedLevels.splice(index + 1);
    }

    setExistingLevels(updatedLevels);

    // Fetch anak berikutnya jika ada pilihan
    if (value) {
        const parentId = parseInt(value);
        const children = await fetchChildren(parentId);

        if (children.length > 0) {
            setExistingLevels(prev => [
                ...prev,
                {
                    depth: prev.length + 1,
                    options: children,
                    selectedId: "",
                    selectedName: "",
                    isLoading: false,
                    isLocked: false
                }
            ]);
        }
    }
  };

  const handleAddNewInput = () => {
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
    if (newCategoryChain.length === 1) {
        setNewCategoryChain([{ id: Date.now(), name: ""}]);
        return;
    }
    const updated = [...newCategoryChain];
    updated.splice(index, 1);
    setNewCategoryChain(updated);
  };

  // --- PREVIEW PATH ---
  const previewPath = useMemo(() => {
    const parts = [];
    parts.push({ name: rootType, type: 'root' });

    existingLevels.forEach(lvl => {
        // Hanya tampilkan jika ada nama DAN ID yang dipilih
        // Ini mencegah duplikasi jika parentData di-load tapi belum di-set selectedName-nya
        if (lvl.selectedName && lvl.selectedId) {
            parts.push({ name: lvl.selectedName, type: 'existing' });
        }
    });

    newCategoryChain.forEach(newItem => {
        if (newItem.name.trim()) {
            parts.push({ name: newItem.name, type: 'new' });
        }
    });

    return parts;
  }, [rootType, existingLevels, newCategoryChain]);

  // --- SUBMIT ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi input baru kosong
    const validNames = newCategoryChain.map(c => c.name.trim()).filter(n => n !== "");
    if (validNames.length === 0) {
        alert("Mohon isi nama kategori baru.");
        return;
    }

    // KONSTRUKSI PATH UNTUK API
    // Kita ambil langsung dari 'previewPath' yang sudah kita buat logic-nya
    // previewPath berisi object {name, type}, kita ambil name-nya saja.
    const payloadPath = previewPath.map(item => item.name);

    // payloadPath hasilnya akan seperti: ["Informasi", "kredit", "kredit jangka panjang"]
    
    onSubmit(payloadPath);
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg dark:bg-boxdark animate-in fade-in zoom-in duration-200 max-h-[95vh] overflow-y-auto">
        
        {/* HEADER */}
        <div className="mb-4 flex items-center justify-between border-b border-stroke pb-4 dark:border-strokedark">
          <h3 className="text-xl font-semibold text-black dark:text-white">
            {parentData ? `Tambah Sub-Kategori` : `Tambah Kategori Baru`}
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
                    <FolderIcon className="w-4 h-4"/> Kategori Utama
                </Label>
                
                {/* ROOT DROPDOWN */}
                <select
                    value={rootType}
                    onChange={(e) => handleRootChange(e.target.value)}
                    // Disable hanya jika parentData BUKAN Root (artinya kita sedang edit child spesifik)
                    // Atau disable selalu jika parentData ada (untuk keamanan UX agar tidak pindah root)
                    disabled={!!parentData} 
                    className={`w-full mb-3 rounded bg-white py-2 px-3 text-sm outline-none border border-stroke focus:border-primary dark:bg-boxdark dark:border-strokedark font-medium ${parentData ? 'bg-gray-100 opacity-80 cursor-not-allowed' : ''}`}
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
                                    // DISABLED jika property isLocked = true
                                    disabled={lvl.isLocked}
                                    className={`w-full rounded bg-white py-2 px-3 text-sm outline-none border border-stroke focus:border-primary dark:bg-boxdark dark:border-strokedark ${lvl.isLocked ? 'bg-blue-50 border-blue-200 text-blue-800 font-bold opacity-100 cursor-not-allowed' : ''}`}
                                >
                                    <option value="">-- Pilih (Opsional) --</option>
                                    {lvl.options.map((opt) => (
                                        <option key={opt.id} value={opt.id}>{opt.name}</option>
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

          {/* --- BAGIAN 2: KATEGORI BARU --- */}
          <div className="mb-6">
              <Label className="mb-3 block font-semibold text-black dark:text-white">
                 Rangkaian Kategori Baru
              </Label>
              
              <div className="space-y-3 pl-2">
                  {newCategoryChain.map((item, index) => (
                      <div key={item.id} className="relative flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                          <div className="flex flex-col items-center justify-center w-6 shrink-0">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${index === 0 ? 'bg-primary' : 'bg-primary/70'}`}>
                                  {index + 1}
                              </div>
                              {index < newCategoryChain.length - 1 && (
                                  <div className="w-0.5 h-10 bg-gray-200 dark:bg-gray-700 -mb-6 mt-1"></div>
                              )}
                          </div>
                          <div className="grow">
                              <Input
                                  placeholder={`Nama Kategori ${index === 0 ? '(Child Baru)' : '(Sub-Child)'}`}
                                  value={item.name}
                                  onChange={(e: any) => handleNewInputChange(index, e.target.value)}
                                  className="focus:border-primary"
                                  autoFocus={index === 0} 
                              />
                          </div>
                           <button type="button" onClick={() => handleRemoveNewInput(index)} className="p-2 text-gray-400 hover:text-red-500">
                                <TrashBinIcon className="w-5 h-5" />
                            </button>
                      </div>
                  ))}
              </div>
              <button type="button" onClick={handleAddNewInput} className="mt-4 ml-11 flex items-center gap-2 text-sm font-medium text-primary hover:text-blue-700">
                  <PlusIcon className="w-4 h-4" />
                  Tambah Sub-Level Berikutnya
              </button>
          </div>

          {/* --- BAGIAN 3: PREVIEW PATH --- */}
          <div className="mb-6 p-3 bg-gray-100 dark:bg-boxdark-2 rounded border border-gray-200 dark:border-strokedark">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Preview Path Hasil Akhir
             </span>
             <div className="flex flex-wrap items-center gap-1.5 text-sm leading-relaxed">
                {previewPath.map((part, idx) => (
                    <div key={idx} className="flex items-center">
                        {idx > 0 && <ChevronDownIcon className="w-3 h-3 text-gray-400 -rotate-90 mx-1" />}
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                            part.type === 'root' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            part.type === 'existing' ? 'bg-gray-200 text-gray-700 border-gray-300' :
                            'bg-green-50 text-green-700 border-green-200 shadow-sm'
                        }`}>
                            {part.name}
                        </span>
                    </div>
                ))}
             </div>
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-3 pt-4 border-t border-stroke dark:border-strokedark">
            <Button variant="outline" onClick={(e?: React.MouseEvent) => { e?.preventDefault(); onClose(); }}>
              Batal
            </Button>
            <Button>Simpan</Button>
          </div>
        </form>
      </div>
    </div>
  );
}