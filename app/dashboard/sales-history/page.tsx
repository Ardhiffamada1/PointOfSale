// app/dashboard/sales-history/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, SalesItem, Product } from "@/app/types";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import {
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

export default function SalesHistoryPage(): React.JSX.Element {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);
  const [sales, setSales] = useState<
    (SalesItem & { sale_date: string; product_name?: string })[]
  >([]);
  const [isLoadingSales, setIsLoadingSales] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/auth");
    } else {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
        if (parsedUser.role !== "admin" && parsedUser.role !== "manager") {
          toast.error("Anda tidak memiliki akses ke halaman ini.");
          router.push("/dashboard");
        } else {
          fetchSales();
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

  const fetchSales = async () => {
    setIsLoadingSales(true);
    setError(null);
    try {
      let query = supabase
        .from("sales")
        .select(
          `
          id,
          product_id,
          quantity,
          sale_price,
          sale_date,
          payment_method,
          products (name)
        `
        )
        .order("sale_date", { ascending: false });

      if (startDate) {
        query = query.gte("sale_date", startDate + "T00:00:00.000Z");
      }
      if (endDate) {
        query = query.lte("sale_date", endDate + "T23:59:59.999Z");
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedSales = data.map((sale: any) => ({
        id: sale.id,
        product_id: sale.product_id,
        quantity: sale.quantity,
        sale_price: sale.sale_price,
        sale_date: sale.sale_date,
        payment_method: sale.payment_method,
        product_name: sale.products ? sale.products.name : "N/A",
      }));

      setSales(formattedSales);
    } catch (err: any) {
      console.error("Gagal memuat riwayat penjualan:", err.message);
      setError("Gagal memuat riwayat penjualan: " + err.message);
    } finally {
      setIsLoadingSales(false);
    }
  };

  useEffect(() => {
    if (
      !isLoadingUser &&
      currentUser &&
      (currentUser.role === "admin" || currentUser.role === "manager")
    ) {
      fetchSales();
    }
  }, [startDate, endDate, isLoadingUser, currentUser]);

  const filteredSales = sales.filter(
    (sale) =>
      sale.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (isLoadingUser || isLoadingSales) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  if (
    !currentUser ||
    (currentUser.role !== "admin" && currentUser.role !== "manager")
  ) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6 md:p-8">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              {/* Tombol Kembali */}
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors mr-3 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Kembali ke Dashboard"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <h1 className="text-3xl font-extrabold text-gray-800">
                Riwayat Penjualan
              </h1>
            </div>
          </div>

          <div className="bg-white shadow-xl rounded-lg p-4 sm:p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari ID Penjualan atau Nama Produk..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              <div className="relative">
                <input
                  type="date"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  title="Tanggal Mulai"
                />
                <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              <div className="relative">
                <input
                  type="date"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  title="Tanggal Akhir"
                />
                <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <button
              onClick={fetchSales}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Terapkan Filter
            </button>
          </div>

          <div className="bg-white shadow-xl rounded-lg p-4 sm:p-6">
            {error ? (
              <div className="text-center py-8 text-red-600 bg-red-50 border border-red-300 rounded p-4">
                {error}
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Tidak ada transaksi penjualan ditemukan.
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
                        ID Penjualan
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Tanggal & Waktu
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Produk
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Kuantitas
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Payment Method
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Harga
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSales.map((saleItem) => (
                      <tr key={saleItem.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {saleItem.id.substring(0, 8)}...{" "}
                          {/* Tampilkan sebagian ID */}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(saleItem.sale_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {saleItem.product_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {saleItem.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {saleItem.payment_method}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(saleItem.sale_price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                          {formatCurrency(
                            saleItem.sale_price * saleItem.quantity
                          )}
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
    </div>
  );
}
