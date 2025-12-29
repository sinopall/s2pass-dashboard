import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
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

// ===== LocalStorage Helpers (sementara) =====
const LS_SCRIPTS_KEY = "s2pass_home_scripts_v1";

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
 * (menghindari textarea cuma bisa 1 huruf lalu blur)
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
    <div className="mt-3 rounded-lg border border-stroke bg-white p-3 dark:border-strokedark dark:bg-boxdark-2">
      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
        Admin: Edit Script
      </div>
      <textarea
        className="w-full min-h-[90px] rounded border border-stroke bg-transparent p-2 text-sm outline-none focus:border-brand-500 dark:border-strokedark"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="mt-2 text-xs text-gray-400">
        Auto-save ke localStorage (sementara). Nanti bisa diganti API backend.
      </div>
    </div>
  );
};

// Accordion preview kecil untuk inline detail
const AccordionItem = ({ title, html }: { title: string; html: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-stroke rounded dark:border-strokedark overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 dark:bg-meta-4 dark:hover:bg-meta-4/80 transition"
        type="button"
      >
        <span className="font-medium text-black dark:text-white">{title}</span>
        <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>⌄</span>
      </button>
      {isOpen && (
        <div
          className="p-4 bg-white dark:bg-boxdark prose max-w-none text-sm dark:prose-invert
          [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
};

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

  // category state
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState("");

  const [catStack, setCatStack] = useState<number[]>([]);

  // ===== inline detail state (AUTO: script OR product) =====
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
  };

  const saveName = () => {
    const v = customerName.trim();
    if (!v) return;
    setSavedName(v);
  };

  const onCategoryClick = (node: CategoryNode) => {
    setCatStack((prev) => [...prev, node.id]);
  };

  const onCategoryBack = () => {
    // kalau lagi lihat detail -> back keluar detail dulu
    if (selectedDetail) {
      setSelectedDetail(null);
      setDetailData(null);
      setDetailError("");
      return;
    }
    setCatStack((prev) => prev.slice(0, -1));
  };

  /**
   * AUTO DETECT LEAF:
   * - coba Script dulu (API.scripts.list)
   * - kalau kosong, coba Product (API.products.list)
   * - asumsi user: pasti salah satu ada, tidak mungkin dua-duanya
   */
  const onLeafSelected = async (leaf: CategoryNode) => {
    try {
      setDetailError("");
      setDetailLoading(true);
      setSelectedDetail(null);
      setDetailData(null);

      // 1) Coba Script
      const scriptListRes = await axios.get(API.scripts.list, {
        params: { page: 1, limit: 10, categoryId: leaf.id },
      });

      const scriptItems = scriptListRes.data?.items || [];
      if (scriptItems.length > 0) {
        const scriptId = Number(scriptItems[0].id);
        setSelectedDetail({ kind: "script", id: scriptId });

        const scriptDetailRes = await axios.get(API.scripts.detail(scriptId));
        setDetailData(scriptDetailRes.data);
        return;
      }

      // 2) Kalau Script kosong -> coba Product
      const productListRes = await axios.get(API.products.list, {
        params: { page: 1, limit: 10, categoryId: leaf.id },
      });

      const productItems = productListRes.data?.items || [];
      if (productItems.length > 0) {
        const productId = Number(productItems[0].id);
        setSelectedDetail({ kind: "product", id: productId });

        const productDetailRes = await axios.get(API.products.detail(productId));
        setDetailData(productDetailRes.data);
        return;
      }

      // 3) Tidak ada dua-duanya
      setDetailError(`Tidak ada data Product/Script untuk kategori "${leaf.name}".`);
    } catch (e) {
      setDetailError("Gagal membuka detail.");
    } finally {
      setDetailLoading(false);
    }
  };

  // ===== Render =====
  const wizardSteps = [
    { key: "greeting" as WizardTab, label: "1. Greeting" },
    { key: "name" as WizardTab, label: "2. Konfirmasi Nama" },
    { key: "problem" as WizardTab, label: "3. Konfirmasi Permasalahan" },
    { key: "empathy" as WizardTab, label: "4. Empathy" },
  ];

  return (
    <>
      <PageMeta
        title="S2PASS | Dashboard"
        description="Dashboard utama S2PASS - Wizard & Dynamic Category Navigation"
      />

      <div className="space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between rounded-lg border border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center gap-3">
            <div className="text-lg font-semibold text-black dark:text-white">S2PASS</div>

            {savedName && (
              <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600 ring-1 ring-brand-200 dark:bg-white/5 dark:text-white dark:ring-white/10">
                Bapak/Ibu: {savedName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={backToHome}>
              Back to Home (Reset)
            </Button>
          </div>
        </div>

        {/* Container */}
        <div className="rounded-lg border border-stroke bg-white p-5 dark:border-strokedark dark:bg-boxdark">
          {/* Step indicator */}
          <div className="mb-4 flex flex-wrap gap-2">
            {wizardSteps.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => {
                  setPage("wizard");
                  setWizardTab(s.key);
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${
                  page === "wizard" && wizardTab === s.key
                    ? "bg-brand-500 text-white ring-brand-500"
                    : "bg-gray-50 text-gray-600 ring-gray-200 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10"
                }`}
              >
                {s.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPage("category")}
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${
                page === "category"
                  ? "bg-brand-500 text-white ring-brand-500"
                  : "bg-gray-50 text-gray-600 ring-gray-200 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10"
              }`}
            >
              5. Kategori
            </button>
          </div>

          {/* ===== PAGE: WIZARD ===== */}
          {page === "wizard" && (
            <>
              {wizardTab === "greeting" && (
                <div>
                  <div className="text-sm font-semibold text-black dark:text-white mb-2">
                    Greeting
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 dark:bg-boxdark-2 dark:text-gray-200">
                    {scripts.greeting}
                  </div>
                  <ScriptEditor
                    isAdmin={isAdmin}
                    value={scripts.greeting}
                    onChange={(v) => setScripts((p) => ({ ...p, greeting: v }))}
                  />
                </div>
              )}

              {wizardTab === "name" && (
                <div>
                  <div className="text-sm font-semibold text-black dark:text-white mb-2">
                    Konfirmasi Nama Nasabah
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 dark:bg-boxdark-2 dark:text-gray-200">
                    {scripts.name.script}
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">
                        {scripts.name.label}
                      </label>
                      <input
                        className="w-full rounded-lg border border-stroke bg-transparent px-3 py-3 text-sm outline-none focus:border-brand-500 dark:border-strokedark"
                        placeholder="Masukkan nama nasabah..."
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        className="w-full"
                        onClick={saveName}
                        disabled={!customerName.trim()}
                      >
                        Save Nama
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
                </div>
              )}

              {wizardTab === "problem" && (
                <div>
                  <div className="text-sm font-semibold text-black dark:text-white mb-2">
                    Konfirmasi Permasalahan Nasabah
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 dark:bg-boxdark-2 dark:text-gray-200">
                    {scripts.problem}
                  </div>

                  <ScriptEditor
                    isAdmin={isAdmin}
                    value={scripts.problem}
                    onChange={(v) => setScripts((p) => ({ ...p, problem: v }))}
                  />
                </div>
              )}

              {wizardTab === "empathy" && (
                <div>
                  <div className="text-sm font-semibold text-black dark:text-white mb-2">
                    Empathy
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 dark:bg-boxdark-2 dark:text-gray-200">
                    {scripts.empathy}
                  </div>

                  <ScriptEditor
                    isAdmin={isAdmin}
                    value={scripts.empathy}
                    onChange={(v) => setScripts((p) => ({ ...p, empathy: v }))}
                  />
                </div>
              )}

              {/* Footer wizard */}
              <div className="mt-6 flex items-center justify-between border-t border-stroke pt-4 dark:border-strokedark">
                <Button
                  variant="outline"
                  onClick={() => {
                    const order: WizardTab[] = ["greeting", "name", "problem", "empathy"];
                    const idx = order.indexOf(wizardTab);
                    const prev = order[Math.max(idx - 1, 0)];
                    setWizardTab(prev);
                  }}
                  disabled={wizardTab === "greeting"}
                >
                  Back
                </Button>

                <Button
                  onClick={() => {
                    const order: WizardTab[] = ["greeting", "name", "problem", "empathy"];
                    const idx = order.indexOf(wizardTab);
                    if (wizardTab === "empathy") {
                      setPage("category");
                      return;
                    }
                    const next = order[Math.min(idx + 1, order.length - 1)];
                    setWizardTab(next);
                  }}
                >
                  Next
                </Button>
              </div>
            </>
          )}

          {/* ===== PAGE: CATEGORY ===== */}
          {page === "category" && (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-black dark:text-white">Kategori</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Klik sampai level terakhir (leaf), akan langsung masuk detail otomatis.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCategoryBack}
                    disabled={catStack.length === 0 && !selectedDetail}
                  >
                    Back Kategori
                  </Button>
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
                        className="rounded-full bg-gray-100 px-3 py-1 text-gray-700 dark:bg-white/5 dark:text-gray-200"
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
                    {/* ===== INLINE DETAIL ===== */}
                    {selectedDetail && (
                      <div className="rounded-lg border border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark-2">
                        {detailLoading ? (
                          <div className="text-sm text-gray-500">Memuat detail...</div>
                        ) : detailError ? (
                          <div className="text-sm text-red-500">{detailError}</div>
                        ) : detailData ? (
                          <div className="space-y-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="text-lg font-semibold text-black dark:text-white">
                                    {detailData.title}
                                  </div>

                                  {detailData.is_breaking && (
                                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                                      {selectedDetail.kind === "script" ? "Important" : "Breaking"}
                                    </span>
                                  )}

                                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-white/10 dark:text-gray-200">
                                    {selectedDetail.kind === "script" ? "SCRIPT" : "PRODUCT"}
                                  </span>
                                </div>
                                <div className="mt-1 text-xs text-gray-500">/{detailData.slug}</div>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedDetail(null);
                                    setDetailData(null);
                                    setDetailError("");
                                  }}
                                >
                                  Back
                                </Button>

                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const url =
                                      selectedDetail.kind === "script"
                                        ? `/knowledge-base/scripts/view/${detailData.id}`
                                        : `/knowledge-base/products/view/${detailData.id}`;
                                    navigate(url);
                                  }}
                                >
                                  Buka Halaman Detail
                                </Button>
                              </div>
                            </div>

                            {/* Tabs & accordions */}
                            {detailData.content?.tabs?.length ? (
                              <div className="rounded-lg border border-stroke p-3 dark:border-strokedark">
                                <div className="text-sm font-semibold text-black dark:text-white mb-3">
                                  Konten {selectedDetail.kind === "script" ? "Script" : "Produk"}
                                </div>

                                {detailData.content.tabs.map((t, ti) => (
                                  <div key={ti} className="mb-4">
                                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
                                      {t.title}
                                    </div>
                                    <div className="space-y-3">
                                      {t.accordions?.length ? (
                                        t.accordions.map((acc, ai) => (
                                          <AccordionItem
                                            key={ai}
                                            title={acc.title}
                                            html={acc.body_html}
                                          />
                                        ))
                                      ) : (
                                        <div className="text-xs text-gray-500 italic">
                                          Tidak ada accordion di tab ini.
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">Tidak ada konten tab.</div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* ===== CATEGORY BUTTONS ===== */}
                    {!selectedDetail && (
                      <>
                        {isLeafScreen && currentCategoryNode ? (
                          <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-boxdark-2">
                            <div className="text-sm font-semibold text-black dark:text-white">
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
                            {detailError && (
                              <div className="mt-3 text-sm text-red-500">{detailError}</div>
                            )}
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
                                  className={`group flex w-full items-center justify-between rounded-xl border border-stroke bg-white px-4 py-4 text-left transition hover:shadow-sm dark:border-strokedark dark:bg-boxdark-2 ${
                                    isRootButton ? "ring-1 ring-brand-100 dark:ring-white/10" : ""
                                  }`}
                                >
                                  <div>
                                    <div className="text-sm font-semibold text-black dark:text-white">
                                      {n.name}
                                    </div>
                                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                      {isLeaf ? "Buka detail otomatis" : "Lihat sub-kategori"}
                                    </div>
                                  </div>
                                  <span className="text-xs text-gray-400 group-hover:text-brand-600">
                                    →
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Footer kategori */}
              <div className="mt-6 flex items-center justify-between border-t border-stroke pt-4 dark:border-strokedark">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedDetail) {
                      setSelectedDetail(null);
                      setDetailData(null);
                      setDetailError("");
                      return;
                    }
                    setPage("wizard");
                    setWizardTab("empathy");
                  }}
                >
                  Back
                </Button>

                <Button onClick={() => {}} disabled>
                  Next
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
