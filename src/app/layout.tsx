import type { Metadata } from "next";
import { Epilogue, Manrope } from "next/font/google";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { obtenerSesion } from "@/lib/session";
import "./globals.css";

const epilogue = Epilogue({
  variable: "--font-epilogue",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "PandoCBA",
  description: "Tienda de ropa urbana en Córdoba.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sesion = await obtenerSesion();
  const esAdmin = sesion?.rol === "admin";

  return (
    <html
      lang="es"
      className={`${epilogue.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header sesionIniciada={Boolean(sesion)} esAdmin={esAdmin} />
        <main className="mx-auto w-full max-w-[1280px] flex-1 pt-20">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
