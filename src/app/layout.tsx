import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { NavigationTransitionOverlay } from "@/components/layout/NavigationTransitionOverlay";
import "./globals.css";

const outfit = localFont({
  src: "./fonts/outfit-latin.woff2",
  weight: "600 700",
  style: "normal",
  variable: "--font-outfit",
  display: "swap",
});

const plusJakartaSans = localFont({
  src: "./fonts/plus-jakarta-sans-latin.woff2",
  weight: "400 700",
  style: "normal",
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: "./fonts/jetbrains-mono-latin.woff2",
  weight: "500 600",
  style: "normal",
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "VIRA CHAVE",
  description:
    "Plataforma de descoberta vocacional, capacitação e portfólio prático para estudantes do ensino médio.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${outfit.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased">
        {children}
        <Suspense fallback={null}>
          <NavigationTransitionOverlay />
        </Suspense>
      </body>
    </html>
  );
}
