import { useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "../../../api/axios";
import API from "../../../api/api";
import Button from "../button/Button";
import Input from "../../form/input/InputField";
import Label from "../../form/Label";
import { toast } from "react-toastify";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToEdit?: { id: number; username: string } | null;
}

interface UserFormValues {
  username: string;
  role?: "admin" | "agent";
  password?: string;
  retype_password?: string;
}

export default function UserFormModal({
  isOpen,
  onClose,
  onSuccess,
  userToEdit,
}: UserFormModalProps) {
  const isEditMode = !!userToEdit;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    defaultValues: {
      username: "",
      role: "agent",
      password: "",
      retype_password: "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;

    if (userToEdit) {
      // EDIT: role tidak kita ubah di modal ini (backend Update juga belum support role)
      reset({
        username: userToEdit.username,
        role: "agent", // tidak dipakai di edit mode (hidden)
        password: "",
        retype_password: "",
      });
    } else {
      // CREATE: default role agent
      reset({
        username: "",
        role: "agent",
        password: "",
        retype_password: "",
      });
    }
  }, [isOpen, userToEdit, reset]);

  const password = watch("password");

  const onSubmit = async (data: UserFormValues) => {
    const payload: any = {
      username: data.username,
    };

    // CREATE: wajib kirim role (karena DTO backend CreateUserRequest sekarang butuh role)
    if (!isEditMode) {
      payload.role = data.role || "agent";
    }

    // password opsional di edit (kalau diisi, kirim)
    if (data.password) {
      payload.password = data.password;
      payload.retype_password = data.retype_password;
    }

    try {
      if (isEditMode && userToEdit) {
        await axios.put(API.users.detail(userToEdit.id), payload);
        toast.success("User berhasil diperbarui!");
      } else {
        await axios.post(API.users.list, payload);
        toast.success("User berhasil dibuat!");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || "Terjadi kesalahan sistem.";
      toast.error(msg);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl dark:bg-boxdark border border-stroke dark:border-strokedark">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-strokedark">
          <h3 className="font-semibold text-lg text-black dark:text-white">
            {isEditMode ? "Edit User" : "Tambah User Baru"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 transition"
            type="button"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {/* USERNAME */}
          <div className="mb-4">
            <Label>Username</Label>
            <Input
              {...register("username", {
                required: "Username wajib diisi",
                minLength: { value: 3, message: "Minimal 3 karakter" },
              })}
              placeholder="Masukkan username"
            />
            {errors.username && (
              <span className="text-red-500 text-xs mt-1">
                {errors.username.message}
              </span>
            )}
          </div>

          {/* ROLE (CREATE ONLY) */}
          {!isEditMode && (
            <div className="mb-4">
              <Label>Role</Label>
              <select
                {...register("role", { required: "Role wajib dipilih" })}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 cursor-pointer"
                defaultValue="agent"
              >
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.role.message as string}
                </span>
              )}
            </div>
          )}

          {/* PASSWORD */}
          <div className="mb-4">
            <Label>
              Password
              {isEditMode && (
                <span className="text-xs font-normal text-gray-500 ml-1">
                  (Kosongkan jika tidak ingin ubah)
                </span>
              )}
            </Label>
            <Input
              type="password"
              {...register("password", {
                required: !isEditMode ? "Password wajib diisi" : false,
                minLength: { value: 8, message: "Minimal 8 karakter" },
              })}
              placeholder={isEditMode ? "Biarkan kosong..." : "Masukkan password"}
            />
            {errors.password && (
              <span className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </span>
            )}
          </div>

          {/* RETYPE PASSWORD */}
          <div className="mb-6">
            <Label>Ulangi Password</Label>
            <Input
              type="password"
              {...register("retype_password", {
                validate: (val) => {
                  // Edit mode: kalau password kosong, retype boleh kosong
                  if (!val && !password && isEditMode) return true;

                  // Kalau password diisi, harus match
                  if ((password || "").length > 0 && val !== password) {
                    return "Password tidak sama";
                  }

                  // Create mode: biar ketangkep kalau user lupa retype
                  if (!isEditMode && (password || "").length > 0 && !val) {
                    return "Ulangi password wajib diisi";
                  }

                  return true;
                },
              })}
              placeholder="Ketik ulang password"
            />
            {errors.retype_password && (
              <span className="text-red-500 text-xs mt-1">
                {errors.retype_password.message as string}
              </span>
            )}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex justify-end gap-3 mt-8">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan User"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
