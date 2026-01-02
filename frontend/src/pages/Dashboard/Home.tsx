import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router"; // tetap sesuai punyamu
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import axios from "../../api/axios";
import API from "../../api/api";

// ===== Types =====
type RootType = "Informasi" | "Request" | "Complaint";


interface CategoryNode {
  id: number;
  name: string;
  parent_id?: number | null;
  level?: number;
  children?: CategoryNode[];
}

type WizardTab = "greeting" | "name" | "problem" | "empathy";
type PageKey = "wizard" | "category";

interface HomeScripts {
  greeting: string;
  name: {
    script: string;
    label: string;
  };
  problem: string;
  empathy: string;
}

// ===== Product / Script Detail Types =====
interface Accordion {
  title: string;
  body_html: string;
}
interface Tab {
  title: string;
  accordions: Accordion[];
}

interface ProductDetailData {
  id: number;
  title: string;
  slug: string;
  is_breaking: boolean;
  content: { tabs: Tab[] };
  updated_at: string;
}

interface ScriptDetailData {
  id: number;
  title: string;
  slug: string;
  is_breaking: boolean;
  content: { tabs: Tab[] };
  updated_at: string;
}

type DetailKind = "product" | "script";
type DetailData = ProductDetailData | ScriptDetailData;

// ===== Global search types =====
type KnowledgeItem = {
  id: number;
  title: string;
  slug: string;
  type: "product" | "script";
  category_name: string;
  updated_at: string;
};

// ===== LocalStorage Helpers (sementara) =====
const LS_SCRIPTS_KEY = "s2pass_home_scripts_v1";

// ===== Return key (buat balik dari detail) =====
const DASH_RETURN_KEY = "s2pass_dash_return_v1";

const defaultScripts: HomeScripts = {
  greeting:
    "Selamat pagi/siang/sore, dengan Bank bjb. Saya [nama agent], ada yang bisa saya bantu?",
  name: {
    script: "Baik Bapak/Ibu, mohon konfirmasi nama lengkapnya ya.",
    label: "Nama Nasabah",
  },
  problem: "Baik, boleh dijelaskan kendalanya seperti apa?",
  empathy: "Baik Bapak/Ibu, mohon maaf atas ketidaknyamanannya. Saya bantu cek ya.",
};

function loadScripts(): HomeScripts {
  try {
    const raw = localStorage.getItem(LS_SCRIPTS_KEY);
    if (!raw) return defaultScripts;
    const parsed = JSON.parse(raw);
    return {
      greeting: parsed.greeting ?? defaultScripts.greeting,
      name: {
        script: parsed?.name?.script ?? defaultScripts.name.script,
        label: parsed?.name?.label ?? defaultScripts.name.label,
      },
      problem: parsed.problem ?? defaultScripts.problem,
      empathy: parsed.empathy ?? defaultScripts.empathy,
    };
  } catch {
    return defaultScripts;
  }
}

function saveScripts(next: HomeScripts) {
  localStorage.setItem(LS_SCRIPTS_KEY, JSON.stringify(next));
}

// ===== Utility =====
const rootOrder: RootType[] = ["Informasi", "Request", "Complaint"];

function findNodeById(tree: CategoryNode[], id: number): CategoryNode | null {
  for (const n of tree) {
    if (n.id === id) return n;
    if (n.children?.length) {
      const f = findNodeById(n.children, id);
      if (f) return f;
    }
  }
  return null;
}

function findRootTypeByNodeName(name: string): RootType | null {
  if (name === "Informasi") return "Informasi";
  if (name === "Request") return "Request";
  if (name === "Complaint") return "Complaint";
  return null;
}

/**
 * FIX: ScriptEditor harus di luar Home() supaya tidak remount tiap render
 */
