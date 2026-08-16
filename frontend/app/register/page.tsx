"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("fitlife_token");

    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.email || !formData.password) {
      setError("Please fill all required fields.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      });

      router.push(
        `/verify-email?email=${encodeURIComponent(
          formData.email.trim().toLowerCase()
        )}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-4 py-10 text-white">
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        {/* Left Content */}
        <section>
          <span className="inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-400">
            Create Your FitLife Account
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight text-white md:text-6xl">
            Start Your Smart{" "}
            <span className="text-orange-400">Health Journey</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
            Register to use BMI analysis, diet recommendation, fitness tracking,
            nutrition logging, mental wellness support, sleep tracking, goals,
            and your personal health dashboard.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-orange-500/30 bg-white/5 p-6 shadow-sm backdrop-blur">
              <h3 className="text-xl font-bold text-white">Personalized</h3>

              <p className="mt-2 text-slate-300">
                Get suggestions based on your health profile.
              </p>
            </div>

            <div className="rounded-3xl border border-orange-500/30 bg-white/5 p-6 shadow-sm backdrop-blur">
              <h3 className="text-xl font-bold text-white">Track Progress</h3>

              <p className="mt-2 text-slate-300">
                Monitor fitness, diet, sleep, goals, and wellness.
              </p>
            </div>
          </div>
        </section>

        {/* Register Form */}
        <section className="rounded-[32px] border border-orange-500/30 bg-[#111111] p-8 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-white">Register</h2>

            <p className="mt-2 text-slate-400">
              Fill your details to create a new account.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-orange-400">
                Full Name
              </label>

              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-2xl border border-orange-500/30 bg-black px-4 py-4 font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/20"
              />
            </div>

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
                placeholder="Create password"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-2xl border border-orange-500/30 bg-black px-4 py-4 font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-orange-400">
                Confirm Password
              </label>

              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-2xl border border-orange-500/30 bg-black px-4 py-4 font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-orange-500 px-6 py-4 font-extrabold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-orange-400">
              Login
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}