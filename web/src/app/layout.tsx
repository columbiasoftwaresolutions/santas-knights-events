import type { Metadata } from "next";
import { Archivo, Hanken_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const hanken = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin"] });
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Free NYC Events",
  description: "Browse free events and resources across New York City.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${hanken.variable} ${archivo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <header className="bg-ink text-bone border-b-2 border-red">
          <div className="max-w-5xl mx-auto w-full px-4 py-4 flex items-baseline justify-between">
            <Link href="/" className="font-display font-bold text-lg tracking-tight">
              Santa&apos;s Knights <span className="text-amber">· Free NYC Events</span>
            </Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
