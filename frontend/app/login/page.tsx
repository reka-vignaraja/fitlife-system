"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { saveToken, removeToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("fitlife_token");

    if (token) {
      setIsLoggedIn(true);
    }

    setChecking(false);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogout = () => {
    removeToken();
    setIsLoggedIn(false);
    router.push("/login");
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (data?.access_token) {
        saveToken(data.access_token);
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-black px-6 py-10 text-white">
        <div className="rounded-[28px] border border-orange-500/30 bg-[#111111] p-8 shadow-2xl">
          <h2 className="text-2xl font-extrabold text-orange-400">
            Checking...
          </h2>
          <p className="mt-2 text-slate-300">Please wait.</p>
        </div>
      </main>
    );
  }

  if (isLoggedIn) {
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-black px-6 py-10 text-white">
        <section className="w-full max-w-xl rounded-[32px] border border-orange-500/30 bg-[#111111] p-8 text-center shadow-2xl">
          <span className="inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-400">
            Already Logged In
          </span>

          <h1 className="mt-6 text-4xl font-extrabold text-white">
            You are already logged in
          </h1>

          <p className="mt-4 text-slate-300">
            You can continue to your FitLife dashboard or logout from your
            account.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-full bg-orange-500 px-6 py-3 font-bold text-black transition hover:bg-orange-400"
            >
              Go to Dashboard
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-full bg-red-500 px-6 py-3 font-bold text-white transition hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-black px-6 py-10 text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        {/* Left Content */}
        <section>
          <span className="inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-400">
            Welcome Back
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight md:text-6xl">
            Login to Continue Your{" "}
            <span className="text-orange-400">Health Progress</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
            Access your dashboard, BMI records, fitness logs, diet suggestions,
            wellness tracking, and goal progress.
          </p>

          <div className="mt-8 rounded-[28px] border border-orange-500/30 bg-white/5 p-6 backdrop-blur">
            <p className="text-sm font-bold text-orange-400">
              Today Reminder
            </p>

            <h3 className="mt-2 text-2xl font-bold text-white">
              Stay Consistent
            </h3>

            <p className="mt-3 leading-7 text-slate-300">
              Small daily actions like walking, drinking water, and tracking
              meals can improve your lifestyle over time.
            </p>
          </div>
        </section>

        {/* Login Form */}
        <section className="rounded-[32px] border border-orange-500/30 bg-[#111111] p-8 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-white">Login</h2>

            <p className="mt-2 text-slate-400">
              Enter your email and password to access your account.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-orange-400">
                Email Address
              </label>

              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-2xl border border-orange-500/30 bg-black px-4 py-4 font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-orange-400">
                Password
              </label>

              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-2xl border border-orange-500/30 bg-black px-4 py-4 font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-orange-500 px-6 py-4 font-extrabold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-bold text-orange-400">
              Register
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}