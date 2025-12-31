import { useEffect, useState } from "react";
import { useNavigate } from "react-router"; 
import axios from "../../api/axios";
import API from "../../api/api";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";
import { PencilIcon, TrashBinIcon, PlusIcon, ChevronDownIcon } from "../../icons"; 
import { toast } from 'react-toastify';
import ConfirmationModal from "../../components/ui/modal/ConfirmationModal";
import UserFormModal from "../../components/ui/modal/UserFormModal";

interface User {
  id: number;
  username: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export default function UserList() {
  const navigate = useNavigate();

  // --- STATE ---
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- STATE MODAL FORM ---
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<{ id: number; username: string } | null>(null);
  
  // Filter & Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("agent"); 
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalData, setTotalData] = useState(0);

  const openDeleteModal = (id: number) => {
    setDeleteTargetId(id);
    setIsDeleteModalOpen(true);
  };

  const handleCreate = () => {
      setEditingUser(null); // Mode Create
      setIsFormModalOpen(true);
  };

  const handleEdit = (user: User) => {
      setEditingUser({ id: user.id, username: user.username }); // Mode Edit
      setIsFormModalOpen(true);
  };

  // --- 1. DEBOUNCE SEARCH ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset ke halaman 1 jika search berubah
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- 2. FETCH USERS ---
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: page,
        limit: limit,
        q: debouncedSearch,
        role: selectedRole 
      };

      const response = await axios.get(API.users.list, { params });
      setUsers(response.data.items || []); 
      setTotalData(response.data.total || 0);
    } catch (err) {
      console.error("Gagal load users:", err);
      toast.error("Gagal mengambil data user.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit, debouncedSearch, selectedRole]);

  // --- 3. HANDLER DELETE ---
  const confirmDeleteUser = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
        await axios.delete(API.users.detail(deleteTargetId));
        toast.success("User berhasil dihapus");
        setIsDeleteModalOpen(false);
        setDeleteTargetId(null);
        fetchUsers(); // Refresh data
    } catch (error: any) {
        const msg = error.response?.data?.error || "Gagal menghapus user";
        toast.error(msg);
    } finally {
        setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-5 md:gap-7 2xl:gap-10">
        
        {/* CONTROL BAR */}
        <div className="rounded-sm border border-stroke bg-white px-5 py-4 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Filter Kiri */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-grow">
               {/* Search */}
               <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Cari username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-stroke rounded-lg outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary transition"
                  />
               </div>

               {/* Role Filter */}
               <div className="relative w-full sm:w-48">
                  <select
                    value={selectedRole}
                    onChange={(e) => {
                        setSelectedRole(e.target.value);
                        setPage(1);
                    }}
                    className="w-full appearance-none bg-transparent pl-4 pr-10 py-2 border border-stroke rounded-lg outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 cursor-pointer capitalize"
                  >
                    <option value="">Semua Role</option>
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronDownIcon className="w-4 h-4" />
                  </span>
               </div>
            </div>

            <div className="w-full md:w-auto flex justify-end">
               <Button onClick={handleCreate}>
                 <span className="flex items-center gap-2">
                   <PlusIcon/> Tambah User
                 </span>
               </Button>
            </div>
          </div>
        </div>

        {/* TABEL DATA */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                  <th className="py-4 px-4 font-medium text-black dark:text-white xl:pl-11 w-[50px]">No</th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">Username</th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">Role</th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">Terdaftar Sejak</th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white text-right pr-8">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-10">Memuat data user...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-500">Data tidak ditemukan.</td></tr>
                ) : (
                  users.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-meta-4/50 transition-colors">
                      <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                        <span className="text-gray-500">#{(page - 1) * limit + index + 1}</span>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <h5 className="font-semibold text-black dark:text-white">{item.username}</h5>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${
                            item.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                           {item.role}
                        </span>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                         <span className="text-sm text-gray-500">
                            {new Date(item.created_at).toLocaleDateString("id-ID", { 
                                day: 'numeric', month: 'long', year: 'numeric' 
                            })}
                         </span>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <div className="flex items-center justify-end gap-2 pr-4">
                          <button 
                             onClick={() => handleEdit(item)}
                             className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 hover:text-primary transition"
                             title="Edit Password / Role"
                          >
                            <PencilIcon className="w-5 h-5"/>
                          </button>
                          <button 
                             onClick={() => openDeleteModal(item.id)}
                             className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-gray-600 hover:text-red-500 transition"
                             title="Hapus"
                          >
                            <TrashBinIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION SIMPLE */}
          <div className="py-4 px-6 border-t border-stroke dark:border-strokedark flex justify-between items-center bg-gray-50 dark:bg-meta-4/20">
             <div className="text-sm text-gray-500">
               Total <b>{totalData}</b> user
             </div>
             <div className="flex gap-2">
                <button
                   disabled={page === 1}
                   onClick={() => setPage(p => p - 1)}
                   className="px-3 py-1 rounded border border-stroke bg-white text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-strokedark dark:bg-meta-4"
                >
                   Prev
                </button>
                <span className="px-3 py-1 text-sm font-medium bg-white border border-stroke rounded dark:bg-meta-4 dark:border-strokedark">
                   {page}
                </span>
                <button
                   disabled={users.length < limit} 
                   onClick={() => setPage(p => p + 1)}
                   className="px-3 py-1 rounded border border-stroke bg-white text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-strokedark dark:bg-meta-4"
                >
                   Next
                </button>
             </div>
          </div>

        </div>
      </div>
      
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteUser}
        title="Hapus User?"
        message="Aksi ini tidak dapat dibatalkan. User yang dihapus tidak bisa login kembali."
        isLoading={isDeleting}
      />

      <UserFormModal 
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={fetchUsers}
        userToEdit={editingUser}
      />
    </>
  );
}