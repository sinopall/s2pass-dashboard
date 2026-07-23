import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "react-toastify";
import axios from "../../../api/axios";
import API from "../../../api/api";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";

interface Product {
  id: number;
  title: string;
  slug: string;
  category_id: number;
  is_breaking: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await axios.get(API.products.list, {
        params: { page: 1, limit: 50 },
      });
      setItems(res.data.items || []);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error ?? "Gagal memuat daftar produk.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: number, title: string) {
    if (
      !window.confirm(
        `Hapus produk "${title}"? Tindakan tidak bisa dibatalkan.`,
      )
    )
      return;

    const deletePromise = axios.delete(API.products.delete(id));

    await toast.promise(deletePromise, {
      pending: "Menghapus produk...",
      success: "Produk berhasil dihapus.",
      error: {
        render({ data }: any) {
          return data?.response?.data?.error ?? "Gagal menghapus produk.";
        },
      },
    });

    await load();
  }

  return (
    <>
      <PageBreadcrumb pageTitle="Product Management" />

      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              Daftar Produk
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Buat, edit, dan hapus produk knowledge base.
            </p>
          </div>
          <Link
            to="/knowledge-base/products/create"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            Buat Produk
          </Link>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-500 border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Belum ada produk.
              </p>
              <Link
                to="/knowledge-base/products/create"
                className="mt-3 inline-block text-sm font-semibold text-brand-500 hover:underline"
              >
                + Buat produk pertama
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Judul
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Slug
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Diperbarui
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {items.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {p.title}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <code className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          {p.slug}
                        </code>
                      </td>
                      <td className="px-5 py-4">
                        {p.is_breaking ? (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                            Breaking
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-200">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                        {new Date(p.updated_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/knowledge-base/products/edit/${p.id}`}
                            className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 transition-colors"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(p.id, p.title)}
                            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 transition-colors"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
