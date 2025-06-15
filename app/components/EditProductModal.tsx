// app/components/EditProductModal.tsx
import React, { useState, useEffect } from "react";
import { Product } from "@/app/types";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onProductUpdated: () => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onProductUpdated,
}) => {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price.toString());
  const [stock, setStock] = useState(product.stock.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Memastikan modal terisi dengan data produk yang benar saat dibuka/berubah
    if (isOpen) {
      setName(product.name);
      setPrice(product.price.toString());
      setStock(product.stock.toString());
    }
  }, [isOpen, product]); // Tambahkan isOpen sebagai dependency

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock, 10);

    if (
      name.trim() === "" ||
      isNaN(parsedPrice) ||
      isNaN(parsedStock) ||
      parsedPrice <= 0 ||
      parsedStock < 0
    ) {
      toast.error(
        "Pastikan semua bidang terisi dengan benar (harga harus positif, stok non-negatif)."
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("products")
        .update({
          name: name,
          price: parsedPrice,
          stock: parsedStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", product.id)
        .select(); // Tambahkan .select() untuk mendapatkan data yang diperbarui jika perlu

      if (error) throw error;
      if (!data || data.length === 0)
        throw new Error("Produk tidak ditemukan atau tidak dapat diperbarui.");

      onProductUpdated(); // Trigger refresh di parent
      toast.success("Produk berhasil diperbarui!");
      onClose();
    } catch (error: any) {
      console.error("Error updating product:", error.message);
      toast.error(`Gagal memperbarui produk: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6 md:p-8 transform transition-all duration-300 scale-100 opacity-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
          Edit Produk
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Nama Produk
            </label>
            <input
              type="text"
              id="name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="price"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Harga (IDR)
            </label>
            <input
              type="number"
              id="price"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              step="0.01"
              required
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="stock"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Stok
            </label>
            <input
              type="number"
              id="stock"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-5 rounded-lg transition duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
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

export default EditProductModal;
