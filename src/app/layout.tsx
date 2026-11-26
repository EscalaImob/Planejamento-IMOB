import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

/**
 * Montserrat — tipografia oficial do manual de marca (títulos, subtítulos, botões, corpo e rótulos).
 * Os arquivos são baixados no build e servidos pelo próprio site (sem requisição ao Google em tempo de uso).
 */
const montserrat = Montserrat({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-montserrat",
});

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
    <html lang="pt-BR" className={`h-full ${montserrat.variable}`}>
      <body className="min-h-full bg-white">{children}</body>
    </html>
  );
}
