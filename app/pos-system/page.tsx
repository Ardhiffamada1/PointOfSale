// app/dashboard/(pos-system)/pos/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
// Import useRouter jika diperlukan untuk tombol back / logout, jika tidak bisa dihapus
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; // Pastikan ini mengimpor default client
import { toast } from "react-hot-toast";
import { Product } from "@/app/types"; // Pastikan tipe Product dan lainnya sudah benar
import { v4 as uuidv4 } from "uuid"; // Untuk transaction_id

import {
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  ShoppingCartIcon,
  ArrowPathIcon,
  QrCodeIcon,
  ArrowLeftIcon, // Icon untuk tombol kembali
} from "@heroicons/react/24/outline";
import LoadingSpinner from "@/app/components/LoadingSpinner";

// NEW: Import PaymentModal
import PaymentModal from "@/app/components/PaymentModal";

interface CartItem extends Product {
  quantity: number;
}

export default function POSPage(): React.JSX.Element {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [errorProducts, setErrorProducts] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [barcodeInput, setBarcodeInput] = useState<string>("");
  const barcodeRef = useRef<HTMLInputElement>(null);

  // State untuk modal pembayaran
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [currentTransactionTotal, setCurrentTransactionTotal] =
    useState<number>(0);

  // Fungsi untuk mengambil daftar produk dari database
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    setErrorProducts(null);
    try {
      // Pastikan memilih semua kolom yang dibutuhkan, termasuk image_url dan barcode
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, stock, barcode, image_url")
        .order("name", { ascending: true });

      if (error) throw error;
      setProducts(data as Product[]);
    } catch (err: any) {
      console.error("Gagal memuat produk untuk POS:", err.message);
      setErrorProducts("Gagal memuat daftar produk: " + err.message);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Efek samping saat komponen dimuat atau tergantung pada state tertentu
  useEffect(() => {
    fetchProducts(); // Ambil produk saat komponen pertama kali dimuat
    // Fokus ke input barcode saat halaman dimuat
    if (barcodeRef.current) {
      barcodeRef.current.focus();
    }
  }, []); // Dependensi kosong berarti efek hanya berjalan sekali setelah render pertama

  // Fungsi untuk logout
  const handleLogout = () => {
    localStorage.removeItem("user"); // Hapus data user dari localStorage
    router.push("/auth"); // Redirect ke halaman login
  };

  // Fungsi untuk menangani input barcode (saat Enter ditekan)
  const handleBarcodeSubmit = async (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter" && barcodeInput.trim() !== "") {
      e.preventDefault(); // Mencegah form submit jika input di dalam form

      const scannedBarcode = barcodeInput.trim();
      // Cari produk berdasarkan barcode
      const productFound = products.find((p) => p.barcode === scannedBarcode);

      if (productFound) {
        addToCart(productFound); // Tambahkan ke keranjang
        setBarcodeInput(""); // Bersihkan input barcode
        toast.success(`Produk '${productFound.name}' ditambahkan via barcode!`);
      } else {
        toast.error(
          `Produk dengan barcode '${scannedBarcode}' tidak ditemukan.`
        );
      }
    }
  };

  // Fungsi untuk menambahkan produk ke keranjang
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        // Jika produk sudah ada di keranjang, tingkatkan kuantitas
        if (existingItem.quantity < product.stock) {
          // Pastikan tidak melebihi stok
          return prevCart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          toast.error(`Stok '${product.name}' tidak cukup.`);
          return prevCart;
        }
      } else {
        // Jika produk belum ada di keranjang, tambahkan sebagai item baru
        if (product.stock > 0) {
          // Pastikan ada stok
          return [...prevCart, { ...product, quantity: 1 }];
        } else {
          toast.error(`Stok '${product.name}' habis.`);
          return prevCart;
        }
      }
    });
  };

  // Fungsi untuk memperbarui kuantitas item di keranjang
  const updateCartQuantity = (productId: string, newQuantity: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === productId) {
            if (newQuantity <= 0) {
              return null; // Hapus item jika kuantitas <= 0
            }
            if (newQuantity > item.stock) {
              // Pastikan tidak melebihi stok
              toast.error(
                `Kuantitas '${item.name}' tidak boleh melebihi stok (${item.stock}).`
              );
              return item;
            }
            return { ...item, quantity: newQuantity }; // Perbarui kuantitas
          }
          return item;
        })
        .filter(Boolean) as CartItem[]; // Filter item yang dihapus (null)
    });
  };

  // Fungsi untuk menghapus item dari keranjang
  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  // Fungsi untuk menghitung total harga keranjang
  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  // Fungsi yang dipanggil saat tombol "Proses Pembayaran" diklik
  // Ini sekarang hanya memicu modal pembayaran
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Keranjang belanja kosong!");
      return;
    }
    setCurrentTransactionTotal(calculateTotal()); // Simpan total ke state untuk modal
    setIsPaymentModalOpen(true); // Buka modal pembayaran
  };

  // FUNGSI INI ADALAH INTI DARI PENYIMPANAN DATA PEMBAYARAN KE DATABASE
  // Dipanggil dari PaymentModal setelah detail pembayaran dikonfirmasi
  const handleProcessPayment = async (paymentDetails: {
    payment_method: string;
    amount_paid: number;
    change_given: number;
  }) => {
    console.log(
      "DEBUG: Menerima detail pembayaran dari modal:",
      paymentDetails
    ); // Log data dari modal

    try {
      // Dapatkan user yang login untuk mencatat kasir (opsional, jika Anda punya kolom cashier_id di sales)
      const storedUser = localStorage.getItem("user");
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      const cashierId = currentUser?.id || null;

      // Buat satu transaction_id unik untuk semua item di keranjang ini
      const transactionId = uuidv4();
      console.log(
        "DEBUG: Generated transactionId:",
        transactionId,
        typeof transactionId
      ); // Log UUID yang dihasilkan

      // Buat array item penjualan untuk dimasukkan ke database
      const salesToInsert = cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        sale_price: item.price,
        sale_date: new Date().toISOString(), // Catat tanggal & waktu penjualan
        payment_method: paymentDetails.payment_method, // Data dari modal
        amount_paid: paymentDetails.amount_paid, // Data dari modal
        change_given: paymentDetails.change_given, // Data dari modal
        transaction_id: transactionId, // UUID untuk mengelompokkan transaksi
        // cashier_id: cashierId, // Opsional: jika ada kolom ini di tabel sales
      }));

      console.log(
        "DEBUG: Data penjualan yang akan diinsert (sampel 1 item):",
        salesToInsert[0]
      ); // Log sampel data untuk insert

      // 1. Catat semua item penjualan sebagai satu transaksi ke tabel 'sales'
      const { error: salesError } = await supabase
        .from("sales")
        .insert(salesToInsert);
      if (salesError) {
        console.error("Error inserting sales to DB:", salesError);
        throw new Error(`Gagal mencatat penjualan: ${salesError.message}`);
      }

      // 2. Perbarui stok produk di tabel 'products'
      const updates = cart.map((item) => ({
        id: item.id,
        stock: item.stock - item.quantity,
      }));

      const updateResults = await Promise.allSettled(
        updates.map((update) =>
          supabase
            .from("products")
            .update({ stock: update.stock })
            .eq("id", update.id)
        )
      );

      const failedUpdates = updateResults.filter(
        (result) =>
          result.status === "rejected" ||
          (result.status === "fulfilled" && result.value.error)
      );

      if (failedUpdates.length > 0) {
        console.error("Gagal memperbarui stok beberapa produk:", failedUpdates);
        toast.error("Gagal memperbarui stok beberapa produk.");
      }

      // Notifikasi sukses dan reset UI
      toast.success("Pembayaran berhasil dicatat!");
      setCart([]); // Kosongkan keranjang
      setIsPaymentModalOpen(false); // Tutup modal pembayaran
      fetchProducts(); // Refresh daftar produk untuk mencerminkan stok terbaru
    } catch (error: any) {
      // Tangani error yang terjadi selama proses pembayaran
      console.error(
        "Error during payment processing (POSPage catch):",
        error.message
      );
      toast.error(`Gagal mencatat pembayaran: ${error.message}`);
    }
  };

  // Fungsi untuk memfilter produk (untuk pencarian)
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode &&
        product.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Fungsi format mata uang Rupiah
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    // Struktur utama halaman POS
    <div className="flex flex-col h-screen w-screen bg-gray-100 overflow-hidden">
      {/* Header kustom untuk halaman POS */}
      <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10 border-b border-gray-200">
        <div className="flex items-center">
          {/* Tombol kembali */}
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors mr-3 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Kembali"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">POS Sistem</h1>
        </div>
        <div className="flex items-center space-x-4">
          {/* Menampilkan nama pengguna dari localStorage */}
          <span className="text-gray-700 font-medium capitalize">
            {JSON.parse(localStorage.getItem("user") || "{}")?.username ||
              "Kasir"}
          </span>
          {/* Tombol logout */}
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-md transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Konten utama halaman POS (area pemilihan produk & keranjang) */}
      <main className="flex-1 flex flex-col md:flex-row bg-gray-100 p-6 md:p-8 gap-6 overflow-hidden">
        {/* Area Pemilihan Produk */}
        <div className="flex-1 bg-white rounded-lg shadow-xl p-4 flex flex-col min-h-[50vh] md:min-h-0">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Pilih Produk
          </h2>
          {/* Input barcode */}
          <div className="mb-4 relative">
            <input
              type="text"
              placeholder="Scan atau ketik Barcode produk..."
              className="w-full pl-10 pr-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={handleBarcodeSubmit}
              ref={barcodeRef}
            />
            <QrCodeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 text-blue-500" />
          </div>

          {/* Input pencarian produk */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Cari produk berdasarkan nama..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* Daftar produk yang bisa dipilih */}
          {isLoadingProducts ? (
            <LoadingSpinner />
          ) : errorProducts ? (
            <div className="text-center text-red-600">{errorProducts}</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center text-gray-500">
              Tidak ada produk ditemukan.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto flex-1 pr-3">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-gray-200 rounded-lg p-3 text-center cursor-pointer hover:shadow-lg transition-shadow duration-150 flex flex-col justify-between"
                  onClick={() => addToCart(product)}
                >
                  {/* Container untuk gambar dengan rasio aspek tetap (misalnya 1:1 atau 4:3) */}
                  {/* Pilihan 1: Rasio 1:1 (persegi) - pt-[100%] */}
                  {/* Pilihan 2: Rasio 4:3 - pt-[75%] */}
                  {/* Pilihan 3: Rasio 3:2 (lebih landscape sedikit) - pt-[66.66%] */}
                  <div className="w-full relative overflow-hidden rounded-md mb-2 pt-[100%] bg-gray-100">
                    {/* Menggunakan pt-[100%] untuk rasio 1:1. Anda bisa mencoba pt-[75%] jika ingin sedikit lebih lebar daripada tinggi */}
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="absolute top-0 left-0 w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `https://via.placeholder.com/150/F8F8F8/000000?text=${
                            product.name.split(" ")[0] || "Produk"
                          }`;
                          e.currentTarget.onerror = null;
                        }}
                      />
                    ) : (
                      <span className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        No Image
                      </span>
                    )}
                  </div>

                  <p className="font-semibold text-gray-800 text-base truncate mb-1">
                    {product.name}
                  </p>
                  <p className="text-blue-600 font-bold text-lg mb-1">
                    {formatCurrency(product.price)}
                  </p>
                  <p
                    className={`text-xs ${
                      product.stock === 0
                        ? "text-red-500 font-semibold"
                        : "text-gray-500"
                    }`}
                  >
                    Stok: {product.stock}
                  </p>
                </div>
              ))}
            </div>
          )}
          {/* Tombol refresh produk */}
          <button
            onClick={fetchProducts}
            className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg flex items-center justify-center transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" /> Refresh Produk
          </button>
        </div>

        {/* Area Keranjang Belanja */}
        <div className="w-full md:w-1/3 bg-white rounded-lg shadow-xl p-4 flex flex-col min-h-[50vh] md:min-h-0">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Keranjang Belanja
          </h2>
          {/* Daftar item di keranjang */}
          <div className="flex-1 overflow-y-auto mb-4 border-b border-gray-200 pb-4">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Keranjang kosong.
              </p>
            ) : (
              <ul>
                {cart.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex-1 mr-2">
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(item.price)} x {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() =>
                          updateCartQuantity(item.id, item.quantity - 1)
                        }
                        className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                        title="Kurangi kuantitas"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <span className="font-bold text-gray-800 w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateCartQuantity(item.id, item.quantity + 1)
                        }
                        className="p-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
                        title="Tambah kuantitas"
                        disabled={item.quantity >= item.stock}
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                        title="Hapus dari keranjang"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Total harga dan tombol pembayaran */}
          <div className="mt-auto">
            <div className="flex justify-between items-center text-2xl font-bold text-gray-900 mb-4">
              <span>Total:</span>
              <span>{formatCurrency(calculateTotal())}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={cart.length === 0}
            >
              <ShoppingCartIcon className="h-6 w-6 mr-2" /> Proses Pembayaran
            </button>
          </div>
        </div>
      </main>

      {/* Modal Pembayaran */}
      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          totalAmount={currentTransactionTotal}
          onPaymentSuccess={handleProcessPayment}
          cartItems={[]}
        />
      )}
    </div>
  );
}
