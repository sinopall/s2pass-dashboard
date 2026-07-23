export default {
  auth: {
    me: "/auth/me",
    login: "/auth/login",
  },
  categories: {
    tree: "/categories/tree",
    children: "/categories/children",
    path: "/categories/path",
    rename: (id: number) => `/categories/${id}`,
    delete: (id: number) => `/categories/${id}`,
  },
  products: {
    list: "/products",
    create: "/products",
    detail: (id: number) => `/products/${id}`,
    update: (id: number) => `/products/${id}`,
    delete: (id: number) => `/products/${id}`,
    updateStatus: (id: number) => `/products/${id}/status`,
    attachments: (id: number) => `/products/${id}/attachments`,
    attachmentsLink: (id: number) => `/products/${id}/attachments/link`,
    deleteAttachment: (id: number) => `/products/attachments/${id}`,
  },
  scripts: {
    list: "/scripts",
    detail: (id: number) => `/scripts/${id}`,
  },
  users: {
    list: "/users",
    detail: (id: number) => `/users/${id}`,
  },
};
