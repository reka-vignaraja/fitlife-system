"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const adminLinks = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: "📊",
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: "👥",
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: "📄",
  },
  {
    label: "AI Modules",
    href: "/admin/modules",
    icon: "🤖",
  },
];

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    const savedEmail =
      localStorage.getItem("fitlife_admin_email") || "admin@fitlife.com";

    setAdminEmail(savedEmail);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("fitlife_admin_token");
    localStorage.removeItem("fitlife_admin_email");

    router.push("/admin/login");
  };

  if (pathname === "/admin/login") {
    return null;
  }

  return (
    <header className="adminOnlyNav">
      <div className="adminOnlyNavInner">
        <Link href="/admin/dashboard" className="adminOnlyBrand">
          <span>F</span>

          <div>
            <strong>FitLife Admin</strong>
            <small>{adminEmail}</small>
          </div>
        </Link>

        <nav className="adminOnlyLinks">
          {adminLinks.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive
                    ? "adminOnlyLink adminOnlyLinkActive"
                    : "adminOnlyLink"
                }
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="adminOnlyLogout"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}