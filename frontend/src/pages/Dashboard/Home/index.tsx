import { useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import axios from "../../../api/axios";
import API from "../../../api/api";

import { PageKey, DetailKind } from "../../../types/home.types";
import { useAgentScripts } from "./../../../hooks/useAgentScripts";
import { useCustomerName } from "./../../../hooks/useCustomerName";
import { useCategoryTree } from "./../../../hooks/useCategoryTree";
import { useDashboardReturn } from "./../../../hooks/useDashboardReturn";

import Toast from "./../../../components/Toast";
import DashboardHeader from "./../../../components/DashboardHeader";
import WizardPage from "./../../../components/WizardPage";
import CategoryPage from "./../../../components/CategoryPage";

// Item yang tampil di layar "list produk/script" pada sebuah leaf category
export interface LeafItem {
  id: number;
  title: string;
  kind: "product" | "script";
}

export default function Home() {
  const navigate = useNavigate();

  // ===== page =====
  const [page, setPage] = useState<PageKey>("wizard");

  // ===== toast =====
  const [toast, setToast] = useState<string>("");
  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 1800);
  };

  // ===== feature hooks =====
  const { isLoading, scripts, handleUpdateScript } = useAgentScripts();
  const {
    customerName,
    setCustomerName,
    savedName,
    setSavedName,
    saveName,
    clearName,
    resetName,
  } = useCustomerName(showToast);

  const {
    catLoading,
    catError,
    catStack,
    setCatStack,
    currentCategoryNode,
    currentButtons,
    breadcrumb,
    isLeafScreen,
    onCategoryClick,
    popCategoryStack,
  } = useCategoryTree();



  const { saveDashboardReturn, clearDashboardReturn } = useDashboardReturn({
    page,
    catStack,
    savedName,
    setSavedName,
    setCatStack,
    setPage,
  });

  // ===== inline detail state (tetap ada, tapi leaf sekarang menampilkan LIST dulu) =====
  const [selectedDetail, setSelectedDetail] = useState<{
    kind: DetailKind;
    id: number;
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  // ===== NEW: state untuk layar "list produk/script" pada leaf category =====
  const [leafItems, setLeafItems] = useState<LeafItem[] | null>(null);
  const [leafCategoryName, setLeafCategoryName] = useState<string>("");

  // ===== Actions =====
  const backToHome = () => {
    setPage("wizard");
    resetName();
    clearDashboardReturn();
    setCatStack([]);
    setSelectedDetail(null);
    setDetailError("");
    setLeafItems(null);
    setLeafCategoryName("");
  };

  // ===== 1 tombol back universal =====
  const handleBack = () => {
    if (selectedDetail) {
      setSelectedDetail(null);
      setDetailError("");
      return;
    }

    // Kalau sedang di layar list produk/script -> kembali ke grid kategori
    if (leafItems) {
      setLeafItems(null);
      setLeafCategoryName("");
      setDetailError("");
      return;
    }

    if (page === "category" && catStack.length > 0) {
      popCategoryStack();
      return;
    }

    if (page === "category") {
      setPage("wizard");
      return;
    }
    // kalau di wizard, biarin (atau reset kalau kamu mau)
  };

  // Bungkus onCategoryClick supaya leafItems ke-reset saat pindah kategori
  const handleCategoryClick = (node: { id: number; name: string }) => {
    setLeafItems(null);
    setLeafCategoryName("");
    setDetailError("");
    onCategoryClick(node as any);
  };

  /**
   * Klik breadcrumb -> loncat langsung ke level itu tanpa perlu Back berkali-kali.
   * index = -1 berarti klik "Home" (kembali ke root kategori).
   * index = 0..n berarti loncat sampai node ke-index di breadcrumb (inklusif).
   */
  const jumpToBreadcrumb = (index: number) => {
    setLeafItems(null);
    setLeafCategoryName("");
    setDetailError("");

    if (index < 0) {
      setCatStack([]);
    } else {
      setCatStack(catStack.slice(0, index + 1));
    }
  };

  /**
   * LEAF CATEGORY DIKLIK:
   * - ambil semua Product & Script untuk categoryId ini
   * - TAMPILKAN SEBAGAI LIST (bukan langsung buka detail item pertama)
   * - detail baru dibuka kalau salah satu item di-klik (lihat onOpenLeafItem)
   */
  const onLeafSelected = async (leaf: { id: number; name: string }) => {
    try {
      setDetailError("");
      setDetailLoading(true);
      setLeafItems(null);

      const [scriptListRes, productListRes] = await Promise.all([
        axios.get(API.scripts.list, {
          params: { page: 1, limit: 50, categoryId: leaf.id },
        }),
        axios.get(API.products.list, {
          params: { page: 1, limit: 50, categoryId: leaf.id },
        }),
      ]);

      const scriptItems: LeafItem[] = (scriptListRes.data?.items || []).map(
        (s: any) => ({
          id: Number(s.id),
          title: s.title,
          kind: "script" as const,
        }),
      );

      const productItems: LeafItem[] = (productListRes.data?.items || []).map(
        (p: any) => ({
          id: Number(p.id),
          title: p.title,
          kind: "product" as const,
        }),
      );

      const combined = [...productItems, ...scriptItems];

      if (combined.length === 0) {
        setDetailError(
          `Tidak ada data Product/Script untuk kategori "${leaf.name}".`,
        );
        return;
      }

      setLeafCategoryName(leaf.name);
      setLeafItems(combined);
    } catch {
      setDetailError("Gagal membuka daftar produk/script.");
    } finally {
      setDetailLoading(false);
    }
  };

  /**
   * Dipanggil saat salah satu item di layar list produk/script diklik.
   * Baru di sini kita navigate ke halaman detail sesuai jenisnya.
   */
  const onOpenLeafItem = (item: LeafItem) => {
    const from =
      window.location.pathname + window.location.search + window.location.hash;

    saveDashboardReturn();

    const path =
      item.kind === "script"
        ? `/scripts/view/${item.id}`
        : `/products/view/${item.id}`;

    navigate(path, { state: { from } });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Memuat dashboard...
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="S2PASS | Dashboard"
        description="Dashboard utama S2PASS - Wizard & Dynamic Category Navigation"
      />

      <Toast message={toast} />

      <div className="space-y-4">
        <DashboardHeader
          savedName={savedName}
          onBack={handleBack}
          onReset={backToHome}
        />

        {/* ===== Main container ===== */}
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
          {page === "wizard" && (
            <WizardPage
              // savedName={savedName}
              scripts={scripts}
              handleUpdateScript={handleUpdateScript}
              customerName={customerName}
              setCustomerName={setCustomerName}
              saveName={saveName}
              clearName={clearName}
              setPage={setPage}
              onBack={handleBack}
            />
          )}

          {page === "category" && (
            <CategoryPage
              catStack={catStack}
              breadcrumb={breadcrumb}
              catLoading={catLoading}
              catError={catError}
              detailLoading={detailLoading}
              detailError={detailError}
              isLeafScreen={isLeafScreen}
              currentCategoryNode={currentCategoryNode}
              currentButtons={currentButtons}
              onLeafSelected={onLeafSelected}
              onCategoryClick={handleCategoryClick}
              onBack={handleBack}
              leafItems={leafItems}
              leafCategoryName={leafCategoryName}
              onOpenLeafItem={onOpenLeafItem}
              onBreadcrumbClick={jumpToBreadcrumb}
            />
          )}
        </div>
      </div>
    </>
  );
}
