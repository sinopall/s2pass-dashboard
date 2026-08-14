import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import axios from "../../../api/axios";
import API from "../../../api/api";
import Button from "../../../components/ui/button/Button";
import { PencilIcon, ChevronDownIcon } from "../../../icons";
import PageMeta from "../../../components/common/PageMeta";

const DASH_RETURN_KEY = "s2pass_dash_return_v1";

import { flattenCategoryTree } from "../../../utils/categoryUtils";

// ==================== HELPER: SEARCH & HIGHLIGHT ====================

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ");
}

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

// --- TYPES ---
interface Accordion {
  title: string;
  body_html: string;
}
interface Tab {
  title: string;
  accordions: Accordion[];
}

interface ScriptDetailData {
  id: number;
  title: string;
  slug: string;
  category_id: number;
  is_breaking: boolean;
  content: { tabs: Tab[] };
  updated_at: string;
}

export default function ScriptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [script, setScript] = useState<ScriptDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [categoryName, setCategoryName] = useState<string>("");

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

  // --- FETCH DATA SCRIPT ---
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await axios.get(API.scripts.detail(Number(id)));
        setScript(res.data);

        // Fetch categories to get the name
        const catRes = await axios.get(API.categories.tree);
        const flatCats = flattenCategoryTree(catRes.data);
        const category = flatCats.find(
          (c: any) => c.id === res.data.category_id,
        );
        if (category) {
          setCategoryName(category.name);
        }
      } catch (error) {
        console.error("Gagal load detail script:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id]);

  const accordionsFlat =
    script?.content?.tabs?.flatMap((t) => t.accordions) || [];
  const trimmedQuery = searchQuery.trim();
  let currentMatchTotal = 0;
  let firstMatchIndex = -1;

  if (trimmedQuery) {
    const matchFlags = accordionsFlat.map((acc) =>
      (acc.title + " " + stripHtml(acc.body_html))
        .toLowerCase()
        .includes(trimmedQuery.toLowerCase()),
    );
    currentMatchTotal = matchFlags.filter(Boolean).length;
    firstMatchIndex = matchFlags.findIndex(Boolean);
  }

  useEffect(() => {
    if (!trimmedQuery || firstMatchIndex === -1) return;

    const t = setTimeout(() => {
      const el = contentRef.current?.querySelector(".search-hit");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
    return () => clearTimeout(t);
  }, [trimmedQuery, firstMatchIndex]);

  // ✅ FIX BACK: state.from -> sessionStorage -> fallback aman
  const handleBackToDashboard = () => {
    // 1) prioritas: dari state
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
    } catch (error) {
      console.warn("Error reading from sessionStorage:", error);
    }

    // 3) fallback aman (hindari navigate(-1) yang bisa no-op)
    navigate("/products", { state: { activeTab: "script" } });
  };

  if (loading)
    return <div className="p-10 text-center">Memuat detail script...</div>;
  if (!script)
    return <div className="p-10 text-center">Script tidak ditemukan.</div>;

  return (
    <>
      <PageMeta title="Detail Script | S2PAS" description="" />

      <div className="flex flex-col gap-6">
        {/* HEADER INFO */}
        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-black dark:text-white">
                  {script.title}
                </h2>

                {script.is_breaking && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
                    Breaking
                  </span>
                )}

                {categoryName && (
                  <span
                    className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                      categoryName === "Informasi"
                        ? "bg-blue-100 text-blue-800"
                        : categoryName === "Request"
                          ? "bg-green-100 text-green-800"
                          : categoryName === "Complaint"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {categoryName}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-500">
                Slug:{" "}
                <span className="font-mono bg-gray-100 px-1 rounded">
                  {script.slug}
                </span>
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleBackToDashboard}
                type="button"
              >
                Kembali
              </Button>

              {isAdmin && (
                <Button onClick={() => navigate(`/scripts/edit/${script.id}`)}>
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Edit Script
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
              Konten Script
            </h3>

            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari di dalam konten script ini..."
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
            {accordionsFlat.length > 0 ? (
              <div className="space-y-4">
                {accordionsFlat.map((acc, k) => (
                  <AccordionItem
                    key={k}
                    title={acc.title}
                    html={acc.body_html}
                    defaultOpen={k === 0}
                    searchQuery={trimmedQuery}
                    forceOpen={k === firstMatchIndex}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Tidak ada konten script.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// --- SUB COMPONENT (SAMA SEPERTI PRODUCT DETAIL) ---
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
        type="button"
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
