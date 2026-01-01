import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "../../../api/axios";
import API from "../../../api/api";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import { PencilIcon, ChevronDownIcon } from "../../../icons";

// Type definitions (sesuaikan dengan API)
interface Accordion { title: string; body_html: string; }
interface Tab { title: string; accordions: Accordion[]; }
interface ProductDetailData {
  id: number;
  title: string;
  slug: string;
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

  useEffect(() => {
    const storedData = localStorage.getItem("user_data");
    if (storedData) {
      try {
        const user = JSON.parse(storedData);
        setIsAdmin(user.role === 'admin');
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
      } catch (error) {
        console.error("Gagal load detail:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id]);

  if (loading) return <div className="p-10 text-center">Memuat detail produk...</div>;
  if (!product) return <div className="p-10 text-center">Produk tidak ditemukan.</div>;

  return (
    <>
      <div className="flex flex-col gap-6">
        
        {/* HEADER INFO */}
        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                 <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-black dark:text-white">{product.title}</h2>
                    {product.is_breaking && (
                       <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">Breaking</span>
                    )}
                 </div>
                 <p className="text-sm text-gray-500">Slug: <span className="font-mono bg-gray-100 px-1 rounded">{product.slug}</span></p>
              </div>
              <div className="flex gap-3">
                 <Button variant="outline" onClick={() => navigate(-1)}>Kembali</Button>
                 {isAdmin && (
                  <Button onClick={() => navigate(`/knowledge-base/products/edit/${product.id}`)}>
                      <PencilIcon className="w-4 h-4 mr-2"/> Edit Produk
                  </Button>
                 )}
              </div>
           </div>
        </div>

        {/* PREVIEW CONTENT (TABS & ACCORDION) */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
           <div className="border-b border-stroke py-4 px-6 dark:border-strokedark">
              <h3 className="font-semibold text-black dark:text-white">Konten Produk</h3>
           </div>
           
           <div className="p-6">
              {/* TAB NAVIGATION */}
              {product.content.tabs && product.content.tabs.length > 0 ? (
                <>
                  <div className="flex border-b border-gray-200 dark:border-strokedark mb-6 overflow-x-auto">
                      {product.content.tabs.map((tab, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveTab(idx)}
                            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                activeTab === idx 
                                ? "border-primary text-primary" 
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            {tab.title}
                        </button>
                      ))}
                  </div>

                  {/* TAB CONTENT (ACCORDION LIST) */}
                  <div className="space-y-4">
                      {product.content.tabs[activeTab].accordions.map((acc, k) => (
                          <AccordionItem key={`${activeTab}-${k}`} title={acc.title} html={acc.body_html} defaultOpen={activeTab === 0}/>
                      ))}
                      {product.content.tabs[activeTab].accordions.length === 0 && (
                          <p className="text-gray-500 italic">Tidak ada accordion di tab ini.</p>
                      )}
                  </div>
                </>
              ) : (
                  <p className="text-gray-500">Tidak ada konten tab.</p>
              )}
           </div>
        </div>
      </div>
    </>
  );
}

// Sub-component untuk Accordion Preview (Simple Toggle)
const AccordionItem = ({ title, html, defaultOpen = false }: { title: string, html: string, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-stroke rounded dark:border-strokedark overflow-hidden">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 dark:bg-meta-4 dark:hover:bg-meta-4/80 transition"
            >
                <span className="font-medium text-black dark:text-white">{title}</span>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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