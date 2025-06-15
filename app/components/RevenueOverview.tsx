// app/components/RevenueOverview.tsx
import React, { useState, useEffect } from "react";
import { RevenueSummary } from "@/app/types";
import { supabase } from "@/lib/supabase"; // Pastikan impornya seperti ini: default import
import {
  CurrencyDollarIcon,
  CalendarIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";

// Import LoadingSpinner jika Anda ingin menggunakannya di sini untuk tampilan loading yang konsisten
// import LoadingSpinner from "./LoadingSpinner";

interface RevenueOverviewProps {
  updateKey?: number; // Trigger re-fetch (tidak wajib jika sudah pakai Realtime)
}

const RevenueOverview: React.FC<RevenueOverviewProps> = ({ updateKey }) => {
  const [revenueData, setRevenueData] = useState<RevenueSummary | null>(null);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState<boolean>(true);
  const [errorRevenue, setErrorRevenue] = useState<string | null>(null); // Hanya satu state error

  useEffect(() => {
    const fetchRevenueData = async () => {
      setIsLoadingRevenue(true);
      setErrorRevenue(null); // Set errorRevenue ke null di awal fetch
      try {
        // --- Fetch Total Revenue ---
        const { data: totalSalesData, error: totalSalesError } = await supabase
          .from("sales")
          .select("sale_price, quantity");

        if (totalSalesError) throw totalSalesError;

        const totalRevenue = totalSalesData.reduce(
          (sum, sale) => sum + sale.sale_price * sale.quantity,
          0
        );

        // --- Fetch Revenue Today ---
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1); // Start of tomorrow

        const { data: dailySalesData, error: dailySalesError } = await supabase
          .from("sales")
          .select("sale_price, quantity")
          .gte("sale_date", today.toISOString())
          .lt("sale_date", tomorrow.toISOString());

        if (dailySalesError) throw dailySalesError;

        const revenueToday = dailySalesData.reduce(
          (sum, sale) => sum + sale.sale_price * sale.quantity,
          0
        );

        // --- Calculate Average Revenue per Product ---
        // Ini adalah perhitungan yang disederhanakan: Total Pendapatan / Jumlah Produk di Tabel Produk
        // Ini mengasumsikan 'products' table mewakili item yang *dapat* dijual.
        // Untuk rata-rata pendapatan per *produk terjual*, Anda akan menghitung dari tabel `sales` secara langsung.
        const { data: productsCountData, error: productsCountError } =
          await supabase.from("products").select("id"); // Hanya hitung produk yang ada

        if (productsCountError) throw productsCountError;

        const numberOfProducts = productsCountData.length;
        const averageRevenuePerProduct =
          numberOfProducts > 0 ? totalRevenue / numberOfProducts : 0;

        setRevenueData({
          totalRevenue,
          revenueToday,
          averageRevenuePerProduct: parseFloat(
            averageRevenuePerProduct.toFixed(2)
          ), // Format ke 2 angka desimal
        });
      } catch (error: any) {
        console.error("Gagal memuat data pendapatan:", error.message);
        setErrorRevenue("Gagal memuat data pendapatan: " + error.message); // Set errorRevenue saat ada error
      } finally {
        setIsLoadingRevenue(false);
      }
    };

    fetchRevenueData();

    // Pastikan Realtime Listener diatur dengan benar untuk auto-refresh
    // Ini adalah bagian penting jika Anda ingin RevenueOverview diperbarui secara otomatis.
    // Jika Anda tidak menggunakan Realtime, Anda bisa menghapus bagian ini.
    const salesChannel = supabase
      .channel("public:sales_channel") // Berikan nama channel unik, misal 'public:sales_channel'
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales" },
        (payload) => {
          console.log("Perubahan Realtime diterima di sales:", payload);
          fetchRevenueData(); // Panggil fetchData lagi saat ada perubahan
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(salesChannel); // Bersihkan langganan saat komponen tidak digunakan
    };
  }, [updateKey]); // updateKey masih bisa digunakan untuk memaksa refresh manual jika Realtime dimatikan/tidak berfungsi

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0, // Tanpa desimal untuk jumlah besar
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoadingRevenue) {
    // Anda bisa menggunakan LoadingSpinner khusus Anda di sini, atau tetap dengan placeholder ini
    // import LoadingSpinner from './LoadingSpinner';
    // return <LoadingSpinner />;
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-blue-50 p-6 rounded-lg shadow-md flex items-center space-x-4"
          >
            <div className="h-10 w-10 bg-blue-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-blue-200 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-blue-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (errorRevenue) {
    return (
      <div className="text-red-600 bg-red-100 border border-red-300 p-4 rounded-lg text-center">
        {errorRevenue}
      </div>
    );
  }

  if (!revenueData) {
    return null; // Atau pesan bahwa tidak ada data
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Revenue Card */}
      <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4 border-l-4 border-blue-500">
        <div className="flex-shrink-0 bg-blue-100 p-3 rounded-full">
          <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Total Pendapatan</p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatCurrency(revenueData.totalRevenue)}
          </p>
        </div>
      </div>

      {/* Revenue Today Card */}
      <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4 border-l-4 border-green-500">
        <div className="flex-shrink-0 bg-green-100 p-3 rounded-full">
          <CalendarIcon className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">
            Pendapatan Hari Ini
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatCurrency(revenueData.revenueToday)}
          </p>
        </div>
      </div>

      {/* Average Revenue per Product Card */}
      <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4 border-l-4 border-purple-500">
        <div className="flex-shrink-0 bg-purple-100 p-3 rounded-full">
          <CubeIcon className="h-8 w-8 text-purple-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">
            Rata-rata per Produk
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatCurrency(revenueData.averageRevenuePerProduct)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RevenueOverview;
