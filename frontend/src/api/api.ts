export default {
  auth: {
    me: '/auth/me',
    login: '/auth/login',
  },
  categories: {
    tree: '/categories/tree',
    children: '/categories/children',
    path: '/categories/path',
  },
  products: {
    list: '/products', 
    detail: (id: number) => `/products/${id}`,
  },
  scripts: {
    list: "/scripts",
    detail: (id: number) => `/scripts/${id}`,
  },
  users: {
    list: "/users",
    detail: (id: number) => `/users/${id}`,
  }
};