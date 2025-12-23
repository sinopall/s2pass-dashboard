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
  }
};