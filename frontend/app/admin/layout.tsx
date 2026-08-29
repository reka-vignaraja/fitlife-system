import type { ReactNode } from "react";
import AdminNavbar from "@/components/AdminNavbar";
import AdminAuthGuard from "@/components/AdminAuthGuard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthGuard>
      <AdminNavbar />
      {children}
    </AdminAuthGuard>
  );
}