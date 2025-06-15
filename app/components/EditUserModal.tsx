// app/components/EditUserModal.tsx
import React, { useState, useEffect } from "react";
import { User } from "@/app/types";
import { supabase } from "@/lib/supabase"; // Pastikan path ini benar
import { toast } from "react-hot-toast";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User; // Pengguna yang akan diedit
  onUserUpdated: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
}) => {
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedRole(user.role);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Supabase: Update peran di tabel profiles
      const { data, error } = await supabase
        .from("profiles")
        .update({ role: selectedRole })
        .eq("id", user.id);

      if (error) throw error;

      toast.success(
        `Peran pengguna ${user.email} berhasil diperbarui menjadi ${selectedRole}!`
      );
      onUserUpdated();
      onClose();
    } catch (error: any) {
      console.error("Error updating user role:", error.message);
      toast.error(`Gagal memperbarui peran pengguna: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roles: ("admin" | "cashier" | "manager")[] = [
    "admin",
    "manager",
    "cashier",
  ]; // Daftar peran yang tersedia

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6 md:p-8 transform transition-all duration-300 scale-100 opacity-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
          Edit Peran Pengguna
        </h2>
        <p className="text-gray-700 mb-4">
          Pengguna: <span className="font-semibold">{user.email}</span>
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="role"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Pilih Peran
            </label>
            <select
              id="role"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedRole}
              onChange={(e) =>
                setSelectedRole(
                  e.target.value as "admin" | "cashier" | "manager"
                )
              }
              required
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-5 rounded-lg transition duration-150"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
