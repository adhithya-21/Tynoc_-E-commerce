import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Form & Field — Thoughtful things for everyday living",
  description: "Considered homewares, made slowly and meant to be lived with. Find your forever pieces at Form & Field.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
