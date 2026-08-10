import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        // This will transform your SVG to a React component
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  server: {
    // --- SEMENTARA untuk tunnel (ngrok/cloudflare) saat upload data bareng ---
    // host: true membuat Vite dev server bisa diakses dari luar (bukan cuma localhost),
    // dan allowedHosts: true mematikan validasi Host header Vite yang biasanya
    // menolak request dari domain tunnel (*.ngrok-free.app, dsb).
    // HAPUS/comment 2 baris ini lagi kalau proses upload data sudah selesai.
    host: true,
    allowedHosts: true,

    proxy: {
      "/api": {
        target: "http://localhost:8080", // Sesuaikan dengan port Backend Go kamu
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
