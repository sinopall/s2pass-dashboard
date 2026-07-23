import { useState } from "react";
import { useCustomerNameContext } from "../context/CustomerNameContext";

export function useCustomerName(showToast: (msg: string) => void) {
  const { savedName, setSavedName, resetSavedName } = useCustomerNameContext();

  // customerName = draft yang sedang diketik di input, cukup lokal per-halaman
  const [customerName, setCustomerName] = useState(savedName || "");

  const saveName = () => {
    const v = customerName.trim();
    if (!v) return;
    setSavedName(v);
    showToast("✅ Nama nasabah tersimpan");
  };

  const clearName = () => {
    setCustomerName("");
    resetSavedName();
    showToast("🧹 Nama dibersihkan");
  };

  const resetName = () => {
    setCustomerName("");
    resetSavedName();
  };

  return {
    customerName,
    setCustomerName,
    savedName,
    setSavedName,
    saveName,
    clearName,
    resetName,
  };
}
