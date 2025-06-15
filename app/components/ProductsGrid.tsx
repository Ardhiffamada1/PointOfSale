// app/components/ProductGrid.tsx
import React, { useState, useEffect } from "react";
import { Product } from "@/app/types";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import LoadingSpinner from "./LoadingSpinner";

interface ProductGridProps {
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  currentUserRole: "admin" | "cashier" | "manager";
}

const ProductGrid: React.FC<ProductGridProps> = ({
  onEdit,
  onDelete,
  currentUserRole,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data as Product[]);
    } catch (err: any) {
      console.error("Gagal memuat produk:", err.message);
      setError("Gagal memuat daftar produk: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string, productName: string) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus produk "${productName}" ini?`
      )
    ) {
      try {
        const { error } = await supabase.from("products").delete().eq("id", id);

        if (error) throw error;

        setProducts(products.filter((p) => p.id !== id));
        onDelete(id);
      } catch (err: any) {
        console.error("Gagal menghapus produk:", err.message);
        toast.error(`Gagal menghapus produk: ${err.message}`);
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return "Stok Habis";
    if (stock <= 5) return `Stok Rendah (${stock} unit)`;
    return `Tersedia (${stock} unit)`;
  };

  const getStockColorClass = (stock: number) => {
    if (stock === 0) return "text-red-600 font-semibold";
    if (stock <= 5) return "text-orange-500 font-semibold";
    return "text-green-600";
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600 bg-red-50 border border-red-300 rounded p-4 h-full flex items-center justify-center">
        {error}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 h-full flex items-center justify-center">
        Belum ada produk yang ditambahkan. Klik "Tambah Produk Baru" untuk
        memulai!
      </div>
    );
  }

  return (
    // Perbaikan utama di sini: Sesuaikan jumlah kolom grid untuk mobile, tablet, dan desktop
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 h-full">
      {products.map((product) => (
        <div
          key={product.id}
          className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-200"
        >
          <div className="w-full h-32 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = `https://via.placeholder.com/150/F8F8F8/000000?text=${
                    product.name.split(" ")[0] || "Produk"
                  }`;
                  e.currentTarget.onerror = null;
                }}
              />
            ) : (
              <span className="text-center">Gambar tidak tersedia</span>
            )}
          </div>

          <div className="p-5 flex flex-col justify-between flex-grow">
            {" "}
            {/* Gunakan flex-col justify-between */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">
                {product.name}
              </h3>
              <p className="text-2xl font-extrabold text-blue-600 mb-3">
                {formatCurrency(product.price)}
              </p>
              <div className="flex items-center mb-4">
                <span
                  className={`text-sm ${getStockColorClass(product.stock)}`}
                >
                  {getStockStatus(product.stock)}
                </span>
              </div>
            </div>
            {/* Tombol aksi akan menjadi satu kolom di mobile, atau tetap di samping di desktop */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 mt-4">
              {(currentUserRole === "admin" ||
                currentUserRole === "manager") && (
                <>
                  <button
                    onClick={() => onEdit(product)}
                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-3 rounded-lg flex items-center justify-center transition duration-150"
                  >
                    <PencilIcon className="h-5 w-5 sm:mr-1" />{" "}
                    <span className="sm:inline hidden">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(product.id, product.name)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-3 rounded-lg flex items-center justify-center transition duration-150"
                  >
                    <TrashIcon className="h-5 w-5 sm:mr-1" />{" "}
                    <span className="sm:inline hidden">Hapus</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductGrid;
