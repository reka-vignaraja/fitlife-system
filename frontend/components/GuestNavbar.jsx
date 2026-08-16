"use client";

import Link from "next/link";
import "./Navbar.css";

export default function GuestNavbar() {
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


        {/* Guest Navigation */}
        <nav className="navLinks">

          <Link href="/">
            Home
          </Link>



          <Link href="/contact">
            Contact
          </Link>

          <Link href="/login" className="loginBtn">
            Login
          </Link>

          <Link href="/register" className="registerBtn">
            Register
          </Link>

        </nav>

      </div>
    </header>
  );
}