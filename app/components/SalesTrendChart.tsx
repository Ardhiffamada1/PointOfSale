// app/components/SalesTrendChart.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface DailyRevenue {
  date: string; // Format YYYY-MM-DD
  revenue: number;
}

export default function SalesTrendChart(): React.JSX.Element {
  const [data, setData] = useState<DailyRevenue[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSalesData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Mengambil data penjualan dari 30 hari terakhir
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select(`sale_price, quantity, created_at`)
        .gte(
          "created_at",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        ) // 30 hari terakhir
        .order("created_at", { ascending: true });

      if (salesError) throw salesError;

      // Agregasi data per hari
      const dailyAggregates: { [key: string]: number } = {};
      salesData.forEach((sale) => {
        const date = new Date(sale.created_at).toISOString().split("T")[0]; // YYYY-MM-DD
        const itemTotal = sale.sale_price * sale.quantity;
        dailyAggregates[date] = (dailyAggregates[date] || 0) + itemTotal;
      });

      // Konversi ke format yang dibutuhkan Recharts
      const formattedData: DailyRevenue[] = Object.keys(dailyAggregates)
        .sort() // Urutkan berdasarkan tanggal
        .map((date) => ({
          date,
          revenue: dailyAggregates[date],
        }));

      setData(formattedData);
    } catch (err: any) {
      console.error("Gagal memuat data penjualan chart:", err.message);
      setError("Gagal memuat data chart: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          Tren Penjualan (30 Hari Terakhir)
        </h2>
        <button
          onClick={fetchSalesData}
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
      ) : data.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          Tidak ada data penjualan untuk ditampilkan.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="80%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
              name="Pendapatan"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
