// app/components/LowStockProducts.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/app/types";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const LOW_STOCK_THRESHOLD = 10; // Batas stok rendah

export default function LowStockProducts(): React.JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLowStockProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .lte("stock", LOW_STOCK_THRESHOLD) // Cari produk dengan stok <= batas
        .order("stock", { ascending: true }) // Urutkan dari stok terendah
        .limit(5); // Ambil 5 produk dengan stok terendah

      if (error) throw error;
      setProducts(data as Product[]);
    } catch (err: any) {
      console.error("Gagal memuat produk stok rendah:", err.message);
      setError("Gagal memuat produk stok rendah: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStockProducts();
  }, []);

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <ExclamationTriangleIcon className="h-7 w-7 text-red-500 mr-2" />
          Stok Produk Rendah
        </h2>
        <button
          onClick={fetchLowStockProducts}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-1 px-3 rounded-lg flex items-center transition duration-150 ease-in-out text-sm"
          disabled={isLoading}
        >
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <ArrowPathIcon className="h-4 w-4 mr-1" />
          )}
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="text-center text-red-600 py-8">{error}</div>
      ) : products.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          Tidak ada produk dengan stok rendah.
        </div>
      ) : (
        <div className="overflow-x-auto flex-1">
          <ul className="divide-y divide-gray-200">
            {products.map((product) => (
              <li
                key={product.id}
                className="py-3 flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.barcode}</p>
                </div>
                <div className="text-right">
                  <span className="text-red-600 font-bold text-lg">
                    {product.stock}
                  </span>{" "}
                  <span className="text-sm text-gray-600">unit</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
