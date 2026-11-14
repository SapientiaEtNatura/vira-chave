import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VIRA CHAVE",
  description:
    "Plataforma de descoberta vocacional, capacitação e portfólio prático para estudantes do ensino médio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
