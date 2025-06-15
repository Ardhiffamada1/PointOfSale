// app/components/LatestSalesTable.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Product, SalesItem } from "@/app/types"; // Import Product dan SalesItem
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

// Interface untuk data yang sebenarnya kita ambil dari tabel 'sales'
// yang per barisnya adalah sebuah item penjualan.
interface FetchedSaleItem {
  id: string; // ID baris di tabel sales
  product_id: string;
  quantity: number;
  sale_price: number; // Harga per unit saat transaksi
  created_at: string;
  products: {
    name: string;
  } | null; // Supabase join akan mengembalikan object atau null
}

export default function LatestSalesTable(): React.JSX.Element {
  const [salesItems, setSalesItems] = useState<FetchedSaleItem[]>([]); // Ganti nama state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLatestSales = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Perhatikan select: kita mengambil data yang sesuai dengan apa yang diinsert di POSPage
      // dan join dengan nama produk
      const { data, error } = await supabase
        .from("sales") // Asumsi 'sales' adalah tabel yang menyimpan item penjualan
        .select(
          `
          id,
          quantity,
          sale_price,
          created_at,
          products (
            name
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(10); // Ambil 10 item penjualan terbaru

      if (error) throw error;

      // Filter untuk memastikan produknya ada (tidak null)
      const validItems: FetchedSaleItem[] = data.filter(
        (item) => item.products !== null
      ) as unknown as FetchedSaleItem[];
      setSalesItems(validItems); // Update state dengan nama baru
    } catch (err: any) {
      console.error("Gagal memuat item penjualan terbaru:", err.message);
      setError("Gagal memuat item penjualan terbaru: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestSales();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Transaksi Terbaru</h2>
        <button
          onClick={fetchLatestSales}
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
      ) : salesItems.length === 0 ? ( // Ubah nama state
        <div className="text-center text-gray-500 py-8">
          Belum ada transaksi penjualan.
        </div>
      ) : (
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produk
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kuantitas
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harga Satuan
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Waktu
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesItems.map(
                (
                  item // Ubah nama variabel
                ) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.products?.name || "Produk Tidak Ditemukan"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {formatCurrency(item.sale_price)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-semibold">
                      {formatCurrency(item.sale_price * item.quantity)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(item.created_at)}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