const ScriptEditor = ({
  isAdmin,
  value,
  onChange,
}: {
  isAdmin: boolean;
  value: string;
  onChange: (v: string) => void;
}) => {
  if (!isAdmin) return null;
  return (
    <div className="mt-3 rounded-xl border border-stroke bg-white p-3 dark:border-strokedark dark:bg-boxdark">
      <div className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
        Admin: Edit Script
      </div>
      <textarea
        className="w-full min-h-[90px] rounded-lg border border-stroke bg-transparent p-2 text-sm outline-none focus:border-brand-500 dark:border-strokedark"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="mt-2 text-xs text-gray-400">
        Auto-save ke localStorage (sementara). Nanti bisa diganti API backend.
      </div>
    </div>
  );
};

// Accordion preview kecil untuk inline detail (tetap ada — tapi tidak dipakai lagi untuk leaf)
const AccordionItem = ({ title, html }: { title: string; html: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-stroke dark:border-strokedark">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-3 bg-gray-50 p-4 text-left hover:bg-gray-100 dark:bg-meta-4 dark:hover:bg-meta-4/80 transition"
        type="button"
      >
        <span className="font-semibold text-black dark:text-white">{title}</span>
        <span
          className={`grid h-8 w-8 place-items-center rounded-lg border border-stroke bg-white text-gray-500 transition-transform dark:border-strokedark dark:bg-boxdark ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ⌄
        </span>
      </button>
      {isOpen && (
        <div
          className="prose max-w-none bg-white p-4 text-sm dark:prose-invert dark:bg-boxdark
          [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
};

// ====== UI helper components ======
const IconPhone = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M6.5 3.5h2.2c.7 0 1.3.5 1.4 1.2l.5 2.6c.1.6-.2 1.2-.8 1.5l-1.3.7c.9 1.9 2.5 3.5 4.4 4.4l.7-1.3c.3-.6.9-.9 1.5-.8l2.6.5c.7.1 1.2.7 1.2 1.4v2.2c0 .8-.6 1.4-1.4 1.5-8.1.6-14.6-5.9-14-14 .1-.8.7-1.4 1.5-1.4Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const IconReset = ({ className = "h-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M20 12a8 8 0 1 1-2.3-5.6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M20 4v6h-6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CardSection = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
    <div className="mb-3">
      <div className="text-base font-bold text-black dark:text-white">{title}</div>
      {subtitle && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</div>
      )}
    </div>
    {children}
  </div>
);

export default function Home() {
  const navigate = useNavigate();

  // ===== page / tabs =====
  const [page, setPage] = useState<PageKey>("wizard");
  const [wizardTab, setWizardTab] = useState<WizardTab>("greeting");

  // scripts state
  const [scripts, setScripts] = useState<HomeScripts>(() => loadScripts());
  const [isAdmin, setIsAdmin] = useState(false);

  // name state
  const [customerName, setCustomerName] = useState("");
  const [savedName, setSavedName] = useState<string>("");

  // toast notif
  const [toast, setToast] = useState<string>("");

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 1800);
  };

  // category state
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState("");

  const [catStack, setCatStack] = useState<number[]>([]);

  // ===== global search (dimana aja) =====
  const [globalQ, setGlobalQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [searchItems, setSearchItems] = useState<KnowledgeItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  // ===== inline detail state (tetap ada, tapi leaf sekarang langsung navigate) =====
  const [selectedDetail, setSelectedDetail] = useState<{
    kind: DetailKind;
    id: number;
  } | null>(null);

  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  // ===== Load auth role =====
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(API.auth.me);
        const role = res.data?.role;
        setIsAdmin(role === "admin");
      } catch {
        setIsAdmin(false);
      }
    })();
  }, []);

  // ===== Save scripts to LS =====
  useEffect(() => {
    saveScripts(scripts);
  }, [scripts]);

  // ===== Load categories =====
  useEffect(() => {
    (async () => {
      setCatLoading(true);
      setCatError("");
      try {
        const res = await axios.get(API.categories.tree);
        setTree(res.data || []);
      } catch {
        setCatError("Gagal memuat kategori.");
      } finally {
        setCatLoading(false);
      }
    })();
  }, []);

  // ===== Restore dashboard return (kalau balik dari detail) =====
  useEffect(() => {
    const raw = sessionStorage.getItem(DASH_RETURN_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data?.savedName) setSavedName(data.savedName);
      if (Array.isArray(data?.catStack)) setCatStack(data.catStack);
      if (data?.page === "category") setPage("category");
    } catch {}
  }, []);

  const saveDashboardReturn = () => {
  sessionStorage.setItem(
    DASH_RETURN_KEY,
    JSON.stringify({
      returnPath: window.location.pathname + window.location.search + window.location.hash,
      page,
      catStack,
      savedName,
    })
  );
};

  // close dropdown search saat klik di luar
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!searchBoxRef.current) return;
      if (!searchBoxRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // debounce global search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(globalQ.trim()), 350);
    return () => clearTimeout(t);
  }, [globalQ]);

  // fetch global search
  useEffect(() => {
    const q = debouncedQ;
    if (!q) {
      setSearchItems([]);
      return;
    }
    (async () => {
      setSearchLoading(true);
      try {
        const res = await axios.get("/knowledge-base/all", {
          params: { q, page: 1, limit: 8 },
        });
        setSearchItems(res.data?.items || []);
      } catch {
        setSearchItems([]);
      } finally {
        setSearchLoading(false);
      }
    })();
  }, [debouncedQ]);

  // ===== Derive roots =====
  const rootMap = useMemo(() => {
    const map: Record<string, CategoryNode> = {};
    for (const n of tree) map[n.name] = n;
    return map;
  }, [tree]);

  const currentCategoryNode = useMemo(() => {
    if (catStack.length === 0) return null;
    return findNodeById(tree, catStack[catStack.length - 1]);
  }, [tree, catStack]);

  const currentButtons = useMemo(() => {
    if (catStack.length === 0) {
      return rootOrder.map((r) => rootMap[r]).filter(Boolean) as CategoryNode[];
    }
    return currentCategoryNode?.children || [];
  }, [catStack, currentCategoryNode, rootMap]);

  const breadcrumb = useMemo(() => {
    if (catStack.length === 0) return [];
    const nodes: CategoryNode[] = [];
    for (const id of catStack) {
      const n = findNodeById(tree, id);
      if (n) nodes.push(n);
    }
    return nodes;
  }, [catStack, tree]);

  const isLeafScreen =
    catStack.length > 0 && (currentCategoryNode?.children?.length || 0) === 0;

  // ===== Actions =====
  const backToHome = () => {
    setPage("wizard");
    setWizardTab("greeting");
    setCustomerName("");
    setSavedName("");
    setCatStack([]);

    setSelectedDetail(null);
    setDetailData(null);
    setDetailError("");

    setGlobalQ("");
    setSearchItems([]);
    setSearchOpen(false);
  };

  const saveName = () => {
    const v = customerName.trim();
    if (!v) return;
    setSavedName(v);
    showToast("✅ Nama nasabah tersimpan");
  };

  const onCategoryClick = (node: CategoryNode) => {
    setCatStack((prev) => [...prev, node.id]);
  };

  // ===== 1 tombol back universal (poin #3) =====
  const handleBack = () => {
    // kalau lagi inline detail (kalau masih kepake)
    if (selectedDetail) {
      setSelectedDetail(null);
      setDetailData(null);
      setDetailError("");
      return;
    }

    // kalau di kategori dan masih ada stack -> pop
    if (page === "category" && catStack.length > 0) {
      setCatStack((p) => p.slice(0, -1));
      return;
    }

    // kalau di kategori root -> balik wizard
    if (page === "category") {
      setPage("wizard");
      return;
    }

    // kalau di wizard, biarin (atau reset kalau kamu mau)
  };

  /**
   * AUTO DETECT LEAF:
   * - coba Script dulu
   * - kalau kosong, coba Product
   * - kalau ada -> LANGSUNG BUKA HALAMAN DETAIL (poin #4)
   */
  const onLeafSelected = async (leaf: CategoryNode) => {
    try {
      setDetailError("");
      setDetailLoading(true);

      // 1) Coba Script
      const scriptListRes = await axios.get(API.scripts.list, {
        params: { page: 1, limit: 10, categoryId: leaf.id },
      });

      const scriptItems = scriptListRes.data?.items || [];
      if (scriptItems.length > 0) {
        const scriptId = Number(scriptItems[0].id);
        const from = window.location.pathname + window.location.search + window.location.hash;

      saveDashboardReturn();
      navigate(`/knowledge-base/products/view/${scriptId}`, {
        state: { from },
      });
        return;
      }

      // 2) Kalau Script kosong -> coba Product
      const productListRes = await axios.get(API.products.list, {
        params: { page: 1, limit: 10, categoryId: leaf.id },
      });

      const productItems = productListRes.data?.items || [];
      if (productItems.length > 0) {
        const productId = Number(productItems[0].id);
        const from = window.location.pathname + window.location.search + window.location.hash;

        saveDashboardReturn();
        navigate(`/knowledge-base/products/view/${productId}`, {
          state: { from },
        });
        return;
      }

      setDetailError(`Tidak ada data Product/Script untuk kategori "${leaf.name}".`);
    } catch (e) {
      setDetailError("Gagal membuka detail.");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="S2PASS | Dashboard"
        description="Dashboard utama S2PASS - Wizard & Dynamic Category Navigation"
      />

      {/* toast notif save */}
      {toast && (
        <div className="fixed top-20 right-5 z-[999] rounded-xl bg-black/80 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* floating badge nama (ngikut kemana aja) */}
      {savedName && (
        <div className="fixed bottom-5 right-5 z-[999] rounded-2xl border border-stroke bg-white/95 px-4 py-3 shadow-lg backdrop-blur dark:border-strokedark dark:bg-boxdark/90">
          <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-300">
            Nasabah
          </div>
          <div className="max-w-[260px] truncate text-sm font-extrabold text-black dark:text-white">
            {savedName}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* ===== Sticky Header ===== */}
        <div className="sticky top-0 z-40 rounded-2xl border border-stroke bg-white/90 p-4 shadow-sm backdrop-blur dark:border-strokedark dark:bg-boxdark/85">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="text-lg font-bold tracking-tight text-black dark:text-white">
                S2PASS
              </div>

              <div className="hidden md:block h-6 w-px bg-gray-200 dark:bg-white/10" />

              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-300">
                  Nasabah:
                </span>

                <span
                  className={`inline-flex max-w-[60vw] items-center truncate rounded-full px-4 py-2 text-sm font-extrabold ring-1 ${
                    savedName
                      ? "bg-brand-50 text-brand-700 ring-brand-200 dark:bg-white/5 dark:text-white dark:ring-white/10"
                      : "bg-gray-50 text-gray-600 ring-gray-200 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10"
                  }`}
                  title={savedName || ""}
                >
                  {savedName ? savedName : "Belum disimpan"}
                </span>
              </div>
            </div>

            {/* SEARCH GLOBAL + reset + back universal */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {/* Global search */}
              <div ref={searchBoxRef} className="relative w-full sm:w-[420px]">
                <input
                  value={globalQ}
                  onChange={(e) => {
                    setGlobalQ(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Cari apapun (cth: kredit, ATM, reset, bunga...)"
                  className="w-full rounded-xl border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4"
                />

                {searchOpen && (globalQ.trim() || searchLoading) && (
                  <div className="absolute left-0 right-0 mt-2 overflow-hidden rounded-2xl border border-stroke bg-white shadow-xl dark:border-strokedark dark:bg-boxdark z-[999]">
                    <div className="max-h-[360px] overflow-auto p-2">
                      {searchLoading ? (
                        <div className="p-3 text-sm text-gray-500">Mencari...</div>
                      ) : searchItems.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">
                          Tidak ada hasil untuk “{globalQ}”
                        </div>
                      ) : (
                        searchItems.map((it) => (
                          <button
                            key={`${it.type}-${it.id}`}
                            className="w-full rounded-xl p-3 text-left hover:bg-gray-50 dark:hover:bg-white/5"
                            onClick={() => {
                              saveDashboardReturn();
                              setSearchOpen(false);
                              setGlobalQ("");
                              if (it.type === "product") {
                                navigate(`/knowledge-base/products/view/${it.id}`);
                              } else {
                                navigate(`/knowledge-base/scripts/view/${it.id}`);
                              }
                            }}
                            type="button"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-extrabold text-black dark:text-white">
                                  {it.title}
                                </div>
                                <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-white/10">
                                    {it.type.toUpperCase()}
                                  </span>
                                  <span className="truncate">{it.category_name}</span>
                                </div>
                              </div>
                              <span className="text-gray-400">→</span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    <div className="border-t border-stroke p-2 dark:border-strokedark">
                      <button
                        className="w-full rounded-xl px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          setGlobalQ("");
                        }}
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 1 tombol back universal */}
              <Button variant="outline" onClick={handleBack} className="w-full sm:w-auto">
                Back
              </Button>

              {/* Reset merah */}
              <Button
                onClick={backToHome}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white border border-red-600 hover:border-red-700"
              >
                <span className="mr-2 inline-flex items-center">
                  <IconPhone className="h-4 w-4" />
                </span>
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* ===== Main container ===== */}
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
          {/* ===== PAGE: WIZARD (disatuin kebawah) ===== */}
          {page === "wizard" && (
            <>
              <div className="mb-4 rounded-2xl border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-boxdark-2">
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-bold text-black dark:text-white">
                      Flow Awal Agent
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Greeting → Konfirmasi Nama → Konfirmasi Permasalahan → Empathy
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2 md:mt-0">
                    <button
                      type="button"
                      onClick={() => setPage("wizard")}
                      className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 dark:bg-boxdark dark:text-gray-200 dark:ring-white/10"
                    >
                      Wizard
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage("category")}
                      className="rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white ring-1 ring-brand-500 hover:opacity-95"
                    >
                      Kategori →
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <CardSection title="1) Greeting">
                  <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700 dark:bg-meta-4 dark:text-gray-200">
                    {scripts.greeting}
                  </div>
                  <ScriptEditor
                    isAdmin={isAdmin}
                    value={scripts.greeting}
                    onChange={(v) => setScripts((p) => ({ ...p, greeting: v }))}
                  />
                </CardSection>

                <CardSection
                  title="2) Konfirmasi Nama"
                  subtitle="Klik Save agar nama tampil terus untuk agent."
                >
                  <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700 dark:bg-meta-4 dark:text-gray-200">
                    {scripts.name.script}
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">
                        {scripts.name.label}
                      </label>
                      <input
                        className="w-full rounded-xl border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-strokedark"
                        placeholder="Masukkan nama nasabah..."
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <Button
                        className="w-full"
                        onClick={saveName}
                        disabled={!customerName.trim()}
                      >
                        Save Nama
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setCustomerName("");
                          setSavedName("");
                          showToast("🧹 Nama dibersihkan");
                        }}
                      >
                        <span className="mr-2 inline-flex items-center">
                          <IconReset className="h-4 w-4" />
                        </span>
                        Clear
                      </Button>
                    </div>
                  </div>

                  <ScriptEditor
                    isAdmin={isAdmin}
                    value={scripts.name.script}
                    onChange={(v) =>
                      setScripts((p) => ({ ...p, name: { ...p.name, script: v } }))
                    }
                  />
                </CardSection>

                <CardSection title="3) Konfirmasi Permasalahan">
                  <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700 dark:bg-meta-4 dark:text-gray-200">
                    {scripts.problem}
                  </div>
                  <ScriptEditor
                    isAdmin={isAdmin}
                    value={scripts.problem}
                    onChange={(v) => setScripts((p) => ({ ...p, problem: v }))}
                  />
                </CardSection>

                <CardSection title="4) Empathy">
                  <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700 dark:bg-meta-4 dark:text-gray-200">
                    {scripts.empathy}
                  </div>
                  <ScriptEditor
                    isAdmin={isAdmin}
                    value={scripts.empathy}
                    onChange={(v) => setScripts((p) => ({ ...p, empathy: v }))}
                  />
                </CardSection>
              </div>

              {/* Footer wizard */}
              <div className="sticky bottom-3 mt-6 rounded-2xl border border-stroke bg-white/95 p-4 shadow-md backdrop-blur dark:border-strokedark dark:bg-boxdark/90">
                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>

                  <Button onClick={() => setPage("category")}>Next → Kategori</Button>
                </div>
              </div>
            </>
          )}

          {/* ===== PAGE: CATEGORY ===== */}
          {page === "category" && (
            <>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-bold text-black dark:text-white">Kategori</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Klik sampai level terakhir (leaf), lalu otomatis buka halaman detail.
                  </div>
                </div>
              </div>

              {/* breadcrumb */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                {catStack.length === 0 ? (
                  <span className="text-gray-500 dark:text-gray-400">Home Kategori</span>
                ) : (
                  <>
                    <span className="text-gray-500 dark:text-gray-400">Home</span>
                    {breadcrumb.map((b) => (
                      <span
                        key={b.id}
                        className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700 dark:bg-white/5 dark:text-gray-200"
                      >
                        {b.name}
                      </span>
                    ))}
                  </>
                )}
              </div>

              <div className="mt-4">
                {catLoading ? (
                  <div className="text-sm text-gray-500">Memuat kategori...</div>
                ) : catError ? (
                  <div className="text-sm text-red-500">{catError}</div>
                ) : (
                  <>
                    {detailLoading && (
                      <div className="mb-4 rounded-xl border border-stroke bg-gray-50 p-3 text-sm text-gray-600 dark:border-strokedark dark:bg-boxdark-2 dark:text-gray-300">
                        Membuka detail...
                      </div>
                    )}

                    {detailError && (
                      <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
                        {detailError}
                      </div>
                    )}

                    {isLeafScreen && currentCategoryNode ? (
                      <div className="rounded-2xl border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-boxdark-2">
                        <div className="text-sm font-extrabold text-black dark:text-white">
                          Leaf: {currentCategoryNode.name}
                        </div>
                        <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                          Tidak ada sub-kategori lagi. Klik untuk buka detail otomatis.
                        </div>
                        <div className="mt-4">
                          <Button onClick={() => onLeafSelected(currentCategoryNode)}>
                            Buka Detail
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {currentButtons.map((n) => {
                          const isLeaf = (n.children?.length || 0) === 0;
                          const r = findRootTypeByNodeName(n.name);
                          const isRootButton = !!r;

                          return (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => (isLeaf ? onLeafSelected(n) : onCategoryClick(n))}
                              className={`group flex w-full items-center justify-between rounded-2xl border border-stroke bg-white px-5 py-4 text-left shadow-sm transition hover:shadow-md dark:border-strokedark dark:bg-boxdark-2 ${
                                isRootButton ? "ring-1 ring-brand-100 dark:ring-white/10" : ""
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="truncate text-sm font-extrabold text-black dark:text-white">
                                  {n.name}
                                </div>
                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  {isLeaf ? "Buka detail otomatis" : "Lihat sub-kategori"}
                                </div>
                              </div>

                              <span className="ml-3 grid h-10 w-10 place-items-center rounded-xl border border-stroke bg-gray-50 text-gray-500 group-hover:bg-brand-50 group-hover:text-brand-700 dark:border-strokedark dark:bg-meta-4 dark:group-hover:bg-white/10 dark:group-hover:text-white">
                                →
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer kategori */}
              <div className="sticky bottom-3 mt-6 rounded-2xl border border-stroke bg-white/95 p-4 shadow-md backdrop-blur dark:border-strokedark dark:bg-boxdark/90">
                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>

                  <Button onClick={() => {}} disabled>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
