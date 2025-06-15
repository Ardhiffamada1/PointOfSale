import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !user) {
    return NextResponse.json(
      { success: false, message: "Email tidak ditemukan" },
      { status: 401 }
    );
  }

  if (user.password !== password) {
    return NextResponse.json(
      { success: false, message: "Password salah" },
      { status: 401 }
    );
  }

  // Sukses login, bisa simpan cookie/session nanti
  return NextResponse.json({ success: true, user });
}
