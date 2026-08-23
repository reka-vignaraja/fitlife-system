"use client";

import Link from "next/link";
import { MouseEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { removeToken } from "@/lib/auth";

type MenuItem = {
  name: string;
  path: string;
};

const healthLinks: MenuItem[] = [
  { name: "Profile", path: "/profile" },
  { name: "BMI Analysis", path: "/bmi" },
  { name: "Health Risk", path: "/health-risk" },
  { name: "Sleep Tracking", path: "/sleep-tracking" },
];

const nutritionLinks: MenuItem[] = [
  { name: "Diet Recommendation", path: "/diet-recommendation" },
  { name: "Nutrition Log", path: "/nutrition-log" },
];

const fitnessLinks: MenuItem[] = [
  { name: "AI Fitness Guider", path: "/fitness-tracking" },
  { name: "Goals", path: "/goals" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [openMenu, setOpenMenu] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("fitlife_token");
    setIsLoggedIn(!!token);
    setOpenMenu("");
  }, [pathname]);

  const handlePrivateLink = (
    e: MouseEvent<HTMLAnchorElement>,
    path: string
  ) => {
    e.preventDefault();

    const token = localStorage.getItem("fitlife_token");

    if (!token) {
      setIsLoggedIn(false);
      setOpenMenu("");
      router.push("/login");
      return;
    }

    setOpenMenu("");
    router.push(path);
  };

  const handleLogout = () => {
    removeToken();

    localStorage.removeItem("fitlife_token");
    localStorage.removeItem("fitlife_user");
    localStorage.removeItem("fitlife_profile");

    setIsLoggedIn(false);
    setOpenMenu("");

    router.push("/login");
  };

  const toggleMenu = (menuName: string) => {
    setOpenMenu((current) => (current === menuName ? "" : menuName));
  };

  const isActivePath = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const renderDropdown = (
    menuName: string,
    label: string,
    links: MenuItem[]
  ) => {
    const isOpen = openMenu === menuName;

    return (
      <div className="topNavDropdown">
        <button
          type="button"
          className={isOpen ? "topNavBtn topNavBtnActive" : "topNavBtn"}
          onClick={() => toggleMenu(menuName)}
        >
          {label} <span>{isOpen ? "⌃" : "⌄"}</span>
        </button>

        {isOpen && (
          <div className="topNavMenu">
            {links.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={(e) => handlePrivateLink(e, item.path)}
                className={
                  isActivePath(item.path)
                    ? "topNavMenuItem topNavMenuItemActive"
                    : "topNavMenuItem"
                }
              >
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <header className="navbar">
      <div className="navContainer">
        {/* Logo */}
        <Link href={isLoggedIn ? "/dashboard" : "/"} className="logoBox">
          <div className="logoIcon">F</div>

          <div>
            <h1>FitLife</h1>
            <p>AI Health Assistant</p>
          </div>
        </Link>

        {/* Center Navigation */}
        <nav className="navLinks">
          <Link href="/about">About</Link>

          {!isLoggedIn && <Link href="/features">Features</Link>}

          {isLoggedIn && (
            <>
              <Link
                href="/dashboard"
                onClick={(e) => handlePrivateLink(e, "/dashboard")}
                className={isActivePath("/dashboard") ? "navActiveLink" : ""}
              >
                Dashboard
              </Link>

              {renderDropdown("health", "Health", healthLinks)}
              {renderDropdown("nutrition", "Nutrition", nutritionLinks)}
              {renderDropdown("fitness", "Fitness", fitnessLinks)}

              <Link
                href="/progress-report"
                onClick={(e) => handlePrivateLink(e, "/progress-report")}
                className={
                  isActivePath("/progress-report") ? "navActiveLink" : ""
                }
              >
                Report
              </Link>
            </>
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