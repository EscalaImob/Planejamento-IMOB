import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Planejamento Estratégico 2027 · Escala IMOB",
  description:
    "Planejamento de aquisição para corretores de imóveis: seus números de 2026, os canais de venda e a meta de 2027. Estimativas, sem garantia de resultado.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0106fe",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full bg-white">{children}</body>
    </html>
  );
}
