import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ProductList from "../Product/ProductList";
import ScriptList from "../Script/ScriptList";

export default function KnowledgeBasePage() {
  const location = useLocation();
  const initialTab = location.state?.activeTab || 'product';
  const [activeTab, setActiveTab] = useState<'product' | 'script'>(initialTab);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  return (
    <>
      {/* Tab Header */}
      <div className="mb-6 flex gap-4 border-b border-stroke dark:border-strokedark bg-white dark:bg-boxdark px-4 pt-4 rounded-t-sm">
        <button
          onClick={() => setActiveTab('product')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition ${
            activeTab === 'product' ? 'border-primary text-primary' : 'border-transparent text-gray-500'
          }`}
        >
          Produk Layanan
        </button>
        <button
          onClick={() => setActiveTab('script')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition ${
            activeTab === 'script' ? 'border-primary text-primary' : 'border-transparent text-gray-500'
          }`}
        >
          Script Agent
        </button>
      </div>

      {/* Content */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'product' ? <ProductList /> : <ScriptList />}
      </div>
    </>
  );
}