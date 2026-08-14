import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "../../icons";
import { FlatCategory } from "../../utils/categoryUtils";

interface Props {
  categories: FlatCategory[];
  value: number;
  onChange: (id: number) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Dropdown kategori yang bisa di-search sambil tetap menampilkan
 * struktur tree (indentasi per level). Item yang tidak cocok dengan
 * pencarian tetap terlihat (di-fade), bukan disembunyikan — supaya
 * konteks hierarkinya tidak hilang.
 */
export default function CategoryTreeSelect({
  categories,
  value,
  onChange,
  placeholder = "Cari atau pilih kategori...",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  const selectedName =
    value === 0
      ? "Semua Kategori"
      : categories.find((c) => c.id === value)?.name || "Semua Kategori";

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const q = query.trim().toLowerCase();
  const hasAnyMatch =
    !q || categories.some((c) => c.name.toLowerCase().includes(q));
  const firstMatchId = q
    ? categories.find((c) => c.name.toLowerCase().includes(q))?.id
    : undefined;

  // Auto-scroll ke match pertama begitu user mengetik, supaya tidak perlu
  // scroll manual walau item cocok posisinya jauh di bawah daftar.
  useEffect(() => {
    if (!open || !q) return;

    const firstMatch = categories.find((c) => c.name.toLowerCase().includes(q));
    if (!firstMatch) return;

    const el = itemRefs.current[firstMatch.id];
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [q, open, categories]);

  // Reset scroll ke atas setiap kali dropdown dibuka ulang
  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  }, [open]);

  function handleSelect(id: number) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={boxRef} className={className || "relative w-full sm:w-64"}>
      <div className="relative">
        <input
          type="text"
          value={open ? query : selectedName}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-4 pr-10 py-2 border border-stroke rounded-lg outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 cursor-text transition"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <ChevronDownIcon
            className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </div>

      {open && (
        <div
          ref={panelRef}
          className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark"
        >
          <button
            type="button"
            onClick={() => handleSelect(0)}
            className={`block w-full px-4 py-2 text-left text-sm font-semibold transition hover:bg-gray-50 dark:hover:bg-meta-4 ${
              value === 0 ? "text-primary" : "text-black dark:text-white"
            }`}
          >
            Semua Kategori
          </button>

          <div className="border-t border-stroke dark:border-strokedark" />

          {categories.map((cat) => {
            const isMatch = !q || cat.name.toLowerCase().includes(q);
            const isSelected = value === cat.id;
            const isFirstMatch = q && cat.id === firstMatchId;

            return (
              <button
                key={cat.id}
                ref={(el) => {
                  itemRefs.current[cat.id] = el;
                }}
                type="button"
                onClick={() => handleSelect(cat.id)}
                disabled={!isMatch}
                style={{ paddingLeft: `${16 + cat.depth * 16}px` }}
                className={`block w-full py-2 pr-4 text-left text-sm transition ${
                  isMatch
                    ? "cursor-pointer text-black hover:bg-gray-50 dark:text-white dark:hover:bg-meta-4"
                    : "cursor-default text-gray-300 dark:text-gray-600"
                } ${
                  isSelected
                    ? "bg-brand-50 font-semibold text-primary dark:bg-brand-500/10"
                    : ""
                } ${
                  isFirstMatch && !isSelected
                    ? "ring-1 ring-inset ring-brand-300 bg-brand-50/40 dark:ring-brand-500/40 dark:bg-brand-500/5"
                    : ""
                }`}
              >
                {cat.name}
              </button>
            );
          })}

          {!hasAnyMatch && (
            <div className="px-4 py-3 text-center text-xs text-gray-400">
              Tidak ada kategori yang cocok dengan "{query}".
            </div>
          )}
        </div>
      )}
    </div>
  );
}
