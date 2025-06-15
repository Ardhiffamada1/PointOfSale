// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

export default function LoginPage(): React.JSX.Element {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, email, role, password")
        .eq("email", email)
        .single(); // Gunakan .single() karena email UNIQUE

      if (profileError || !profileData) {
        throw new Error("Kredensial login tidak valid.");
      }

      if (profileData.password !== password) {
        throw new Error("Kredensial login tidak valid.");
      }

      localStorage.setItem(
        "user",
        JSON.stringify({
          id: profileData.id,
          username: profileData.username,
          email: profileData.email,
          role: profileData.role,
        })
      );

      toast.success("Login berhasil!");

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login failed:", error.message);
      toast.error(`Login gagal: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-3xl w-full max-w-sm transform transition-transform duration-300 hover:scale-[1.02]">
        <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-2 tracking-tight">
          Masuk
        </h2>
        <p className="text-center text-gray-600 mb-8 text-lg">
          Selamat datang kembali!
        </p>
        <form onSubmit={handleLogin}>
          <div className="mb-5">
            <label
              htmlFor="email"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-3 focus:ring-indigo-400 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="emailanda@contoh.com"
              required
            />
          </div>
          <div className="mb-7">
            <label
              htmlFor="password"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Kata Sandi
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-3 focus:ring-indigo-400 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-250 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Memproses...
              </>
            ) : (
              "Login"
            )}
          </button>
          <div className="text-center mt-6 text-sm">
            <a href="#" className="text-indigo-600 hover:underline font-medium">
              Lupa Kata Sandi?
            </a>
            <span className="mx-3 text-gray-400">|</span>
            <a href="#" className="text-indigo-600 hover:underline font-medium">
              Belum punya akun? Daftar
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
