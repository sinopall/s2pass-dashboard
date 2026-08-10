import axios from "axios";

const baseURL = "/api";

const apiInstance = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config.url;
      if (requestUrl && requestUrl.includes("login")) {
        return Promise.reject(error);
      }

      // Simpan alasan redirect supaya kelihatan di halaman signin
      // (window.location.href di bawah ini reload total & akan
      // membersihkan console/network log kalau "Preserve log" tidak aktif)
      console.error(
        `[401] Request ke "${requestUrl}" ditolak, sesi dianggap tidak valid. Redirect ke /signin.`,
        error.response.data,
      );
      sessionStorage.setItem(
        "auth_redirect_reason",
        `Sesi berakhir saat memanggil ${requestUrl}: ${error.response.data?.error ||
        error.response.data?.message ||
        "unauthorized"
        }`,
      );

      localStorage.removeItem("access_token");
      localStorage.removeItem("user_data");
      window.location.href = "/signin";
      return Promise.reject(error);
    }
    return Promise.reject(error);
  },
);

export default apiInstance;
