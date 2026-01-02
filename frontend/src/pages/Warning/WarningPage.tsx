import { useEffect, useMemo, useState } from "react";

// ✅ ambil gambar dari folder yang kamu sebut
const KakFayImg = new URL("../../components/ui/images/kak-fay.jpeg", import.meta.url).href;
const MasIyanImg = new URL("../../components/ui/images/mas-iyan.jpg", import.meta.url).href;
const PaAndiImg = new URL("../../components/ui/images/pa-andi.jpeg", import.meta.url).href;
const PaFerdyImg = new URL("../../components/ui/images/pa-ferdy.jpeg", import.meta.url).href;
const ADaniImg = new URL("../../components/ui/images/a-dani.jpeg", import.meta.url).href;

type Person = {
  key: string;
  name: string;
  role?: string;
  quote: string;
  img: string;
};

export default function WarningPage() {
  const people: Person[] = useMemo(
    () => [
      { key: "kak-fay", name: "Kak Fay", role: "Manager Operations", quote: "Udah diapain tuh anak , SP aja anaknya", img: KakFayImg },
      { key: "mas-iyan", name: "Mas Iyan", role: "Asisten Manager", quote: "Di monit terus ya kang anaknya, atau BATL aja sekalian", img: MasIyanImg },
      { key: "pa-andi", name: "Pa Andi", role: "SPV", quote: "HMMM...", img: PaAndiImg },
      { key: "pa-ferdy", name: "Pa Ferdy", role: "TL", quote: "Kok bisa ada finding?", img: PaFerdyImg },
      { key: "a-dani", name: "A Dani", role: "QC", quote: "Apasih…", img: ADaniImg },
    ],
    []
  );

  const [idx, setIdx] = useState(0);
  const total = people.length;

  const mod = (n: number) => (n + total) % total;
  const goPrev = () => setIdx((p) => mod(p - 1));
  const goNext = () => setIdx((p) => mod(p + 1));

  // Keyboard support: ← →
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // indeks untuk 5 kartu (2 kiri, tengah, 2 kanan)
  const iM2 = mod(idx - 2);
  const iM1 = mod(idx - 1);
  const i0 = mod(idx);
  const iP1 = mod(idx + 1);
  const iP2 = mod(idx + 2);

  const slots = [
    { slot: "farLeft" as const, person: people[iM2], onClick: () => setIdx(iM2) },
    { slot: "left" as const, person: people[iM1], onClick: () => setIdx(iM1) },
    { slot: "center" as const, person: people[i0], onClick: () => {} },
    { slot: "right" as const, person: people[iP1], onClick: () => setIdx(iP1) },
    { slot: "farRight" as const, person: people[iP2], onClick: () => setIdx(iP2) },
  ];

  const active = people[i0];

  return (
    <div className="min-h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="mb-5 rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xl font-bold text-black dark:text-white">⚠️ Warning</div>
            <div className="text-sm text-gray-500 dark:text-gray-300">
              Carousel motivasi (klik poster / panah / keyboard ← →)
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              className="rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-strokedark dark:bg-boxdark-2 dark:text-gray-200 dark:hover:bg-meta-4"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Stage */}
      <div className="relative overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-boxdark">
        {/* background soft */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand-200/60 blur-3xl dark:bg-brand-500/20" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-red-200/60 blur-3xl dark:bg-red-500/20" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/10 dark:from-black/10 dark:to-black/20" />
        </div>

        <div className="relative p-5 sm:p-6">
          {/* Top info */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                ALERT
              </span>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {idx + 1} / {total}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-300">
              <span className="rounded-full bg-white/70 px-3 py-1 ring-1 ring-gray-200/70 backdrop-blur dark:bg-white/5 dark:ring-white/10">
                Klik poster kiri/kanan
              </span>
              <span className="rounded-full bg-white/70 px-3 py-1 ring-1 ring-gray-200/70 backdrop-blur dark:bg-white/5 dark:ring-white/10">
                Keyboard ← →
              </span>
            </div>
          </div>

          {/* COVERFLOW */}
          <div className="relative mx-auto h-[420px] w-full max-w-6xl sm:h-[520px]">
            {/* arrows overlay (desktop feel) */}
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-0 top-1/2 z-30 -translate-y-1/2 rounded-full bg-white/70 p-3 text-gray-800 shadow hover:bg-white dark:bg-black/30 dark:text-white"
              aria-label="Previous"
              title="Previous"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-0 top-1/2 z-30 -translate-y-1/2 rounded-full bg-white/70 p-3 text-gray-800 shadow hover:bg-white dark:bg-black/30 dark:text-white"
              aria-label="Next"
              title="Next"
            >
              ›
            </button>

            {/* cards */}
            <div className="absolute inset-0 flex items-center justify-center">
              {slots.map(({ slot, person, onClick }) => (
                <CoverCard
                  key={`${slot}-${person.key}`}
                  slot={slot}
                  person={person}
                  onClick={onClick}
                  isActive={slot === "center"}
                />
              ))}
            </div>
          </div>

          {/* Caption / Big quote */}
          <div className="mt-5 rounded-2xl border border-stroke bg-white/70 p-4 backdrop-blur dark:border-strokedark dark:bg-white/5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {active.name} {active.role ? <span className="text-gray-400">• {active.role}</span> : null}
                </div>
                <div className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-black dark:text-white sm:text-3xl">
                  “{active.quote}”
                </div>
              </div>

              <div className="mt-3 flex gap-2 sm:mt-0">
                {people.map((p, i) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setIdx(i)}
                    className={`h-2.5 rounded-full transition-all ${
                      i === idx ? "w-10 bg-brand-500" : "w-2.5 bg-gray-300 dark:bg-gray-600"
                    }`}
                    aria-label={`Go to ${p.name}`}
                    title={p.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Card style: coverflow poster */
function CoverCard({
  slot,
  person,
  onClick,
  isActive,
}: {
  slot: "farLeft" | "left" | "center" | "right" | "farRight";
  person: Person;
  onClick: () => void;
  isActive: boolean;
}) {
  // posisi & transform ala “National Geographic carousel”
  const styleBySlot: Record<
    typeof slot,
    { z: string; transform: string; opacity: string; blur: string; pointer: boolean }
  > = {
    farLeft: {
      z: "z-10",
      transform: "translateX(-320px) rotateY(55deg) scale(0.72)",
      opacity: "opacity-30",
      blur: "blur-[2px]",
      pointer: true,
    },
    left: {
      z: "z-20",
      transform: "translateX(-190px) rotateY(40deg) scale(0.82)",
      opacity: "opacity-60",
      blur: "blur-[1px]",
      pointer: true,
    },
    center: {
      z: "z-30",
      transform: "translateX(0px) rotateY(0deg) scale(1)",
      opacity: "opacity-100",
      blur: "blur-0",
      pointer: false,
    },
    right: {
      z: "z-20",
      transform: "translateX(190px) rotateY(-40deg) scale(0.82)",
      opacity: "opacity-60",
      blur: "blur-[1px]",
      pointer: true,
    },
    farRight: {
      z: "z-10",
      transform: "translateX(320px) rotateY(-55deg) scale(0.72)",
      opacity: "opacity-30",
      blur: "blur-[2px]",
      pointer: true,
    },
  };

  const s = styleBySlot[slot];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute ${s.z} transition-all duration-500 ease-out [transform-style:preserve-3d]`}
      style={{
        transform: s.transform,
        opacity: undefined, // kita pakai class
      }}
      aria-label={person.name}
      title={person.name}
      disabled={isActive} // center tidak clickable
    >
      <div
        className={[
          "relative h-[320px] w-[220px] sm:h-[400px] sm:w-[270px]",
          "overflow-hidden rounded-xl shadow-2xl",
          "ring-1 ring-black/10 dark:ring-white/10",
          s.opacity,
          s.blur,
          isActive ? "" : "cursor-pointer",
        ].join(" ")}
        style={{ opacity: undefined }}
      >
        {/* full image */}
        <img src={person.img} alt={person.name} className="h-full w-full object-cover" />

        {/* overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* title / quote overlay (besar di poster center) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
          <div className="text-sm font-bold text-white/90">{person.name}</div>
          <div className="mt-2 text-base font-extrabold leading-snug text-white sm:text-lg">
            {isActive ? (
              <span className="text-2xl sm:text-3xl tracking-tight">“{person.quote}”</span>
            ) : (
              <span className="line-clamp-2">“{person.quote}”</span>
            )}
          </div>
        </div>

        {/* tiny badge on active */}
        {isActive && (
          <div className="absolute left-3 top-3 rounded-full bg-yellow-400 px-3 py-1 text-xs font-extrabold text-black shadow">
            WARNING
          </div>
        )}
      </div>
    </button>
  );
}
