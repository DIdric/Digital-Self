import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Didric | Digital Self",
  description: "Voice-first conversational experience",
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
