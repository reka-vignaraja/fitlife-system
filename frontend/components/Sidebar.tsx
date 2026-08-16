"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Profile", href: "/profile" },
  { name: "BMI Analysis", href: "/bmi" },
  { name: "Diet Recommendation", href: "/diet-recommendation" },
  { name: "Fitness Tracking", href: "/fitness-tracking" },
  { name: "Nutrition Log", href: "/nutrition-log" },
  { name: "Mental Wellness", href: "/mental-wellness" },
  { name: "Goals", href: "/goals" },
  { name: "Sleep Tracking", href: "/sleep-tracking" },
  { name: "Trainers", href: "/trainers" },
  { name: "Reports", href: "/reports" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-72 border-r border-slate-200 bg-white p-5 lg:block">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-900">FitLife Panel</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage your health progress
        </p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-emerald-600 text-white"
                  : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}