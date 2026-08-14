import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import axios from "../../../api/axios";
import API from "../../../api/api";
import PageMeta from "../../../components/common/PageMeta";
import Button from "../../../components/ui/button/Button";
import { PencilIcon, ChevronDownIcon } from "../../../icons";

const DASH_RETURN_KEY = "s2pass_dash_return_v1";

// ==================== HELPER: SEARCH & HIGHLIGHT ====================

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Strip tag HTML jadi plain text -- dipakai cuma untuk CEK apakah ada match,
// bukan untuk ditampilkan (jadi tidak perlu presisi sempurna).
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ");
}

// Sisipkan <mark> di sekeliling kata yang cocok, TANPA merusak tag HTML.
// Caranya: parse jadi DOM asli, jalan cuma di text node-nya (walker),
// tag-tag di sekitarnya tidak pernah disentuh sama sekali.
function highlightHtml(html: string, query: string): string {
  const q = query.trim();
  if (!q) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const regex = new RegExp(`(${escapeRegExp(q)})`, "gi");

  const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.textContent && regex.test(node.textContent)) {
      textNodes.push(node as Text);
    }
    regex.lastIndex = 0; // reset karena regex global nyimpen state di .test()
  }

  textNodes.forEach((textNode) => {
    const span = doc.createElement("span");
    span.innerHTML = (textNode.textContent || "").replace(
      regex,
      '<mark class="search-hit bg-yellow-300 dark:bg-yellow-500/70 rounded px-0.5">$1</mark>',
    );
    textNode.replaceWith(...Array.from(span.childNodes));
  });

  return doc.body.innerHTML;
}

