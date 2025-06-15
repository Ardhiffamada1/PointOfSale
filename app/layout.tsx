// app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast"; // Import Toaster

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="text/javascript"
          src={`https://app.sandbox.midtrans.com/snap/snap.js`}
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
          defer // Defer loading untuk performa yang lebih baik
        ></script>
      </head>
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" reverseOrder={false} />
      </body>
    </html>
  );
}
