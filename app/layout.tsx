import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fuseki-test — GraphDB vs Jena Fuseki",
  description:
    "Kjør en SPARQL-spørring mot begge endepunkter og sammenlign ytelse, responstid og responsinnhold.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="no">
      <body>{children}</body>
    </html>
  );
}
