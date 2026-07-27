import "./globals.css";
import { AdminAuthProvider } from "@/context/AdminAuthContext";

export const metadata = {
  title: "Tijara Admin",
  description: "Tijara Admin Dashboard",
  icons: {
    icon: "/images/tijarawhite.png",
    shortcut: "/images/tijarawhite.png",
    apple: "/images/tijarawhite.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white">
        <AdminAuthProvider>
          {children}
        </AdminAuthProvider>
      </body>
    </html>
  );
}