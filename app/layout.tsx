// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Listas de deseos familiares",
  description: "Crea y comparte listas de regalos con tu familia",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full bg-slate-50 text-slate-900">
        {/* El main ya NO centra nada. Solo da el espacio a los children */}
        <main className="h-full w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
