import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Modal } from "../../components/Modal";
import { useToast } from "../../components/ToastProvider";

export function Users() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const [create, setCreate] = useState({ username: "", password: "", retype: "" });
  const [edit, setEdit] = useState({ id: null, username: "", password: "", retype: "" });

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/users");
      setUsers(res.data || []);
    } catch (e) {
      toast.error("Gagal load user", e?.response?.data?.error ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function submitCreate() {
    if (!create.username.trim()) return toast.error("Validasi", "Username wajib diisi");
    if (create.password.length < 8) return toast.error("Validasi", "Password minimal 8 karakter");
    if (create.password !== create.retype) return toast.error("Validasi", "Password dan retype tidak sama");

    try {
      await api.post("/users", {
        username: create.username,
        password: create.password,
        retype_password: create.retype,
      });
      toast.success("Berhasil", "User agent berhasil dibuat");
      setOpenCreate(false);
      setCreate({ username: "", password: "", retype: "" });
      await load();
    } catch (e) {
      toast.error("Gagal create", e?.response?.data?.error ?? "Unknown error");
    }
  }

  function openEditUser(u) {
    setEdit({ id: u.id, username: u.username, password: "", retype: "" });
    setOpenEdit(true);
  }

  async function submitEdit() {
    if (!edit.username.trim()) return toast.error("Validasi", "Username wajib diisi");
    if ((edit.password || edit.retype) && edit.password.length < 8) return toast.error("Validasi", "Password minimal 8 karakter");
    if ((edit.password || edit.retype) && edit.password !== edit.retype) return toast.error("Validasi", "Password dan retype tidak sama");

    const payload = { username: edit.username };
    if (edit.password) {
      payload.password = edit.password;
      payload.retype_password = edit.retype;
    }

    try {
      await api.put(`/users/${edit.id}`, payload);
      toast.success("Berhasil", "User berhasil diupdate");
      setOpenEdit(false);
      await load();
    } catch (e) {
      toast.error("Gagal update", e?.response?.data?.error ?? "Unknown error");
    }
  }

  async function del(id) {
    if (!confirm("Hapus user ini?")) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success("Berhasil", "User berhasil dihapus");
      await load();
    } catch (e) {
      toast.error("Gagal delete", e?.response?.data?.error ?? "Unknown error");
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <div className="text-lg font-bold text-slate-900">Management Akun</div>
          <div className="mt-1 text-sm text-slate-500">Kelola akun agent (create / edit / delete).</div>
        </div>
        <button
          onClick={() => setOpenCreate(true)}
          className="rounded-2xl bg-bjb-navy px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
        >
          + Add User
        </button>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
        {loading ? (
          <div className="text-sm text-slate-500">Loading...</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-3">ID</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="py-3">{u.id}</td>
                    <td className="font-semibold text-slate-900">{u.username}</td>
                    <td>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{u.role}</span>
                    </td>
                    <td className="text-slate-500">{new Date(u.created_at).toLocaleString()}</td>
                    <td className="text-right space-x-2">
                      <button
                        onClick={() => openEditUser(u)}
                        className="rounded-xl px-3 py-1.5 text-xs font-semibold bg-bjb-navy/10 text-bjb-navy hover:bg-bjb-navy/15"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => del(u.id)}
                        className="rounded-xl px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      Belum ada user.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        open={openCreate}
        title="Add User (Agent)"
        subtitle="Buat akun agent baru (default role = agent)."
        onClose={() => setOpenCreate(false)}
      >
        <div className="space-y-3">
          <Field label="Username">
            <input className="input" value={create.username} onChange={(e) => setCreate({ ...create, username: e.target.value })} />
          </Field>
          <Field label="Password">
            <input type="password" className="input" value={create.password} onChange={(e) => setCreate({ ...create, password: e.target.value })} />
          </Field>
          <Field label="Retype Password">
            <input type="password" className="input" value={create.retype} onChange={(e) => setCreate({ ...create, retype: e.target.value })} />
          </Field>

          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setOpenCreate(false)} className="btn-ghost">Cancel</button>
            <button onClick={submitCreate} className="btn-primary">Save</button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={openEdit}
        title="Edit User"
        subtitle="Edit username, optional update password."
        onClose={() => setOpenEdit(false)}
      >
        <div className="space-y-3">
          <Field label="Username">
            <input className="input" value={edit.username} onChange={(e) => setEdit({ ...edit, username: e.target.value })} />
          </Field>
          <Field label="New Password (optional)">
            <input type="password" className="input" value={edit.password} onChange={(e) => setEdit({ ...edit, password: e.target.value })} />
          </Field>
          <Field label="Retype New Password (optional)">
            <input type="password" className="input" value={edit.retype} onChange={(e) => setEdit({ ...edit, retype: e.target.value })} />
          </Field>

          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setOpenEdit(false)} className="btn-ghost">Cancel</button>
            <button onClick={submitEdit} className="btn-primary">Update</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-700">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}
