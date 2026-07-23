import Button from "./ui/button/Button";
import { InlineScriptEditor } from "./common/InlineScriptEditor";
import { ScriptContent } from "../types/script.types";
import { PageKey } from "../types/home.types";
import { IconReset } from "./Icons";

interface Props {
  // savedName: string | "";
  scripts: ScriptContent | null;
  handleUpdateScript: (
    stepKey: keyof ScriptContent["flow_steps"],
    newText: string,
  ) => Promise<void>;
  customerName: string;
  setCustomerName: (v: string) => void;
  saveName: () => void;
  clearName: () => void;
  setPage: (v: PageKey) => void;
  onBack: () => void;
}

export default function WizardPage({
  // savedName,
  scripts,
  handleUpdateScript,
  customerName,
  setCustomerName,
  saveName,
  clearName,
  setPage,
  onBack,
}: Props) {
  return (
    <>
      <div className="mb-4 rounded-2xl border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-boxdark-2">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-bold text-black dark:text-white">
              Flow Awal Agent
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Greeting → Konfirmasi Nama → Konfirmasi Permasalahan → Empathy
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 md:mt-0">
            <button
              type="button"
              onClick={() => setPage("wizard")}
              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 dark:bg-boxdark dark:text-gray-200 dark:ring-white/10"
            >
              Wizard
            </button>
            <button
              type="button"
              onClick={() => setPage("category")}
              className="rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white ring-1 ring-brand-500 hover:opacity-95"
            >
              Kategori →
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <InlineScriptEditor
          title="1) Greeting"
          initialContent={scripts?.flow_steps.greetings || ""}
          onSave={(newContent) => handleUpdateScript("greetings", newContent)}
        />
        <InlineScriptEditor
          title="2) Konfirmasi Nama"
          initialContent={scripts?.flow_steps.identity_confirmation || ""}
          onSave={(newContent) =>
            handleUpdateScript("identity_confirmation", newContent)
          }
        >
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <input
                className="w-full rounded-xl border border-stroke bg-transparent px-4 py-3 text-sm outline-none focus:border-brand-500 dark:border-strokedark"
                placeholder="Masukkan nama nasabah..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                className="w-full"
                onClick={saveName}
                disabled={!customerName.trim()}
              >
                Save Nama
              </Button>

              <Button variant="outline" className="w-full" onClick={clearName}>
                <span className="mr-2 inline-flex items-center">
                  <IconReset className="h-4 w-4" />
                </span>
                Clear
              </Button>
            </div>
          </div>
        </InlineScriptEditor>

        <InlineScriptEditor
          title="3) Konfirmasi Permasalahan"
          initialContent={scripts?.flow_steps.issue_confirmation || ""}
          onSave={(newContent) =>
            handleUpdateScript("issue_confirmation", newContent)
          }
        />

        <InlineScriptEditor
          title="4) Empathy"
          initialContent={scripts?.flow_steps.empathy || ""}
          onSave={(newContent) => handleUpdateScript("empathy", newContent)}
        />
      </div>

      {/* Footer wizard */}
      <div className="sticky bottom-3 mt-6 rounded-2xl border border-stroke bg-white/95 p-4 shadow-md backdrop-blur dark:border-strokedark dark:bg-boxdark/90">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>

          <Button
            onClick={() => setPage("category")}
            // disabled={!savedName.trim()}
          >
            Next → Kategori
          </Button>
        </div>
      </div>
    </>
  );
}
