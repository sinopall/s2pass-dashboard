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
  password?: string;
  retype_password?: string;
}

export default function UserFormModal({ isOpen, onClose, onSuccess, userToEdit }: UserFormModalProps) {
  const isEditMode = !!userToEdit;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>();

  useEffect(() => {
    if (isOpen) {
      if (userToEdit) {
        reset({ username: userToEdit.username, password: "", retype_password: "" });
      } else {
        reset({ username: "", password: "", retype_password: "" });
      }
    }
  }, [isOpen, userToEdit, reset]);

  const password = watch("password");

  const onSubmit = async (data: UserFormValues) => {
    const payload: any = {
        username: data.username,
    };
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
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition">
             <span className="text-2xl">&times;</span> 
          </button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="mb-4">
            <Label>Username</Label>
            <Input
              {...register("username", { 
                  required: "Username wajib diisi",
                  minLength: { value: 3, message: "Minimal 3 karakter" }
              })}
              placeholder="Masukkan username"
            />
            {errors.username && <span className="text-red-500 text-xs mt-1">{errors.username.message}</span>}
          </div>

          <div className="mb-4">
            <Label>
                Password 
                {isEditMode && <span className="text-xs font-normal text-gray-500 ml-1">(Kosongkan jika tidak ingin ubah)</span>}
            </Label>
            <Input
              type="password"
              {...register("password", { 
                  required: !isEditMode ? "Password wajib diisi" : false,
                  minLength: { value: 8, message: "Minimal 8 karakter" }
              })}
              placeholder={isEditMode ? "Biarkan kosong..." : "Masukkan password"}
            />
            {errors.password && <span className="text-red-500 text-xs mt-1">{errors.password.message}</span>}
          </div>

          <div className="mb-6">
            <Label>Ulangi Password</Label>
            <Input
              type="password"
              {...register("retype_password", { 
                  validate: (val) => {
                      if (!val && !password && isEditMode) return true;
                      if (val !== password) return "Password tidak sama";
                      return true;
                  }
              })}
              placeholder="Ketik ulang password"
            />
            {errors.retype_password && <span className="text-red-500 text-xs mt-1">{errors.retype_password.message}</span>}
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