// app/components/AddProductModal.tsx
"use client"; // Pastikan ini ada

import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase"; // PERBAIKAN: Menggunakan default import
import { v4 as uuidv4 } from "uuid"; // Untuk nama file gambar unik

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onProductAdded,
}) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [barcode, setBarcode] = useState(""); // NEW: State untuk barcode
  const [imageFile, setImageFile] = useState<File | null>(null); // State untuk file gambar
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validasi sederhana: pastikan tipe file adalah gambar
      if (!file.type.startsWith("image/")) {
        toast.error("File yang diunggah harus berupa gambar.");
        setImageFile(null); // Reset file jika bukan gambar
        e.target.value = ""; // Kosongkan input file
        return;
      }
      setImageFile(file);
    } else {
      setImageFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock, 10);

    // Perbaikan Validasi: Tambahkan barcode ke validasi
    if (
      name.trim() === "" ||
      isNaN(parsedPrice) ||
      isNaN(parsedStock) ||
      parsedPrice <= 0 ||
      parsedStock < 0 ||
      barcode.trim() === "" // Barcode harus diisi
    ) {
      toast.error(
        "Pastikan semua bidang (Nama, Harga, Stok, Barcode) terisi dengan benar (harga harus positif, stok non-negatif)."
      );
      setIsSubmitting(false);
      return;
    }

    let imageUrl: string | null = null;
    let uploadedFilePath: string | null = null; // Untuk menyimpan path di Supabase Storage

    try {
      if (imageFile) {
        // Unggah gambar ke Supabase Storage
        const fileExtension = imageFile.name.split(".").pop();
        // PERBAIKAN: Gunakan uuidv4() untuk nama file unik
        const fileName = `${uuidv4()}.${fileExtension}`;
        // PERBAIKAN: Path di bucket (misal: 'products/namafileunik.jpg')
        const filePath = `products/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("product-images") // Nama bucket Anda
          .upload(filePath, imageFile, {
            cacheControl: "3600", // Cache 1 jam
            upsert: false, // Jangan timpa jika sudah ada
          });

        if (uploadError) {
          // PERBAIKAN: Penanganan error upload yang lebih baik
          console.error("Error uploading image (details):", uploadError);
          const errorMessage =
            (uploadError as any).message ||
            (uploadError as any).error ||
            (uploadError as any).details ||
            "Terjadi kesalahan tidak diketahui saat mengunggah gambar.";
          throw new Error(`Gagal mengunggah gambar: ${errorMessage}`);
        }

        uploadedFilePath = uploadData.path; // Simpan path yang dikembalikan oleh Supabase
        // PERBAIKAN: Dapatkan URL publik gambar menggunakan path yang dikembalikan
        imageUrl = supabase.storage
          .from("product-images")
          .getPublicUrl(uploadedFilePath).data.publicUrl;
      }

      // Masukkan data produk ke tabel products (termasuk image_url dan barcode)
      const { data, error } = await supabase.from("products").insert([
        {
          name: name.trim(),
          price: parsedPrice,
          stock: parsedStock,
          barcode: barcode.trim(), // NEW: Simpan barcode
          image_url: imageUrl, // Simpan URL gambar
        },
      ]);

      if (error) throw error;

      toast.success("Produk berhasil ditambahkan!");
      onProductAdded(); // Callback untuk memicu refresh list
      onClose();
      // Reset form
      setName("");
      setPrice("");
      setStock("");
      setBarcode(""); // Reset barcode
      setImageFile(null); // Reset file gambar
    } catch (error: any) {
      console.error("Error adding product:", error.message);
      toast.error(`Gagal menambahkan produk: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6 md:p-8 transform transition-all duration-300 scale-100 opacity-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
          Tambah Produk Baru
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Nama Produk
            </label>
            <input
              type="text"
              id="name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="price"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Harga (IDR)
            </label>
            <input
              type="number"
              id="price"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              step="0.01"
              required
            />
          </div>
          <div className="mb-4">
            {" "}
            {/* NEW: Input untuk Barcode */}
            <label
              htmlFor="barcode"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Barcode
            </label>
            <input
              type="text"
              id="barcode"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="stock"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Stok
            </label>
            <input
              type="number"
              id="stock"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="image"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Gambar Produk (Opsional)
            </label>
            <input
              type="file"
              id="image"
              accept="image/*" // Hanya menerima file gambar
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={handleFileChange}
            />
            {imageFile && (
              <p className="mt-2 text-sm text-gray-600">
                File terpilih: {imageFile.name}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-5 rounded-lg transition duration-150"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menambahkan..." : "Tambah Produk"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
