// src/lib/s2pas.js

export const S2PAS = {
  // customer name
  LS_NAME: "s2pas_customer_name",
  LS_NAME_SAVED_AT: "s2pas_customer_name_saved_at",

  // where to return when opening product detail
  LS_RETURN_TO: "s2pas_return_to",

  getName() {
    return localStorage.getItem(this.LS_NAME) || "";
  },
  setName(name) {
    const n = (name || "").trim();
    localStorage.setItem(this.LS_NAME, n);
    localStorage.setItem(this.LS_NAME_SAVED_AT, String(Date.now()));
  },
  clearName() {
    localStorage.removeItem(this.LS_NAME);
    localStorage.removeItem(this.LS_NAME_SAVED_AT);
  },
  getSavedAt() {
    const v = localStorage.getItem(this.LS_NAME_SAVED_AT);
    return v ? Number(v) : 0;
  },

  setReturnTo(path) {
    localStorage.setItem(this.LS_RETURN_TO, path || "/s2pas/nav");
  },
  getReturnTo() {
    return localStorage.getItem(this.LS_RETURN_TO) || "/s2pas/nav";
  },
};
