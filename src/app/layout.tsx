// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "./convex-client-provider";

export const metadata: Metadata = {
  title: "Contact sales",
  description: "Lead enrichment and routing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
