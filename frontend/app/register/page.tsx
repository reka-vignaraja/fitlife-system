"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

function EyeIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6" />
      <path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c6.5 0 10 8 10 8a18.5 18.5 0 0 1-3.1 4.5" />
      <path d="M6.1 6.1C3.4 8 2 12 2 12s3.5 8 10 8a10.4 10.4 0 0 0 5.9-1.8" />
    </svg>
  );
}

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
  const [success, setSuccess] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    setSuccess("");

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

      setSuccess(
        "Account created successfully. OTP sent to your email address."
      );

      setTimeout(() => {
        router.push(
          `/verify-email?email=${encodeURIComponent(
            formData.email.trim().toLowerCase()
          )}`
        );
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-4 py-8 text-white">
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left Content */}
        <section className="py-4">
          <span className="inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-400">
            Create Your FitLife Account
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-tight text-white md:text-5xl">
            Start Your Smart{" "}
            <span className="text-orange-400">Health Journey</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
            Register to use BMI analysis, diet recommendation, fitness tracking,
            nutrition logging, mental wellness support, sleep tracking, goals,
            and your personal health dashboard.
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-orange-500/30 bg-white/5 p-5 shadow-sm backdrop-blur">
              <h3 className="text-lg font-bold text-white">Personalized</h3>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Get suggestions based on your health profile.
              </p>
            </div>

            <div className="rounded-2xl border border-orange-500/30 bg-white/5 p-5 shadow-sm backdrop-blur">
              <h3 className="text-lg font-bold text-white">Track Progress</h3>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Monitor fitness, diet, sleep, goals, and wellness.
              </p>
            </div>
          </div>
        </section>

        {/* Register Form */}
        <section className="mx-auto w-full max-w-md rounded-[24px] border border-orange-500/30 bg-[#111111]/95 p-6 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-white">Register</h2>

            <p className="mt-2 text-sm text-slate-400">
              Fill your details to create a new account.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-300">
              {success}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-orange-400">
                Full Name
              </label>

              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-orange-500/30 bg-black px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-orange-400">
                Email Address
              </label>

              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-orange-500/30 bg-black px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-orange-400">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-orange-500/30 bg-black px-4 py-3 pr-12 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/20"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-400 transition hover:text-orange-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-orange-400">
                Confirm Password
              </label>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-orange-500/30 bg-black px-4 py-3 pr-12 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/20"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-400 transition hover:text-orange-300"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || Boolean(success)}
              className="mt-2 w-full rounded-full bg-orange-500 px-6 py-3 text-sm font-extrabold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-400">
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