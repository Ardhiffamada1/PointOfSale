// app/dashboard/page.tsx
"use client";
import { useEffect, useState } from "react";

import RevenueOverview from "@/app/components/RevenueOverview";
import LatestSalesTable from "@/app/components/LatestSalesTable"; // Import komponen baru
import LowStockProducts from "@/app/components/LowStocksProduct"; // Import komponen baru
import SalesTrendChart from "@/app/components/SalesTrendChart"; // Import komponen grafik

export default function DashboardPage(): React.JSX.Element {
  const [revenueUpdateKey, setRevenueUpdateKey] = useState<number>(0);
  const handleDataChangeAffectingRevenue = (): void => {
    // Fungsi ini bisa dipanggil dari tempat lain (misal dari POSPage)
    // jika Anda ingin me-refresh RevenueOverview setelah transaksi.
    setRevenueUpdateKey((prevKey) => prevKey + 1);
  };

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6 md:p-8">
      <div className="container mx-auto h-full flex flex-col">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Ringkasan Dashboard
        </h1>

        <div className="mb-8">
          <RevenueOverview key={revenueUpdateKey} />{" "}
          {/* RevenueOverview tetap di sini */}
        </div>

        {/* Baris baru untuk grafik */}
        <div className="mb-8 h-[400px]">
          {" "}
          {/* Beri tinggi agar grafik terlihat */}
          <SalesTrendChart />
        </div>

        {/* Tambahkan area untuk data terbaru */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 flex-1">
          <LatestSalesTable /> {/* Komponen Transaksi Terbaru */}
          <LowStockProducts />
        </div>

        {/* Anda bisa menghapus atau mengembangkan area "Aktivitas Terbaru" yang lama */}
        {/*
        <div className="bg-white shadow-xl rounded-lg p-6 flex-1 flex flex-col justify-center items-center text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Aktivitas Terbaru
          </h2>
          <p className="text-gray-600">
            Data aktivitas produk dan penjualan terbaru akan ditampilkan di
            sini. Untuk mengelola produk, silakan kunjungi halaman "Manajemen
            Produk" melalui sidebar.
          </p>
        </div>
        */}
      </div>
    </main>
  );
}
