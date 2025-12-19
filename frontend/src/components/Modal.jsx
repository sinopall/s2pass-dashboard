export function Modal({ open, title, subtitle, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-r from-bjb-navy to-slate-900 text-white">
          <div className="text-lg font-semibold">{title}</div>
          {subtitle && <div className="mt-1 text-xs text-white/80">{subtitle}</div>}
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
