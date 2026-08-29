"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AdminAuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setChecking(false);
      return;
    }

    const token = localStorage.getItem("fitlife_admin_token");

    if (!token) {
      localStorage.removeItem("fitlife_admin_email");
      router.replace("/admin/login");
      return;
    }

    const verifyAdminToken = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/admin/verify", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.detail || "Invalid admin token.");
        }

        setChecking(false);
      } catch {
        localStorage.removeItem("fitlife_admin_token");
        localStorage.removeItem("fitlife_admin_email");
        router.replace("/admin/login");
      }
    };

    verifyAdminToken();
  }, [pathname, router]);

  if (checking) {
    return (
      <main className="adminCheckingPage">
        <div className="adminCheckingBox">
          <div className="adminCheckingIcon">🔐</div>
          <h2>Verifying Admin Access</h2>
          <p>Please wait while FitLife checks your admin session.</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}