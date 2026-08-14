import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "../../icons";

interface Option {
  value: number | string;
  label: string;
}

interface Props {
  options: Option[];
  value: number | string | undefined;
  onChange: (value: number | string | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Cari...",
  className,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const selectedName =
    value === undefined || value === ""
      ? ""
      : options.find((o) => o.value === value)?.label || "";

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
    !q || options.some((o) => o.label.toLowerCase().includes(q));
  const firstMatchValue = q
    ? options.find((o) => o.label.toLowerCase().includes(q))?.value
    : undefined;

  useEffect(() => {
    if (!open || !q) return;

    const firstMatch = options.find((o) => o.label.toLowerCase().includes(q));
    if (!firstMatch) return;

    const el = itemRefs.current[String(firstMatch.value)];
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [q, open, options]);

  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  }, [open]);

  function handleSelect(val: number | string | undefined) {
    onChange(val);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={boxRef} className={className || "relative w-full"}>
      <div className="relative">
        <input
          type="text"
          value={open ? query : selectedName}
          onFocus={() => {
            if (!disabled) {
              setOpen(true);
              setQuery("");
            }
          }}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-4 pr-10 py-2 border border-stroke rounded-lg outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 transition ${
            disabled ? "bg-gray-100 cursor-not-allowed text-gray-500" : "cursor-text"
          }`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <ChevronDownIcon
            className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </div>

      {open && !disabled && (
        <div
          ref={panelRef}
          className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark"
        >
          <button
            type="button"
            onClick={() => handleSelect(undefined)}
            className={`block w-full px-4 py-2 text-left text-sm font-semibold transition hover:bg-gray-50 dark:hover:bg-meta-4 ${
              value === undefined || value === ""
                ? "text-primary"
                : "text-black dark:text-white"
            }`}
          >
            -- Tidak Terkait Produk --
          </button>

          <div className="border-t border-stroke dark:border-strokedark" />

          {options.map((opt) => {
            const isMatch = !q || opt.label.toLowerCase().includes(q);
            const isSelected = value === opt.value;
            const isFirstMatch = q && opt.value === firstMatchValue;

            if (!isMatch) return null;

            return (
              <button
                key={String(opt.value)}
                ref={(el) => {
                  itemRefs.current[String(opt.value)] = el;
                }}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`block w-full px-4 py-2 text-left text-sm transition cursor-pointer text-black hover:bg-gray-50 dark:text-white dark:hover:bg-meta-4 ${
                  isSelected
                    ? "bg-brand-50 font-semibold text-primary dark:bg-brand-500/10"
                    : ""
                } ${
                  isFirstMatch && !isSelected
                    ? "ring-1 ring-inset ring-brand-300 bg-brand-50/40 dark:ring-brand-500/40 dark:bg-brand-500/5"
                    : ""
                }`}
              >
                {opt.label}
              </button>
            );
          })}

          {!hasAnyMatch && (
            <div className="px-4 py-3 text-center text-xs text-gray-400">
              Tidak ada opsi yang cocok dengan "{query}".
            </div>
          )}
        </div>
      )}
    </div>
  );
}
