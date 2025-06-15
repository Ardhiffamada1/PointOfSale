// app/types/index.ts

export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "cashier" | "manager";
  // ... properti lain jika ada
}

export interface Product {
  quantity: any;
  barcode: string;
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

// NEW: SalesItem (Detail produk dalam satu transaksi penjualan)
export interface SalesItem {
  id: string; // ID item penjualan di tabel 'sales_items' jika ada, atau ID penjualan jika item digabung
  product_id: string;
  quantity: number;
  sale_price: number; // Harga jual produk saat itu
  // Opsional: Untuk menampilkan nama produk, kita bisa JOIN atau menambahkannya saat fetching
  product_name?: string; // Akan diisi dari tabel products
}

// NEW: Sale (Transaksi penjualan secara keseluruhan)
export interface Sale {
  id: string; // ID penjualan dari tabel 'sales'
  sale_date: string; // Waktu penjualan
  total_amount: number; // Total harga transaksi ini
  // Opsional: jika ingin menampilkan kasir yang melayani
  cashier_id?: string;
  cashier_name?: string; // Akan diisi dari tabel profiles
  sale_price: number; // Harga jual per unit saat transaksi
  created_at: string;
  items: SalesItem[]; // Daftar produk yang terjual dalam transaksi ini
}

export interface RevenueSummary {
  totalRevenue: number;
  revenueToday: number;
  averageRevenuePerProduct: number;
}