// Type definitions (sesuaikan dengan API)
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
  category_id: number;
  is_breaking: boolean;
  content: { tabs: Tab[] };
  updated_at: string;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [categoryPath, setCategoryPath] = useState<string>("");
  const [categoryRoot, setCategoryRoot] = useState<string>("");
  const [productScripts, setProductScripts] = useState<any[]>([]);

  // ==================== SEARCH DALAM KONTEN ====================
  const [searchQuery, setSearchQuery] = useState("");
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedData = localStorage.getItem("user_data");
    if (storedData) {
      try {
        const user = JSON.parse(storedData);
        setIsAdmin(user.role === "admin");
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }
  }, []);

  // Fetch Data
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await axios.get(API.products.detail(Number(id)));
        setProduct(res.data);

        if (res.data.category_id) {
          const pathRes = await axios.get(API.categories.path, {
            params: { leafId: res.data.category_id },
          });
          const pathNames = pathRes.data.map((c: any) => c.name).join(" / ");
          setCategoryPath(pathNames);
          if (pathRes.data.length > 0) {
            setCategoryRoot(pathRes.data[0].name);
          }
        }

        const scriptRes = await axios.get(API.scripts.list, {
          params: { productId: id, limit: 100 },
        });
        setProductScripts(scriptRes.data?.items || []);
      } catch (error) {
        console.error("Gagal load detail:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id]);

  const location = useLocation();

  // Semua accordion dari tab 0 (Informasi Umum) di-flatten -- ini yang jadi
  // target search, karena tab "List Script" isinya bukan konten cari-cari.
  const accordionsFlat =
    product?.content?.tabs?.flatMap((t) => t.accordions) || [];

  const trimmedQuery = searchQuery.trim();
  let currentMatchTotal = 0;
  let firstMatchIndex = -1;

  if (trimmedQuery) {
    if (activeTab === 0) {
      // Pencarian di Tab 0 (Informasi Umum)
      const matchFlags = accordionsFlat.map((acc) =>
        (acc.title + " " + stripHtml(acc.body_html))
          .toLowerCase()
          .includes(trimmedQuery.toLowerCase()),
      );
      currentMatchTotal = matchFlags.filter(Boolean).length;
      firstMatchIndex = matchFlags.findIndex(Boolean);
    } else if (activeTab === 1) {
      // Pencarian di Tab 1 (List Script)
      productScripts.forEach((script, idx) => {
        let scriptMatches = 0;

        // 1. Cek kecocokan pada Judul Script
        if (script.title.toLowerCase().includes(trimmedQuery.toLowerCase())) {
          scriptMatches++;
        }

        // 2. Cek kecocokan pada inner accordion (Konten Script)
        const innerAccs =
          script.content?.tabs?.flatMap((t: any) => t.accordions) || [];
        innerAccs.forEach((acc: any) => {
          if (
            (acc.title + " " + stripHtml(acc.body_html))
              .toLowerCase()
              .includes(trimmedQuery.toLowerCase())
          ) {
            scriptMatches++;
          }
        });

        currentMatchTotal += scriptMatches;
        // Simpan index script pertama yang memiliki kecocokan untuk auto-expand
        if (scriptMatches > 0 && firstMatchIndex === -1) {
          firstMatchIndex = idx;
        }
      });
    }
  }

  // Begitu ada match: pastikan pindah ke tab konten (bukan tab script),
  // lalu scroll ke highlight pertama setelah DOM sempat re-render.
  useEffect(() => {
    if (!trimmedQuery || firstMatchIndex === -1) return;

    // setActiveTab(0) DIHAPUS agar tidak pindah tab saat mencari

    const t = setTimeout(() => {
      const el = contentRef.current?.querySelector(".search-hit");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
    return () => clearTimeout(t);
  }, [trimmedQuery, firstMatchIndex, activeTab]);

  const handleBackToDashboard = () => {
    // 1) paling aman: dari state
    const stateFrom = (location.state as any)?.from;
    if (typeof stateFrom === "string" && stateFrom.length > 0) {
      navigate(stateFrom);
      return;
    }

    // 2) cadangan: sessionStorage
    try {
      const raw = sessionStorage.getItem(DASH_RETURN_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data?.returnPath) {
          navigate(data.returnPath);
          return;
        }
      }
    } catch {
      console.error("Gagal membaca sessionStorage untuk returnPath");
    }

    // 3) fallback: route aman (jangan navigate(-1))
    navigate("/");
  };

  if (loading)
    return <div className="p-10 text-center">Memuat detail produk...</div>;
  if (!product)
    return <div className="p-10 text-center">Produk tidak ditemukan.</div>;

  return (
    <>
      <PageMeta title="Detail Produk | S2PAS" description="" />
      <div className="flex flex-col gap-6">
        {/* HEADER INFO */}
        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-black dark:text-white">
                  {product.title}
                </h2>
                {product.is_breaking && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
                    Breaking
                  </span>
                )}
                {categoryPath && (
                  <span
                    className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                      categoryRoot === "Informasi"
                        ? "bg-blue-100 text-blue-800"
                        : categoryRoot === "Request"
                          ? "bg-green-100 text-green-800"
                          : categoryRoot === "Complaint"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {categoryPath}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Slug:{" "}
                <span className="font-mono bg-gray-100 px-1 rounded dark:bg-meta-4 dark:text-gray-300">
                  {product.slug}
                </span>
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBackToDashboard}>
                Kembali
              </Button>
              {isAdmin && (
                <Button
                  onClick={() => navigate(`/products/edit/${product.id}`)}
                >
                  <PencilIcon className="w-4 h-4 mr-2" /> Edit Produk
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* PREVIEW CONTENT (TABS & ACCORDION) */}
        <div
          ref={contentRef}
          className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
        >
          <div className="border-b border-stroke py-4 px-6 dark:border-strokedark flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="font-semibold text-black dark:text-white shrink-0">
              Konten Produk
            </h3>

            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari di dalam konten produk ini..."
                className="w-full rounded-lg border border-stroke bg-white pl-9 pr-8 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M21 21l-4-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Hapus pencarian"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}

              {trimmedQuery && (
                <div className="absolute -bottom-5 left-0 text-[11px] text-gray-500">
                  {currentMatchTotal > 0
                    ? `${currentMatchTotal} bagian ditemukan`
                    : "Tidak ada yang cocok"}
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {/* TAB NAVIGATION */}
            <div className="flex border-b border-gray-200 dark:border-strokedark mb-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab(0)}
                className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 0
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Informasi Umum
              </button>
              <button
                onClick={() => setActiveTab(1)}
                className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 1
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                List Script
              </button>
            </div>

            {/* TAB CONTENT */}
            {activeTab === 0 && (
              <div className="space-y-4">
                {accordionsFlat.length > 0 ? (
                  accordionsFlat.map((acc, k) => (
                    <AccordionItem
                      key={k}
                      title={acc.title}
                      html={acc.body_html}
                      defaultOpen={k === 0}
                      searchQuery={trimmedQuery}
                      forceOpen={k === firstMatchIndex}
                    />
                  ))
                ) : (
                  <p className="text-gray-500">Tidak ada konten informasi.</p>
                )}
              </div>
            )}

            {activeTab === 1 && (
              <div className="space-y-4">
                {productScripts.length > 0 ? (
                  productScripts.map((script, idx) => (
                    <ScriptAccordionItem
                      key={script.id}
                      script={script}
                      navigate={navigate}
                      searchQuery={trimmedQuery}
                      forceOpen={idx === firstMatchIndex}
                    />
                  ))
                ) : (
                  <p className="text-gray-500 italic">
                    Belum ada script yang terhubung dengan produk ini.{" "}
                    {isAdmin && (
                      <button
                        onClick={() =>
                          navigate("/knowledge-base/scripts/create", {
                            state: {
                              prefillCategoryId: product.category_id,
                              prefillProductId: product.id,
                            },
                          })
                        }
                        className="text-gray-500 underline italic"
                      >
                        Buat script untuk produk ini
                      </button>
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Sub-component untuk Accordion Preview (Simple Toggle)
const AccordionItem = ({
  title,
  html,
  defaultOpen = false,
  searchQuery = "",
  forceOpen = false,
}: {
  title: string;
  html: string;
  defaultOpen?: boolean;
  searchQuery?: string;
  forceOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Kalau accordion ini yang jadi target hasil search (match pertama),
  // paksa terbuka -- tapi user tetap bisa collapse manual lagi setelahnya.
  useEffect(() => {
    if (forceOpen) setIsOpen(true);
  }, [forceOpen]);

  const highlightedTitle = highlightHtml(title, searchQuery);
  const highlightedBody = highlightHtml(html, searchQuery);

  return (
    <div className="border border-stroke rounded dark:border-strokedark overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 dark:bg-meta-4 dark:hover:bg-meta-4/80 transition"
      >
        <span
          className="font-medium text-black dark:text-white"
          dangerouslySetInnerHTML={{ __html: highlightedTitle }}
        />
        <ChevronDownIcon
          className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div
          className="p-4 bg-white dark:bg-boxdark text-black dark:text-gray-300 
                     prose max-w-none dark:prose-invert
                     prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: highlightedBody }}
        />
      )}
    </div>
  );
};

const ScriptAccordionItem = ({
  script,
  navigate,
  searchQuery = "",
  forceOpen = false,
}: {
  script: any;
  navigate: ReturnType<typeof useNavigate>;
  searchQuery?: string;
  forceOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (forceOpen) setIsOpen(true);
  }, [forceOpen]);

  const scriptAccordions =
    script.content?.tabs?.flatMap((t: any) => t.accordions) || [];

  const highlightedTitle = highlightHtml(script.title, searchQuery);

  return (
    <div className="border border-stroke rounded dark:border-strokedark overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 dark:bg-meta-4 dark:hover:bg-meta-4/80 transition"
      >
        <span
          className="font-medium text-black dark:text-white"
          dangerouslySetInnerHTML={{ __html: highlightedTitle }}
        />
        <ChevronDownIcon
          className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="p-4 bg-white dark:bg-boxdark border-t border-stroke dark:border-strokedark flex flex-col gap-4">
          {/* Header Info & Tombol Halaman Penuh */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-stroke dark:border-strokedark">
            <div>
              <p className="text-sm text-gray-500">
                Update terakhir:{" "}
                {new Date(script.updated_at).toLocaleDateString("id-ID")}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() =>
                navigate(`/knowledge-base/scripts/view/${script.id}`)
              }
              variant="outline"
              className="shrink-0"
            >
              Buka Halaman Script
            </Button>
          </div>

          {/* Render Nested Accordion dari Konten Script */}
          <div className="space-y-3">
            {scriptAccordions.length > 0 ? (
              scriptAccordions.map((acc: any, index: number) => {
                const hasMatch = searchQuery
                  ? (acc.title + " " + stripHtml(acc.body_html))
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase())
                  : false;

                return (
                  <AccordionItem
                    key={index}
                    title={acc.title}
                    html={acc.body_html}
                    searchQuery={searchQuery}
                    forceOpen={hasMatch}
                  />
                );
              })
            ) : (
              <p className="text-sm text-gray-500 italic text-center py-2">
                Konten detail belum tersedia.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
