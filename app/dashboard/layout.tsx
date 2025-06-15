// app/dashboard/(main-dashboard)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/Layout/Sidebar";
import Header from "@/app/components/Layout/Header";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { User } from "@/app/types";
import { toast } from "react-hot-toast";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function MainDashboardLayout({
  children,
}: DashboardLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false); // NEW: State untuk sidebar mobile

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    setIsLoading(true);

    if (!storedUser) {
      console.log(
        "MainDashboardLayout: No user data found in localStorage. Redirecting to /auth."
      );
      router.push("/auth");
    } else {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (
          parsedUser &&
          parsedUser.id &&
          parsedUser.email &&
          parsedUser.role
        ) {
          setUser(parsedUser);
        } else {
          console.error(
            "MainDashboardLayout: Stored user data is malformed. Clearing localStorage."
          );
          localStorage.removeItem("user");
          router.push("/auth");
        }
      } catch (error) {
        console.error(
          "MainDashboardLayout: Failed to parse user from localStorage. Clearing localStorage.",
          error
        );
        localStorage.removeItem("user");
        router.push("/auth");
      } finally {
        setIsLoading(false);
      }
    }
  }, [router]);

  const toggleSidebar = () => {
    // NEW: Fungsi untuk toggle sidebar
    setIsSidebarOpen(!isSidebarOpen);
  };

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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - akan disembunyikan di mobile secara default */}
      <Sidebar
        user={user}
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      {/* Overlay gelap saat sidebar terbuka di mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={toggleSidebar} // Tutup sidebar saat overlay diklik
        ></div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} toggleSidebar={toggleSidebar} />{" "}
        {/* Teruskan toggleSidebar ke Header */}
        {children}
      </div>
    </div>
  );
}
