// src/api/scriptApi.ts
import axiosInstance from "./axios";
import { ScriptModel, ScriptContent } from "../types/script.types";

// Mengambil script milik agent yang sedang login
export const fetchMyScript = async (): Promise<ScriptModel> => {
  const response = await axiosInstance.get("/scripts/my-script");
  return response.data.data; // Sesuaikan dengan standar response formatter Go Anda
};

// Menyimpan/Update script
// Kita hanya mengirim kolom `content` (JSON) ke backend
export const updateMyScriptContent = async (
  newContent: ScriptContent,
): Promise<ScriptModel> => {
  const response = await axiosInstance.put("/scripts/my-script", {
    content: newContent,
  });
  return response.data.data;
};
