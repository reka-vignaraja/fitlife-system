"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailFromUrl = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromUrl);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!email || !otp) {
      setError("Please enter your email and OTP.");
      return;
    }

    if (otp.length !== 6) {
      setError("OTP must be 6 digits.");
      return;
    }

    try {
      setLoading(true);

      const data = await apiRequest("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
        }),
      });

      setMessage(data?.message || "Email verified successfully.");

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setMessage("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setResendLoading(true);

      const data = await apiRequest("/api/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      setMessage(data?.message || "New OTP sent successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-4 py-10 text-white">
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        {/* Left Content */}
        <section>
          <span className="inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-400">
            Email Verification
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight text-white md:text-6xl">
            Secure Your{" "}
            <span className="text-orange-400">FitLife Account</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
            Enter the 6-digit OTP sent to your email address. Your account will
            be activated only after successful email verification.
          </p>

          <div className="mt-8 rounded-3xl border border-orange-500/30 bg-white/5 p-6 shadow-sm backdrop-blur">
            <h3 className="text-xl font-bold text-white">Why verify email?</h3>

            <p className="mt-2 text-slate-300">
              Email verification helps protect your account and prevents
              unverified users from accessing FitLife features.
            </p>
          </div>
        </section>

        {/* Verify Form */}
        <section className="rounded-[32px] border border-orange-500/30 bg-[#111111] p-8 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-white">
              Verify Email
            </h2>

            <p className="mt-2 text-slate-400">
              Enter your email address and OTP code.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-5 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-300">
              {message}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-orange-400">
                Email Address
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-orange-500/30 bg-black px-4 py-4 font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-orange-400">
                OTP Code
              </label>

              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="w-full rounded-2xl border border-orange-500/30 bg-black px-4 py-4 font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-orange-500 px-6 py-4 font-extrabold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </form>

          <button
            type="button"
            onClick={handleResendOTP}
            disabled={resendLoading}
            className="mt-4 w-full rounded-full border border-orange-500/40 bg-transparent px-6 py-4 font-extrabold text-orange-400 transition hover:bg-orange-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resendLoading ? "Sending OTP..." : "Resend OTP"}
          </button>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already verified?{" "}
            <Link href="/login" className="font-bold text-orange-400">
              Login
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}