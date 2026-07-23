export interface ScriptContent {
  flow_steps: {
    greetings: string;
    identity_confirmation: string;
    issue_confirmation: string;
    empathy: string;
    [key: string]: string; // Membuka kemungkinan jika ada step dinamis
  };
}

export interface ScriptModel {
  id: number;
  user_id: number;
  title: string;
  category_id: number;
  content: ScriptContent; // Tipe data object yang aman!
}
