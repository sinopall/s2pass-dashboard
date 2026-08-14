import Button from "./ui/button/Button";

import { IconPhone } from "./Icons";

interface Props {
  savedName: string;
  onBack: () => void;
  onReset: () => void;
}

export default function DashboardHeader({ savedName, onBack, onReset }: Props) {
  return (
    <div className="sticky top-0 z-40 rounded-2xl border border-stroke bg-white/90 p-4 shadow-sm backdrop-blur dark:border-strokedark dark:bg-boxdark/85">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-lg font-bold tracking-tight text-black dark:text-white">
            S2PASS
          </div>

          <div className="hidden md:block h-6 w-px bg-gray-200 dark:bg-white/10" />

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-300">
              Nasabah:
            </span>

            <span
              className={`inline-flex max-w-[60vw] items-center truncate rounded-full px-4 py-2 text-sm font-extrabold ring-1 ${
                savedName
                  ? "bg-brand-50 text-brand-700 ring-brand-200 dark:bg-white/5 dark:text-white dark:ring-white/10"
                  : "bg-gray-50 text-gray-600 ring-gray-200 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10"
              }`}
              title={savedName || ""}
            >
              {savedName ? savedName : "Belum disimpan"}
            </span>
          </div>
        </div>

        {/* reset + back universal */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* 1 tombol back universal */}
          <Button
            variant="outline"
            onClick={onBack}
            className="w-full sm:w-auto"
          >
            Back
          </Button>

          {/* Reset merah */}
          <Button
            onClick={onReset}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white border border-red-600 hover:border-red-700"
          >
            <span className="mr-2 inline-flex items-center">
              <IconPhone className="h-4 w-4" />
            </span>
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
