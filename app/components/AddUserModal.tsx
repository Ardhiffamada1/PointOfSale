// app/components/AddUserModal.tsx
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase"; // Pastikan path ini benar
import { v4 as uuidv4 } from "uuid"; // Untuk menghasilkan UUID

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onUserAdded,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (
      email.trim() === "" ||
      password.trim() === "" ||
      username.trim() === ""
    ) {
      toast.error("Email, Password, dan Username harus diisi.");
      setIsSubmitting(false);
      return;
    }
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Langsung INSERT ke tabel public.profiles
      const newUserId = uuidv4(); // Buat UUID baru untuk ID pengguna

      const { data, error } = await supabase.from("profiles").insert([
        {
          id: newUserId, // Gunakan UUID yang dibuat
          email: email,
          username: username,
          password: password, // Menyimpan password plain text
          role: "cashier", // Default role saat penambahan
        },
      ]);

      if (error) throw error;

      toast.success("Pengguna berhasil ditambahkan!");
      onUserAdded();
      onClose();
      setEmail("");
      setPassword("");
      setUsername("");
    } catch (error: any) {
      console.error("Error adding user:", error.message);
      toast.error(`Gagal menambah pengguna: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6 md:p-8 transform transition-all duration-300 scale-100 opacity-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
          Tambah Pengguna Baru
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Password (min 6 karakter)
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
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
              {isSubmitting ? "Menambahkan..." : "Tambah Pengguna"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
