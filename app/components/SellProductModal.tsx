// app/components/SellProductModal.tsx
import React, { useState } from "react";
import { Product } from "@/app/types";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

interface SellProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSaleRecorded: () => void;
}

const SellProductModal: React.FC<SellProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onSaleRecorded,
}) => {
  const [quantity, setQuantity] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const parsedQuantity = parseInt(quantity, 10);

    if (
      isNaN(parsedQuantity) ||
      parsedQuantity <= 0 ||
      parsedQuantity > product.stock
    ) {
      toast.error(
        `Kuantitas harus angka positif dan tidak boleh melebihi stok (${product.stock}).`
      );
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Record sale
      const { error: saleError } = await supabase.from("sales").insert({
        product_id: product.id,
        quantity: parsedQuantity,
        sale_price: product.price, // Use current product price
      });

      if (saleError) throw saleError;

      // 2. Update product stock
      const { error: productUpdateError } = await supabase
        .from("products")
        .update({ stock: product.stock - parsedQuantity })
        .eq("id", product.id);

      if (productUpdateError) throw productUpdateError;

      toast.success(
        `${parsedQuantity} unit '${product.name}' berhasil dijual!`
      );
      onSaleRecorded(); // Trigger refresh for both product list and revenue
      onClose();
      setQuantity("1"); // Reset quantity
    } catch (error: any) {
      console.error("Error selling product:", error.message);
      toast.error(`Gagal menjual produk: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Jual Produk: {product.name}
        </h2>
        <p className="mb-4 text-gray-700">
          Harga:{" "}
          {new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
          }).format(product.price)}{" "}
          | Stok Tersedia: {product.stock}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="quantity"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Kuantitas
            </label>
            <input
              type="number"
              id="quantity"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              max={product.stock}
              required
            />
          </div>
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Memproses..." : "Jual Sekarang"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellProductModal;
