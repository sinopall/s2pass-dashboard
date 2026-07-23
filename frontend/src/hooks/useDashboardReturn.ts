import { useEffect } from "react";
import { PageKey } from "./../types/home.types";
import { DASH_RETURN_KEY } from "../constants/constants";

interface Params {
  page: PageKey;
  catStack: number[];
  savedName: string;
  setSavedName: (v: string) => void;
  setCatStack: (v: number[]) => void;
  setPage: (v: PageKey) => void;
}

export function useDashboardReturn({
  page,
  catStack,
  savedName,
  setSavedName,
  setCatStack,
  setPage,
}: Params) {
  // ===== Restore dashboard return (kalau balik dari detail) =====
  useEffect(() => {
    const raw = sessionStorage.getItem(DASH_RETURN_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data?.savedName) setSavedName(data.savedName);
      if (Array.isArray(data?.catStack)) setCatStack(data.catStack);
      if (data?.page === "category") setPage("category");
    } catch (error) {
      console.error(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveDashboardReturn = () => {
    sessionStorage.setItem(
      DASH_RETURN_KEY,
      JSON.stringify({
        returnPath:
          window.location.pathname +
          window.location.search +
          window.location.hash,
        page,
        catStack,
        savedName,
      }),
    );
  };

  const clearDashboardReturn = () => {
    sessionStorage.removeItem(DASH_RETURN_KEY);
  };

  return { saveDashboardReturn, clearDashboardReturn };
}
