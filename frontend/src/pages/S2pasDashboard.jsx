import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";
import { S2PAS } from "../lib/s2pas";

function AccItem({ title, open, onToggle, children }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 bg-slate-50 border-b border-slate-200"
      >
        <span className="h-9 w-9 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </span>
        <div className="text-left">
          <div className="font-bold text-slate-900">{title}</div>
          <div className="text-xs text-slate-500">Klik untuk buka / tutup</div>
        </div>
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

export function S2pasDashboard() {
  const nav = useNavigate();
  const [openIdx, setOpenIdx] = useState(0);

  const [greeting, setGreeting] = useState(
    "Hai! Selamat datang di WhatsApp resmi bank bjb. Ada yang bisa kami bantu?"
  );
  const [askName, setAskName] = useState("Boleh dibantu nama lengkapnya ya, Bapak/Ibu?");
  const [problem, setProblem] = useState("Baik, permasalahannya terkait apa ya? Silakan pilih menu di bawah.");
  const [empathy, setEmpathy] = useState("Baik, mohon maaf atas ketidaknyamanannya. Saya bantu arahkan ya.");

  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const n = S2PAS.getName();
    setName(n);
    setSaved(!!n);
  }, []);

  function saveName() {
    const n = name.trim();
    if (!n) return;
    S2PAS.setName(n);
    setSaved(true);
    window.dispatchEvent(new Event("s2pas:name"));
  }

  function resetName() {
    S2PAS.clearName();
    setName("");
    setSaved(false);
    window.dispatchEvent(new Event("s2pas:name"));
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="text-2xl font-bold text-slate-900">Dashboard S2PAS</div>
        <div className="mt-1 text-sm text-slate-500">
          Flow script agent (accordion) + simpan nama nasabah + lanjut ke navigasi kategori.
        </div>
      </div>

      <div className="space-y-4">
        <AccItem
          title="1) Greeting"
          open={openIdx === 0}
          onToggle={() => setOpenIdx(openIdx === 0 ? -1 : 0)}
        >
          <div className="text-xs font-semibold text-slate-700">Script Greeting</div>
          <textarea className="input mt-2 h-28" value={greeting} onChange={(e) => setGreeting(e.target.value)} />
        </AccItem>

        <AccItem
          title="2) Input Nama Nasabah"
          open={openIdx === 1}
          onToggle={() => setOpenIdx(openIdx === 1 ? -1 : 1)}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-slate-700">Script tanya nama</div>
              <textarea className="input mt-2 h-28" value={askName} onChange={(e) => setAskName(e.target.value)} />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-700">Nama nasabah (tersimpan)</div>
              <input
                className="input mt-2"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSaved(false);
                }}
                placeholder="contoh: Raka"
              />

              <div className="mt-3 flex gap-2">
                <button type="button" onClick={saveName} className="btn-primary">
                  Save
                </button>
                <button type="button" onClick={resetName} className="btn-ghost bg-white border border-slate-200">
                  Reset
                </button>
              </div>

              <div className="mt-3">
                {saved ? (
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 size={16} />
                    Saved — muncul di top bar
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">
                    Isi nama lalu klik <b>Save</b>.
                  </div>
                )}
              </div>
            </div>
          </div>
        </AccItem>

        <AccItem
          title="3) Menanyakan Permasalahan"
          open={openIdx === 2}
          onToggle={() => setOpenIdx(openIdx === 2 ? -1 : 2)}
        >
          <div className="text-xs font-semibold text-slate-700">Script</div>
          <textarea className="input mt-2 h-28" value={problem} onChange={(e) => setProblem(e.target.value)} />
        </AccItem>

        <AccItem
          title="4) Empathy"
          open={openIdx === 3}
          onToggle={() => setOpenIdx(openIdx === 3 ? -1 : 3)}
        >
          <div className="text-xs font-semibold text-slate-700">Script Empathy</div>
          <textarea className="input mt-2 h-28" value={empathy} onChange={(e) => setEmpathy(e.target.value)} />
        </AccItem>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={() => nav("/s2pas/nav")} className="btn-primary">
          Next → Pilih Menu (Dynamic)
        </button>
      </div>
    </div>
  );
}
