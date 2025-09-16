// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import "./styles.css"; // your global CSS

export const metadata: Metadata = {
  title: "Contact sales | Granola",
  description: "Lead enrichment and routing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
