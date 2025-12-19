import { Link } from "react-router-dom";

export function BreakingTicker({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="rounded-2xl bg-bjb-navy text-white overflow-hidden border border-white/10">
      <div className="flex items-center">
        <div className="shrink-0 px-4 py-3 bg-bjb-gold text-bjb-navy font-bold text-sm">
          BREAKING
        </div>

        <div className="relative w-full overflow-hidden">
          <div className="ticker whitespace-nowrap will-change-transform">
            {items.concat(items).map((x, idx) => (
              <Link
                key={`${x.id}-${idx}`}
                to={`/products/${x.id}`}
                className="mx-6 inline-block text-sm hover:underline"
              >
                {x.title}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .ticker {
          display: inline-block;
          padding: 12px 0;
          animation: ticker 22s linear infinite;
        }
        @keyframes ticker {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
