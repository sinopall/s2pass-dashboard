import { createContext, useContext, useState, ReactNode } from "react";

const STORAGE_KEY = "s2pas_customer_name";

interface CustomerNameContextValue {
  savedName: string;
  setSavedName: (name: string) => void;
  resetSavedName: () => void;
}

const CustomerNameContext = createContext<CustomerNameContextValue | undefined>(
  undefined,
);

export function CustomerNameProvider({ children }: { children: ReactNode }) {
  const [savedName, setSavedNameState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });

  const setSavedName = (name: string) => {
    setSavedNameState(name);
    try {
      if (name) {
        localStorage.setItem(STORAGE_KEY, name);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore (mis. private browsing / storage penuh)
    }
  };

  const resetSavedName = () => setSavedName("");

  return (
    <CustomerNameContext.Provider
      value={{ savedName, setSavedName, resetSavedName }}
    >
      {children}
    </CustomerNameContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCustomerNameContext() {
  const ctx = useContext(CustomerNameContext);
  if (!ctx) {
    throw new Error(
      "useCustomerNameContext harus dipakai di dalam <CustomerNameProvider>",
    );
  }
  return ctx;
}
