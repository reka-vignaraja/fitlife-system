import type { Metadata } from "next";
import "./globals.css";
import "./theme.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "FitLife | AI-Powered Health and Fitness Assistant",
  description:
    "FitLife is a professional AI-powered health and fitness web application.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}