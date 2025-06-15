// app/components/PaymentModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Product } from "@/app/types";

// Deklarasi global untuk window.snap agar TypeScript mengenalinya
declare global {
  interface Window {
    snap: {
      pay: (
        snapToken: string,
        callbacks?: {
          onSuccess?: (result: any) => void;
          onPending?: (result: any) => void;
          onError?: (result: any) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  cartItems: Product[];
  onPaymentSuccess: (paymentDetails: {
    payment_method: string;
    amount_paid: number;
    change_given: number;
    transaction_id?: string;
  }) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  cartItems,
  onPaymentSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [change, setChange] = useState<number>(0);

  // Status QRIS tidak relevan jika fokus ke Midtrans, tapi saya biarkan jika Anda ingin mempertahankan fungsionalitasnya
  const [qrisStatus, setQrisStatus] = useState<
    "idle" | "pending" | "success" | "failed"
  >("idle");

  useEffect(() => {
    if (isOpen) {
      setPaymentMethod("cash");
      setAmountPaid("");
      setChange(0);
      setQrisStatus("idle");
    }
  }, [isOpen]);

  useEffect(() => {
    const paid = parseFloat(amountPaid);
    if (!isNaN(paid) && paid >= totalAmount) {
      setChange(paid - totalAmount);
    } else {
      setChange(0);
    }
  }, [amountPaid, totalAmount]);

  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // --- FUNGSI MOCK UNTUK MENDAPATKAN SNAP TOKEN (Hanya untuk SIMULASI/DEV) ---
  // DALAM PRODUKSI NYATA, INI HARUS DIDAPAT DARI BACKEND/EDGE FUNCTION YANG MENGGUNAKAN SERVER KEY MIDTRANS.
  const getMockSnapToken = async () => {
    // Ini adalah cara untuk mendapatkan token snap dari Midtrans API
    // tanpa perlu deployment Edge Function di awal. Anda bisa menjalankan ini sekali
    // di Postman/Insomnia ke endpoint Midtrans Sandbox API untuk mendapatkan tokennya.
    // ATAU: Kita bisa simulasikan bahwa kita mendapatkan token palsu.
    // Midtrans Snap.js memerlukan token yang dihasilkan oleh Midtrans API.
    // Jika Anda TIDAK memiliki Edge Function/API Route untuk Midtrans,
    // Anda tidak bisa *membuat* token di frontend.

    // SOLUSI TERBAIK UNTUK SIMULASI PADA FRONTEND TANPA BACKEND SAMA SEKALI:
    // Panggil langsung Midtrans Snap API dari frontend menggunakan SERVER_KEY.
    // INI SANGAT TIDAK AMAN UNTUK PRODUKSI, TAPI OK UNTUK TESTING LOKAL/SIMULASI.
    // Anda akan membutuhkan server key Midtrans Sandbox di .env.local
    // dan menggunakannya di sini, tapi ini akan terekspos di browser.
    // JADI, TETAP MEREKOMENDASIKAN API ROUTE/EDGE FUNCTION UNTUK MENDAPATKAN TOKEN.

    // Untuk demo ini, saya akan asumsikan Anda memiliki API Route /api/midtrans-transaction
    // yang memanggil Edge Function Anda. Jika Anda tidak mau, Anda perlu mengandalkan
    // token statis yang Anda dapatkan secara manual, atau menggunakan solusi seperti
    // ngrok untuk memanggil Edge Function lokal Anda.

    // Mari kita pakai cara yang benar: panggil API Route yang sudah kita bahas sebelumnya.
    // Ini adalah simulasi alur end-to-end dengan Midtrans Sandbox.
    try {
      const orderId = `TRX-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const grossAmount = totalAmount;

      const response = await fetch("/api/midtrans-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: orderId,
          gross_amount: grossAmount,
          item_details: cartItems.map((item) => ({
            // <--- Kemungkinan besar error di sini
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          customer_details: {
            first_name: "Customer",
            last_name: "POS",
            email: "customer@example.com",
            phone: "081234567890",
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal membuat transaksi Midtrans.");
      }
      return data.snap_token;
    } catch (err: any) {
      toast.error(`Gagal mendapatkan token Midtrans: ${err.message}`);
      setIsProcessing(false);
      return null;
    }
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    if (paymentMethod === "cash") {
      const paid = parseFloat(amountPaid);
      if (isNaN(paid) || paid <= 0) {
        // Validasi tambahan
        toast.error("Jumlah uang tunai yang dibayar tidak valid.");
        setIsProcessing(false);
        return;
      }
      if (paid < totalAmount) {
        toast.error("Jumlah uang tunai yang dibayar tidak cukup.");
        setIsProcessing(false);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
      onPaymentSuccess({
        payment_method: paymentMethod,
        amount_paid: paid,
        change_given: change,
      });
      toast.success("Pembayaran tunai berhasil diproses!");
      onClose();
      setIsProcessing(false);
    } else if (paymentMethod === "midtrans") {
      // Pastikan snap.js sudah dimuat
      if (typeof window.snap === "undefined") {
        toast.error("Midtrans Snap.js belum dimuat. Coba lagi.");
        setIsProcessing(false);
        return;
      }

      try {
        const snapToken = await getMockSnapToken(); // Mendapatkan token dari API Route
        if (!snapToken) return; // Jika gagal mendapatkan token, berhenti

        // Panggil Midtrans Snap Pop-up
        window.snap.pay(snapToken, {
          onSuccess: function (result) {
            toast.success("Pembayaran Midtrans berhasil!");
            onPaymentSuccess({
              payment_method: paymentMethod,
              amount_paid: totalAmount,
              change_given: 0,
              transaction_id: result.transaction_id,
            });
            onClose();
            setIsProcessing(false);
          },
          onPending: function (result) {
            toast("Pembayaran Midtrans menunggu konfirmasi.");
            console.log("Pending:", result);
            setIsProcessing(false);
          },
          onError: function (result) {
            toast.error("Pembayaran Midtrans gagal!");
            console.error("Midtrans Error:", result);
            setIsProcessing(false);
          },
          onClose: function () {
            toast("Pembayaran dibatalkan oleh pengguna.");
            setIsProcessing(false);
          },
        });
      } catch (error: any) {
        console.error("Error initiating Midtrans payment:", error);
        toast.error(`Gagal memproses pembayaran Midtrans: ${error.message}`);
        setIsProcessing(false);
      }
    } else if (paymentMethod === "qris") {
      setQrisStatus("pending");
      setIsProcessing(false); // Penting agar tombol simulasi bisa ditekan
      toast("Silakan pindai kode QRIS.");
    }
    // Handle other payment methods (card) if they don't involve redirect
    else {
      // Asumsi pembayaran kartu langsung berhasil (untuk simulasi)
      await new Promise((resolve) => setTimeout(resolve, 500));
      onPaymentSuccess({
        payment_method: paymentMethod,
        amount_paid: totalAmount,
        change_given: 0,
        transaction_id: `MOCK-${Date.now()}`,
      });
      toast.success(`Pembayaran ${paymentMethod} berhasil diproses!`);
      onClose();
      setIsProcessing(false);
    }
  };

  // Fungsi untuk mensimulasikan pembayaran QRIS (jika Anda mempertahankan fungsionalitas ini)
  const simulateQrisPayment = (success: boolean) => {
    setIsProcessing(true);
    setTimeout(() => {
      if (success) {
        setQrisStatus("success");
        onPaymentSuccess({
          payment_method: "qris",
          amount_paid: totalAmount,
          change_given: 0,
          transaction_id: `FAKE_QRIS_${Date.now()}`,
        });
        toast.success("Simulasi pembayaran QRIS berhasil!");
        onClose();
      } else {
        setQrisStatus("failed");
        toast.error("Simulasi pembayaran QRIS gagal!");
      }
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6 md:p-8 transform transition-all duration-300 scale-100 opacity-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Detail Pembayaran
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Tutup"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 text-center">
          <p className="text-xl text-gray-700">Total Pembayaran:</p>
          <p className="text-4xl font-extrabold text-blue-600">
            {formatCurrency(totalAmount)}
          </p>
        </div>

        <form onSubmit={handleProcessPayment}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Metode Pembayaran
            </label>
            <div className="flex gap-4 flex-wrap">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-blue-600 h-5 w-5"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === "cash"}
                  onChange={() => setPaymentMethod("cash")}
                />
                <span className="ml-2 text-gray-700">Tunai</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-blue-600 h-5 w-5"
                  name="paymentMethod"
                  value="midtrans"
                  checked={paymentMethod === "midtrans"}
                  onChange={() => setPaymentMethod("midtrans")}
                />
                <span className="ml-2 text-gray-700">Midtrans</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-blue-600 h-5 w-5"
                  name="paymentMethod"
                  value="qris"
                  checked={paymentMethod === "qris"}
                  onChange={() => setPaymentMethod("qris")}
                />
                <span className="ml-2 text-gray-700">QRIS (Simulasi)</span>{" "}
                {/* Ubah label */}
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-blue-600 h-5 w-5"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                />
                <span className="ml-2 text-gray-700">Kartu (Simulasi)</span>{" "}
                {/* Ubah label */}
              </label>
            </div>
          </div>

          {paymentMethod === "cash" && (
            <div className="mb-4">
              <label
                htmlFor="amountPaid"
                className="block text-gray-700 text-sm font-semibold mb-2"
              >
                Jumlah Dibayar (Tunai)
              </label>
              <input
                type="number"
                id="amountPaid"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xl font-bold"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                step="any"
                required={paymentMethod === "cash"}
              />
            </div>
          )}

          {/* UI untuk QRIS Palsu */}
          {paymentMethod === "qris" && (
            <div className="my-6 text-center">
              <p className="text-lg text-gray-700 mb-3">
                Pindai kode QRIS ini:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=QRIS_SIMULASI_${totalAmount}`}
                  alt="QRIS Code"
                  className="w-40 h-40 mx-auto"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Simulasi pembayaran untuk {formatCurrency(totalAmount)}
              </p>

              {qrisStatus === "pending" && (
                <div className="mt-4">
                  <p className="text-yellow-600 font-semibold mb-2">
                    Menunggu pembayaran...
                  </p>
                  <div className="flex justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => simulateQrisPayment(true)}
                      className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-150 disabled:opacity-50"
                      disabled={isProcessing}
                    >
                      Simulasi Berhasil
                    </button>
                    <button
                      type="button"
                      onClick={() => simulateQrisPayment(false)}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-150 disabled:opacity-50"
                      disabled={isProcessing}
                    >
                      Simulasi Gagal
                    </button>
                  </div>
                </div>
              )}
              {qrisStatus === "success" && (
                <p className="text-green-600 font-bold mt-4 text-xl">
                  Pembayaran QRIS Sukses!
                </p>
              )}
              {qrisStatus === "failed" && (
                <p className="text-red-600 font-bold mt-4 text-xl">
                  Pembayaran QRIS Gagal.
                </p>
              )}
            </div>
          )}

          <div className="mb-6">
            <p className="text-xl text-gray-700">Kembalian:</p>
            <p className="text-3xl font-extrabold text-green-600">
              {formatCurrency(change)}
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-5 rounded-lg transition duration-150"
              disabled={isProcessing}
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-lg transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                isProcessing ||
                (paymentMethod === "cash" &&
                  parseFloat(amountPaid) < totalAmount) ||
                (paymentMethod === "qris" && qrisStatus === "pending") // Nonaktifkan jika QRIS pending
              }
            >
              {isProcessing ? "Memproses..." : "Bayar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
