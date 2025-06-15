// app/components/Layout/Sidebar.tsx
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  CubeIcon,
  BanknotesIcon,
  UsersIcon,
  DocumentTextIcon,
  XMarkIcon,
  RocketLaunchIcon, // Contoh ikon baru untuk logo
} from "@heroicons/react/24/outline";
import { User } from "@/app/types";
// import { supabase } from "@/lib/supabase"; // Tidak digunakan di sini, bisa dihapus jika memang tidak diperlukan

interface SidebarProps {
  user: User;
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, isOpen, toggleSidebar }) => {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: HomeIcon,
      roles: ["admin", "cashier", "manager"],
    },
    {
      name: "Manajemen Produk",
      href: "/dashboard/products",
      icon: CubeIcon,
      roles: ["admin", "manager"],
    },
    {
      name: "Sistem POS",
      href: "/pos-system", // Tetap menunjuk ke /pos-system
      icon: BanknotesIcon,
      roles: ["admin", "cashier", "manager"],
    },
    {
      name: "Riwayat Penjualan",
      href: "/dashboard/sales-history",
      icon: DocumentTextIcon,
      roles: ["admin", "manager"],
    },
    {
      name: "Manajemen Pengguna",
      href: "/dashboard/users",
      icon: UsersIcon,
      roles: ["admin"],
    },
  ];

  const handleLogout = async () => {
    // Pastikan ini ditangani di sisi klien
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      window.location.href = "/auth";
    }
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-800 text-slate-300 shadow-2xl rounded-r-xl
        transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:flex md:flex-col
        ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      <div className="flex items-center justify-between h-20 border-b border-slate-700 px-4">
        <div className="flex items-center">
          <RocketLaunchIcon className="h-8 w-8 text-teal-400 mr-2" />{" "}
          {/* Ikon untuk logo */}
          <span className="text-2xl font-extrabold text-teal-400">
            Kasir App
          </span>
        </div>
        {/* Tombol tutup untuk mobile */}
        <button
          onClick={toggleSidebar}
          className="md:hidden text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-700 transition-colors duration-200"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      <nav className="flex-1 px-4 py-6">
        <ul>
          {navItems.map((item) => {
            if (!item.roles.includes(user.role)) {
              return null;
            }

            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.name} className="mb-2">
                <Link
                  href={item.href}
                  className={`flex items-center py-2 px-4 rounded-lg transition-all duration-200 ease-in-out
                    ${
                      isActive
                        ? "bg-teal-600 text-white shadow-md" // Warna aktif yang menonjol
                        : "hover:bg-slate-700 hover:text-white"
                    }
                  `}
                  onClick={toggleSidebar}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-slate-700">
        <div className="mb-4">
          <p className="text-sm text-slate-400">
            Logged in as:{" "}
            <span className="font-semibold text-teal-300 capitalize">
              {user.role}
            </span>
          </p>
          <p className="text-xs text-slate-500">({user.username})</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-150 ease-in-out transform hover:scale-105"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
