import { createContext, useContext, useMemo, useState } from "react";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function push(type, title, message) {
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    setToasts((p) => [...p, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((p) => p.filter((t) => t.id !== id));
    }, 2800);
  }

  const api = useMemo(
    () => ({
      success: (title, message) => push("success", title, message),
      error: (title, message) => push("error", title, message),
      info: (title, message) => push("info", title, message),
    }),
    []
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}

      <div className="fixed right-5 top-5 z-[9999] space-y-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`w-[340px] rounded-2xl border bg-white shadow-lg p-4 ${
              t.type === "success"
                ? "border-emerald-200"
                : t.type === "error"
                ? "border-red-200"
                : "border-slate-200"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">{t.title}</div>
                {t.message && <div className="mt-1 text-xs text-slate-600">{t.message}</div>}
              </div>
              <span
                className={`mt-1 inline-flex h-2 w-2 rounded-full ${
                  t.type === "success" ? "bg-emerald-500" : t.type === "error" ? "bg-red-500" : "bg-slate-500"
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
