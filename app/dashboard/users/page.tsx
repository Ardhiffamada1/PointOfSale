// app/dashboard/users/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/app/types";
import { supabase } from "@/lib/supabase"; // Sesuaikan path jika berbeda
import { toast } from "react-hot-toast";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import {
  PlusCircleIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

import AddUserModal from "@/app/components/AddUserModal";
import EditUserModal from "@/app/components/EditUserModal";

export default function UserManagementPage(): React.JSX.Element {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState<boolean>(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] =
    useState<boolean>(false);
  // selectedUser harus diinisialisasi sebagai null, tetapi saat digunakan di modal, kita pastikan itu User
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/auth");
    } else {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
        if (parsedUser.role !== "admin") {
          toast.error("Anda tidak memiliki akses ke halaman ini.");
          router.push("/dashboard");
        } else {
          fetchUsers();
        }
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem("user");
        router.push("/auth");
      } finally {
        setIsLoadingUser(false);
      }
    }
  }, [router]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, email, role")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setUsers(data as User[]);
    } catch (err: any) {
      console.error("Failed to fetch users:", err.message);
      setError("Gagal memuat daftar pengguna: " + err.message);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleUserAdded = () => {
    setIsAddUserModalOpen(false);
    fetchUsers();
    toast.success("Pengguna berhasil ditambahkan!");
  };

  const handleUserUpdated = () => {
    setIsEditUserModalOpen(false);
    fetchUsers();
    toast.success("Pengguna berhasil diperbarui!");
  };

  const handleDeleteUser = async (userToDelete: User) => {
    if (userToDelete.id === currentUser?.id) {
      toast.error("Anda tidak bisa menghapus akun Anda sendiri.");
      return;
    }
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus pengguna "${userToDelete.email}"?`
      )
    ) {
      try {
        const { error } = await supabase
          .from("profiles")
          .delete()
          .eq("id", userToDelete.id);

        if (error) throw error;
        toast.success("Pengguna berhasil dihapus!");
        fetchUsers();
      } catch (err: any) {
        console.error("Gagal menghapus pengguna:", err.message);
        toast.error(`Gagal menghapus pengguna: ${err.message}`);
      }
    }
  };

  if (isLoadingUser || isLoadingUsers) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "admin") {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6 md:p-8">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors mr-3 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Kembali ke Dashboard"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <h1 className="text-3xl font-extrabold text-gray-800">
                Manajemen Pengguna
              </h1>
            </div>
            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center transition duration-150 ease-in-out"
            >
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              Tambah Pengguna Baru
            </button>
          </div>

          <div className="bg-white shadow-xl rounded-lg p-4 sm:p-6">
            {error ? (
              <div className="text-center py-8 text-red-600 bg-red-50 border border-red-300 rounded p-4">
                {error}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Belum ada pengguna terdaftar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Username
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Peran
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Aksi</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((userItem) => (
                      <tr key={userItem.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {userItem.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {userItem.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {userItem.role}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedUser(userItem);
                              setIsEditUserModalOpen(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            <PencilIcon className="h-5 w-5 inline-block mr-1" />{" "}
                            Edit Peran
                          </button>
                          <button
                            onClick={() => handleDeleteUser(userItem)}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            disabled={userItem.id === currentUser.id}
                          >
                            <TrashIcon className="h-5 w-5 inline-block mr-1" />{" "}
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {isAddUserModalOpen && (
        <AddUserModal
          isOpen={isAddUserModalOpen}
          onClose={() => setIsAddUserModalOpen(false)}
          onUserAdded={handleUserAdded}
        />
      )}

      {/* Perbaikan di sini: Tambahkan kondisional lebih kuat */}
      {selectedUser && isEditUserModalOpen && (
        <EditUserModal
          isOpen={isEditUserModalOpen}
          onClose={() => setIsEditUserModalOpen(false)}
          user={selectedUser as User} // <--- Pastikan tipe data selectedUser adalah User di sini
          onUserUpdated={handleUserUpdated}
        />
      )}
    </div>
  );
}
