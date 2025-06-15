// app/components/Layout/Header.tsx
"use client";

import {
  BellIcon,
  UserCircleIcon,
  Bars3Icon, // NEW: Import Bars3Icon untuk hamburger
} from "@heroicons/react/24/outline";
import { User } from "@/app/types";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import React from "react";

interface HeaderProps {
  user: User | null;
  toggleSidebar: () => void; // NEW: Prop untuk toggle sidebar
}

export default function Header({
  user,
  toggleSidebar,
}: HeaderProps): React.JSX.Element {
  // Terima toggleSidebar
  const pathname = usePathname();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tombol kembali tidak perlu di halaman dashboard utama
  const showBackButton = pathname !== "/dashboard";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleLogout = async () => {
    localStorage.removeItem("user");
    window.location.href = "/auth";
  };

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10 border-b border-gray-200">
      <div className="flex items-center">
        {/* Hamburger menu untuk mobile */}
        <button
          onClick={toggleSidebar} // NEW: Panggil toggleSidebar
          className="p-2 rounded-full hover:bg-gray-100 transition-colors mr-3 text-gray-600 hover:text-gray-800 md:hidden focus:outline-none focus:ring-2 focus:ring-blue-500" // Hanya tampil di mobile
          title="Buka Menu"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        {/* Tombol Kembali (hanya tampil jika bukan di dashboard utama dan desktop) */}
        {showBackButton && (
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors mr-3 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 hidden md:block" // Hanya tampil di desktop
            title="Kembali"
          ></button>
        )}
      </div>
      <div className="flex items-center space-x-4">
        {/* Info Pengguna & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-expanded={isDropdownOpen ? "true" : "false"}
            aria-haspopup="true"
          >
            <span className="text-gray-700 font-medium hidden sm:block mr-2 capitalize">
              {user?.username || "Pengguna"}
            </span>
            <UserCircleIcon className="h-8 w-8 text-gray-400 hover:text-gray-600 cursor-pointer" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 ring-1 ring-black ring-opacity-5">
              <div className="block px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                <p className="font-semibold">{user?.username}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <p className="text-xs text-gray-500 capitalize">
                  Peran: {user?.role}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
