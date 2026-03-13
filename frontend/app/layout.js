import "./globals.css";
import { AdminAuthProvider } from "@/context/AdminAuthContext";

export const metadata = {
  title: "Tijara Admin",
  description: "Tijara Admin Dashboard",
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