import { RootType } from "../types/home.types";
import { ScriptContent } from "../types/script.types";

// ===== Return key (buat balik dari detail) =====
export const DASH_RETURN_KEY = "s2pass_dash_return_v1";

export const defaultScripts: ScriptContent = {
  flow_steps: {
    greetings:
      "Selamat pagi/siang/sore, dengan Bank bjb. Saya [nama agent], ada yang bisa saya bantu?",
    identity_confirmation:
      "Baik Bapak/Ibu, mohon konfirmasi nama lengkapnya ya.",
    issue_confirmation: "Baik, boleh dijelaskan kendalanya seperti apa?",
    empathy:
      "Baik Bapak/Ibu, mohon maaf atas ketidaknyamanannya. Saya bantu cek ya.",
  },
};

export const rootOrder: RootType[] = ["Informasi", "Request", "Complaint"];
