// app/dashboard/pos/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { Product } from "@/app/types";
import {
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  ShoppingCartIcon,
  ArrowPathIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "@/app/components/LoadingSpinner";

interface CartItem extends Product {
  quantity: number;
}

export default function POSPage(): React.JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [errorProducts, setErrorProducts] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [barcodeInput, setBarcodeInput] = useState<string>("");
  const barcodeRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    setErrorProducts(null);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setProducts(data as Product[]);
    } catch (err: any) {
      console.error("Gagal memuat produk untuk POS:", err.message);
      setError("Gagal memuat daftar produk: " + err.message);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    if (barcodeRef.current) {
      barcodeRef.current.focus();
    }
  }, []);

  const handleBarcodeSubmit = async (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter" && barcodeInput.trim() !== "") {
      e.preventDefault();

      const scannedBarcode = barcodeInput.trim();
      const productFound = products.find((p) => p.barcode === scannedBarcode);

      if (productFound) {
        addToCart(productFound);
        setBarcodeInput("");
        toast.success(`Produk '${productFound.name}' ditambahkan via barcode!`);
      } else {
        toast.error(
          `Produk dengan barcode '${scannedBarcode}' tidak ditemukan.`
        );
      }
    }
  };

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity < product.stock) {
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
        if (product.stock > 0) {
          return [...prevCart, { ...product, quantity: 1 }];
        } else {
          toast.error(`Stok '${product.name}' habis.`);
          return prevCart;
        }
      }
    });
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === productId) {
            if (newQuantity <= 0) {
              return null;
            }
            if (newQuantity > item.stock) {
              toast.error(
                `Kuantitas '${item.name}' tidak boleh melebihi stok (${item.stock}).`
              );
              return item;
            }
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Keranjang belanja kosong!");
      return;
    }

    try {
      const salesToInsert = cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        sale_price: item.price,
      }));

      const { error: salesError } = await supabase
        .from("sales")
        .insert(salesToInsert);
      if (salesError) throw salesError;

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

      toast.success("Pembayaran berhasil dicatat!");
      setCart([]);
      fetchProducts();
    } catch (error: any) {
      console.error("Error during checkout:", error.message);
      toast.error(`Gagal mencatat pembayaran: ${error.message}`);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode &&
        product.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <main className="flex-1 flex flex-col lg:flex-row bg-gray-50 p-4 md:p-6 lg:space-x-6 space-y-4 lg:space-y-0">
        {/* Product Selection Area */}
        <div className="flex-1 bg-white rounded-xl shadow-lg p-4 flex flex-col min-h-[50vh] lg:min-h-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3 border-gray-100">
            Pilih Produk
          </h2>
          {/* Input Barcode */}
          <div className="mb-4 relative">
            <input
              type="text"
              placeholder="Scan atau ketik Barcode produk..."
              className="w-full pl-10 pr-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base lg:text-lg font-medium transition-all duration-200"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={handleBarcodeSubmit}
              ref={barcodeRef}
            />
            <QrCodeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 text-blue-500" />
          </div>

          {/* Search Input (tetap ada untuk pencarian manual) */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Cari produk berdasarkan nama..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isLoadingProducts ? (
            <LoadingSpinner className="h-8 w-8 text-blue-500 mx-auto my-auto" />
          ) : errorProducts ? (
            <div className="text-center text-red-600 py-8 text-lg font-medium">
              {errorProducts}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-lg">
              Tidak ada produk ditemukan.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto flex-1 pr-2 pb-2">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center cursor-pointer hover:bg-blue-100 transition duration-150 shadow-sm hover:shadow-md transform hover:-translate-y-1"
                  onClick={() => addToCart(product)}
                >
                  <p className="font-semibold text-gray-800 text-sm md:text-base truncate">
                    {product.name}
                  </p>
                  <p className="text-blue-600 font-bold mt-1 text-lg md:text-xl">
                    {formatCurrency(product.price)}
                  </p>
                  <p
                    className={`text-xs md:text-sm mt-1 ${
                      product.stock === 0
                        ? "text-red-500 font-bold"
                        : "text-gray-500"
                    }`}
                  >
                    Stok: {product.stock}
                  </p>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={fetchProducts}
            className="mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg flex items-center justify-center transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" /> Refresh Produk
          </button>
        </div>

        {/* Shopping Cart Area */}
        {/* Perbaikan utama di sini: min-h-full dan layout flex-col */}
        <div className="w-full lg:w-1/3 bg-white rounded-xl shadow-lg p-4 flex flex-col h-auto lg:min-h-auto">
          {" "}
          {/* Changed h-auto for better content fit */}
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3 border-gray-100">
            Keranjang Belanja
          </h2>
          {/* Bagian daftar item keranjang yang bisa discroll */}
          <div className="flex-1 overflow-y-auto mb-4 pr-1">
            {" "}
            {/* Removed border-b here */}
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8 text-lg">
                Keranjang kosong. Tambahkan produk!
              </p>
            ) : (
              <ul>
                {cart.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0 group"
                  >
                    <div className="flex-1 pr-2">
                      <p className="font-semibold text-gray-800 text-base">
                        {item.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(item.price)} x {item.quantity}
                      </p>
                      <p className="text-sm text-gray-500 font-medium">
                        Total: {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() =>
                          updateCartQuantity(item.id, item.quantity - 1)
                        }
                        className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transform hover:scale-105 transition-all duration-150"
                        title="Kurangi kuantitas"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <span className="font-bold text-gray-800 text-base w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateCartQuantity(item.id, item.quantity + 1)
                        }
                        className="p-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transform hover:scale-105 transition-all duration-150"
                        title="Tambah kuantitas"
                        disabled={item.quantity >= item.stock}
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transform hover:scale-105 transition-all duration-150"
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
          {/* Bagian total dan tombol pembayaran yang tetap terlihat */}
          <div className="pt-4 border-t border-gray-200 mt-auto">
            {" "}
            {/* mt-auto ensures it sticks to bottom */}
            <div className="flex justify-between items-center text-2xl font-extrabold text-gray-900 mb-4">
              <span>Total Pembayaran:</span>
              <span>{formatCurrency(calculateTotal())}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:ring-offset-2"
              disabled={cart.length === 0}
            >
              <ShoppingCartIcon className="h-6 w-6 mr-2" /> Proses Pembayaran
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
