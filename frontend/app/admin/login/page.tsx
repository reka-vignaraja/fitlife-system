"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("admin@fitlife.com");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.detail || "Invalid admin email or password.");
      }

      localStorage.setItem("fitlife_admin_token", data.token);
      localStorage.setItem("fitlife_admin_email", data.admin.email);

      router.push("/admin/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Admin login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="adminLoginPage">
      <section className="adminLoginShell">
        <div className="adminLoginIntro">
          <span>FitLife Admin</span>

          <h1>Admin Control Panel</h1>

          <p>
            Monitor users, reports, AI-supported modules and overall FitLife
            system activity through a secure admin dashboard.
          </p>

          <div className="adminLoginInfoBox">
            <strong>Backend Connected Login</strong>
            <p>
              Admin credentials are now checked using the FastAPI backend
              instead of frontend hardcoded validation.
            </p>
          </div>
        </div>

        <form className="adminLoginCard" onSubmit={handleLogin}>
          <span>Secure Admin Login</span>

          <h2>Login</h2>

          <p>Enter admin credentials to continue.</p>

          {error && <div className="adminErrorBox">{error}</div>}

          <label>Email Address</label>
          <input
            type="email"
            value={email}
            placeholder="admin@fitlife.com"
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            placeholder="Enter admin password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Checking..." : "Login as Admin"}
          </button>

          <small>Backend admin login enabled</small>
        </form>
      </section>
    </main>
  );
}