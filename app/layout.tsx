import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Employee Happiness Survey",
  description: "Happiness Survey",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
