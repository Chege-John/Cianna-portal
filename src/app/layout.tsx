import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { SchoolProvider } from "@/context/SchoolContext";
import { AuthProvider } from "@/context/AuthContext";
import { Providers } from "@/components/Providers";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Cianna Portal - Deutsch-Institut",
  description: "Das Verwaltungs- und Rechnungsportal des Cianna Deutsch-Instituts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={figtree.variable}>
      <body className="font-sans antialiased">
        <Providers>
          <SchoolProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </SchoolProvider>
        </Providers>
      </body>
    </html>
  );
}

