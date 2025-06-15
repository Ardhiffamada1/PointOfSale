// app/dashboard/(pos-system)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { User } from "@/app/types";
import { toast } from "react-hot-toast";

interface PosLayoutProps {
  children: React.ReactNode;
}

export default function PosLayout({ children }: PosLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    setIsLoading(true);

    if (!storedUser) {
      router.push("/auth");
    } else {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (
          parsedUser &&
          parsedUser.id &&
          parsedUser.email &&
          parsedUser.role &&
          ["admin", "cashier", "manager"].includes(parsedUser.role)
        ) {
          setUser(parsedUser);
        } else {
          toast.error("Akses ke Sistem POS tidak diizinkan.");
          localStorage.removeItem("user");
          router.push("/auth");
        }
      } catch (error) {
        console.error(
          "PosLayout: Failed to parse user from localStorage.",
          error
        );
        localStorage.removeItem("user");
        router.push("/auth");
      } finally {
        setIsLoading(false);
      }
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">
          Sesi tidak valid, mengarahkan ke login...
        </div>
      </div>
    );
  }

  return (
    // Layout ini TIDAK memiliki Sidebar dan Header.
    // Hanya ada div pembungkus utama, dan konten halaman POS (children) akan dirender di dalamnya.
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col overflow-hidden">
        {children} {/* Konten halaman POS (pos/page.tsx) */}
      </div>
    </div>
  );
}
