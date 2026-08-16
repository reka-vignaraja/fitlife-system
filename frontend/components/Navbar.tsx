"use client";

import Link from "next/link";
import { MouseEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { removeToken } from "@/lib/auth";

const moduleLinks = [
  {
    name: "Dashboard",
    path: "/dashboard",
  },
  {
    name: "Health Risk",
    path: "/health-risk",
  },
  {
    name: "BMI Analysis",
    path: "/bmi",
  },
  {
    name: "Diet Recommendation",
    path: "/diet-recommendation",
  },
  {
    name: "AI Fitness Guider",
    path: "/fitness-tracking",
  },
  {
    name: "Nutrition Log",
    path: "/nutrition-log",
  },
  {
    name: "Sleep Tracking",
    path: "/sleep-tracking",
  },
  {
    name: "Goals",
    path: "/goals",
  },
  {
    name: "Progress Report",
    path: "/progress-report",
  },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [modulesOpen, setModulesOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("fitlife_token");
    setIsLoggedIn(!!token);
    setModulesOpen(false);
  }, [pathname]);

  const handleModuleLink = (
    e: MouseEvent<HTMLAnchorElement>,
    path: string
  ) => {
    e.preventDefault();

    const token = localStorage.getItem("fitlife_token");

    if (!token) {
      setIsLoggedIn(false);
      setModulesOpen(false);
      router.push("/login");
      return;
    }

    setModulesOpen(false);
    router.push(path);
  };

  const handleLogout = () => {
    removeToken();

    localStorage.removeItem("fitlife_token");
    localStorage.removeItem("fitlife_user");
    localStorage.removeItem("fitlife_profile");

    setIsLoggedIn(false);
    setModulesOpen(false);

    router.push("/login");
  };

  return (
    <header className="navbar">
      <div className="navContainer">
        {/* Logo */}
        <Link href="/" className="logoBox">
          <div className="logoIcon">F</div>

          <div>
            <h1>FitLife</h1>
            <p>AI Health Assistant</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="navLinks">
          <Link href="/about">About</Link>
          <Link href="/features">Features</Link>

          {/* Modules only visible after login */}
          {isLoggedIn && (
            <div className="modulesDropdown">
              <button
                type="button"
                className="modulesBtn"
                onClick={() => setModulesOpen((prev) => !prev)}
              >
                Modules <span>⌄</span>
              </button>

              {modulesOpen && (
                <div className="modulesMenu">
                  {moduleLinks.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={(e) => handleModuleLink(e, item.path)}
                      className="modulesMenuItem"
                    >
                      <div>
                        <strong>{item.name}</strong>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Right Side Buttons */}
        <div className="navActions">
          {isLoggedIn ? (
            <>
              <Link href="/profile" className="profileBtn">
                Profile
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="btnLogout"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btnLogin">
                Login
              </Link>

              <Link href="/register" className="btnStart">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}