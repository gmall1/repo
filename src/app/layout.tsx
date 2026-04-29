import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Repo — Git hosting that doesn't go down",
  description:
    "A modern, reliable, self-hostable alternative to GitHub. Real Git, real reliability, AI-powered code review.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "Repo",
    description: "Git hosting that doesn't go down. Modern, reliable, self-hostable.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
