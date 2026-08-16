"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type ProtectedRouteProps = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("fitlife_token");

    if (!token) {
      setAllowed(false);
      setChecking(false);

      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    setAllowed(true);
    setChecking(false);
  }, [router, pathname]);

  if (checking) {
    return (
      <main className="authCheckingPage">
        <div className="authCheckingBox">
          <h2>Checking access...</h2>
          <p>Please wait while we verify your login session.</p>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="authCheckingPage">
        <div className="authCheckingBox">
          <h2>Login required</h2>
          <p>Please login to continue using FitLife features.</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}