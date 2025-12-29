import { useEffect, useMemo, useState } from "react";
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

type StepKey = "greeting" | "name" | "problem" | "empathy" | "category";

interface HomeScripts {
  greeting: string;
  name: {
    script: string;
    label: string; // label input
  };
  problem: string;
  empathy: string;
}

// ===== LocalStorage Helpers (sementara) =====
const LS_SCRIPTS_KEY = "s2pass_home_scripts_v1";

const defaultScripts: HomeScripts = {
  greeting: "Selamat pagi/siang/sore, dengan Bank bjb. Saya [nama agent], ada yang bisa saya bantu?",
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
    // fallback sederhana
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

// ===== Component =====
export default function Home() {
  // step state
  const [step, setStep] = useState<StepKey>("greeting");

  // scripts state (editable by admin)
  const [scripts, setScripts] = useState<HomeScripts>(() => loadScripts());
  const [isAdmin, setIsAdmin] = useState(false);

  // name input state
  const [customerName, setCustomerName] = useState("");
  const [savedName, setSavedName] = useState<string>("");

  // category state
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState("");

  // navigation in category (stack of node ids)
  // empty => show 3 root buttons
  const [catStack, setCatStack] = useState<number[]>([]);

  // ===== Load auth role (optional) =====
  useEffect(() => {
    // kalau kamu sudah punya /auth/me
    (async () => {
      try {
        const res = await axios.get(API.auth.me);
        const role = res.data?.role;
        setIsAdmin(role === "admin");
      } catch {
        // kalau belum login / belum ada, biarkan false
        setIsAdmin(false);
      }
    })();
  }, []);

  // ===== Load scripts from LS (persist) =====
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
      } catch (e) {
        setCatError("Gagal memuat kategori.");
      } finally {
        setCatLoading(false);
      }
    })();
  }, []);

  // ===== Derive roots (Informasi/Request/Complaint) from tree =====
  const rootMap = useMemo(() => {
    const map: Record<string, CategoryNode> = {};
    for (const n of tree) map[n.name] = n;
    return map;
  }, [tree]);

  // current category screen nodes
  const currentCategoryNode = useMemo(() => {
    if (catStack.length === 0) return null;
    return findNodeById(tree, catStack[catStack.length - 1]);
  }, [tree, catStack]);

  const currentButtons = useMemo(() => {
    if (catStack.length === 0) {
      // show root buttons fixed order if exist
      return rootOrder
        .map((r) => rootMap[r])
        .filter(Boolean) as CategoryNode[];
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

  // ===== Actions =====
  const goNext = () => {
    const order: StepKey[] = ["greeting", "name", "problem", "empathy", "category"];
    const idx = order.indexOf(step);
    const next = order[Math.min(idx + 1, order.length - 1)];
    setStep(next);
  };

  const goBack = () => {
    const order: StepKey[] = ["greeting", "name", "problem", "empathy", "category"];
    const idx = order.indexOf(step);
    const prev = order[Math.max(idx - 1, 0)];
    setStep(prev);
  };

  const backToHome = () => {
    // reset per requirement
    setStep("greeting");
    setCustomerName("");
    setSavedName("");
    setCatStack([]);
  };

  const saveName = () => {
    const v = customerName.trim();
    if (!v) return;
    setSavedName(v); // tampil kiri atas
  };

  const onCategoryClick = (node: CategoryNode) => {
    // root click -> push root id
    // child click -> push child id
    setCatStack((prev) => [...prev, node.id]);
  };

  const onCategoryBack = () => {
    setCatStack((prev) => prev.slice(0, -1));
  };

  const onLeafSelected = (leaf: CategoryNode) => {
    // sementara placeholder
    alert(`Leaf dipilih: ${leaf.name}\nNext: buka halaman detail product (belum dibuat).`);
  };

  // leaf logic: kalau currentButtons kosong, berarti current node leaf
  const isLeafScreen = catStack.length > 0 && (currentCategoryNode?.children?.length || 0) === 0;

  // ===== Render helpers =====
  const ScriptEditor = ({
    value,
    onChange,
  }: {
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
                Nama tersimpan: {savedName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={backToHome}>
              Back to Home (Reset)
            </Button>
          </div>
        </div>

        {/* Wizard container */}
        <div className="rounded-lg border border-stroke bg-white p-5 dark:border-strokedark dark:bg-boxdark">
          {/* Step indicator */}
          <div className="mb-4 flex flex-wrap gap-2">
            {[
              { key: "greeting", label: "1. Greeting" },
              { key: "name", label: "2. Konfirmasi Nama" },
              { key: "problem", label: "3. Konfirmasi Permasalahan" },
              { key: "empathy", label: "4. Empathy" },
              { key: "category", label: "5. Kategori" },
            ].map((s) => (
              <span
                key={s.key}
                className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                  step === (s.key as StepKey)
                    ? "bg-brand-500 text-white ring-brand-500"
                    : "bg-gray-50 text-gray-600 ring-gray-200 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10"
                }`}
              >
                {s.label}
              </span>
            ))}
          </div>

          {/* Step content */}
          {step === "greeting" && (
            <div>
              <div className="text-sm font-semibold text-black dark:text-white mb-2">
                Greeting
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 dark:bg-boxdark-2 dark:text-gray-200">
                {scripts.greeting}
              </div>
              <ScriptEditor
                value={scripts.greeting}
                onChange={(v) => setScripts((p) => ({ ...p, greeting: v }))}
              />
            </div>
          )}

          {step === "name" && (
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
                value={scripts.name.script}
                onChange={(v) =>
                  setScripts((p) => ({ ...p, name: { ...p.name, script: v } }))
                }
              />
            </div>
          )}

          {step === "problem" && (
            <div>
              <div className="text-sm font-semibold text-black dark:text-white mb-2">
                Konfirmasi Permasalahan Nasabah
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 dark:bg-boxdark-2 dark:text-gray-200">
                {scripts.problem}
              </div>

              <ScriptEditor
                value={scripts.problem}
                onChange={(v) => setScripts((p) => ({ ...p, problem: v }))}
              />
            </div>
          )}

          {step === "empathy" && (
            <div>
              <div className="text-sm font-semibold text-black dark:text-white mb-2">
                Empathy
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 dark:bg-boxdark-2 dark:text-gray-200">
                {scripts.empathy}
              </div>

              <ScriptEditor
                value={scripts.empathy}
                onChange={(v) => setScripts((p) => ({ ...p, empathy: v }))}
              />
            </div>
          )}

          {step === "category" && (
            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-black dark:text-white">
                    Kategori
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Klik tombol untuk masuk ke sub kategori berikutnya.
                  </div>
                </div>

                {/* category back inside category screen */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCategoryBack}
                    disabled={catStack.length === 0}
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
                    {/* leaf screen */}
                    {isLeafScreen && currentCategoryNode ? (
                      <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-boxdark-2">
                        <div className="text-sm font-semibold text-black dark:text-white">
                          Leaf: {currentCategoryNode.name}
                        </div>
                        <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                          Tidak ada sub-kategori lagi. Next: arahkan ke detail produk.
                        </div>
                        <div className="mt-4">
                          <Button onClick={() => onLeafSelected(currentCategoryNode)}>
                            Lihat Detail Produk (placeholder)
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {currentButtons.map((n) => {
                          // kalau node tidak punya children -> treat leaf click
                          const isLeaf = (n.children?.length || 0) === 0;
                          const r = findRootTypeByNodeName(n.name);
                          const isRootButton = !!r;

                          return (
                            <button
                              key={n.id}
                              onClick={() => (isLeaf ? onLeafSelected(n) : onCategoryClick(n))}
                              className={`group flex w-full items-center justify-between rounded-xl border border-stroke bg-white px-4 py-4 text-left transition hover:shadow-sm dark:border-strokedark dark:bg-boxdark-2 ${
                                isRootButton
                                  ? "ring-1 ring-brand-100 dark:ring-white/10"
                                  : ""
                              }`}
                            >
                              <div>
                                <div className="text-sm font-semibold text-black dark:text-white">
                                  {n.name}
                                </div>
                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  {isLeaf ? "Buka detail produk" : "Lihat sub-kategori"}
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
              </div>
            </div>
          )}

          {/* Footer Back/Next */}
          <div className="mt-6 flex items-center justify-between border-t border-stroke pt-4 dark:border-strokedark">
            <Button variant="outline" onClick={goBack} disabled={step === "greeting"}>
              Back
            </Button>

            <Button onClick={goNext} disabled={step === "category"}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
