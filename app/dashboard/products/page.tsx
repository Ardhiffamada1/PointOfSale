// app/dashboard/products/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProductGrid from "@/app/components/ProductsGrid";
import AddProductModal from "@/app/components/AddProductModal";
import EditProductModal from "@/app/components/EditProductModal";
import { PlusCircleIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { Product, User } from "@/app/types";
import LoadingSpinner from "@/app/components/LoadingSpinner"; // Pastikan ini diimpor

export default function ProductsPage(): React.JSX.Element {
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productsUpdateKey, setProductsUpdateKey] = useState<number>(0);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    setIsLoadingUser(true); // Pastikan loading true saat memulai efek

    if (!storedUser) {
      router.push("/auth");
    } else {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.role !== "admin" && parsedUser.role !== "manager") {
          toast.error("Anda tidak memiliki akses ke halaman ini.");
          router.push("/dashboard");
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

  const handleRefresh = (): void => {
    setProductsUpdateKey((prevKey) => prevKey + 1);
  };

  const handleProductAdded = (): void => {
    setIsAddModalOpen(false);
    handleRefresh();
    toast.success("Produk berhasil ditambahkan!");
  };

  const handleEditClick = (product: Product): void => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleProductUpdated = (): void => {
    setIsEditModalOpen(false);
    handleRefresh();
    toast.success("Produk berhasil diperbarui!");
  };

  const handleProductDeleted = (): void => {
    handleRefresh();
    toast.success("Produk berhasil dihapus!");
  };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "manager")) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6 md:p-8">
        {/* Pastikan container utama mengisi tinggi penuh */}
        <div className="container mx-auto h-full flex flex-col">
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
                Manajemen Inventaris Produk
              </h1>
            </div>
            {user.role === "admin" && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center transition duration-150 ease-in-out"
              >
                <PlusCircleIcon className="h-5 w-5 mr-2" />
                Tambah Produk Baru
              </button>
            )}
          </div>

          {/* Pastikan ProductGrid container mengisi sisa ruang dan bisa scroll */}
          <div className="bg-white shadow-xl rounded-lg p-4 sm:p-6 flex-1 overflow-y-auto">
            <ProductGrid
              key={productsUpdateKey}
              onEdit={handleEditClick}
              onDelete={handleProductDeleted}
              currentUserRole={user.role}
            />
          </div>
        </div>
      </main>

      {isAddModalOpen && (
        <AddProductModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onProductAdded={handleProductAdded}
        />
      )}

      {selectedProduct && isEditModalOpen && (
        <EditProductModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          product={selectedProduct as Product}
          onProductUpdated={handleProductUpdated}
        />
      )}
    </div>
  );
}
