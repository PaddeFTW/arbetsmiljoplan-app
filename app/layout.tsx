import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arbetsmiljöplan | Quality WorX",
  description: "Digital arbetsmiljöplan för byggprojekt – risker, skyddsåtgärder och export.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
