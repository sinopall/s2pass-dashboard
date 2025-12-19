export const auth = {
  get token() {
    return localStorage.getItem("access_token");
  },
  setToken(t) {
    localStorage.setItem("access_token", t);
  },
  clear() {
    localStorage.removeItem("access_token");
  },
};
