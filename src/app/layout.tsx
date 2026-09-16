import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LSHOP Receiver",
  description: "Caixa de entrada.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        {children}
      </body>
    </html>
  );
}
