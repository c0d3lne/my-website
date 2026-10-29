import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GB Detailing | Mobile Car Valeting in Cambridge",
  description:
    "Mobile valeting and paint protection from GB Detailing across Ramsey, Huntingdon, St Ives, Peterborough, Cambridge and surrounding areas. Call or WhatsApp for a quote.",
  keywords: [
    "car detailing Cambridge",
    "mobile car valeting",
    "car cleaning Cambridgeshire",
    "GB Detailing",
    "exterior car clean",
    "interior car clean",
  ],
  openGraph: {
    title: "GB Detailing — Mobile Car Valeting",
    description:
      "Considered mobile valeting, paint care and detailing extras across Cambridgeshire.",
    type: "website",
    locale: "en_GB",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
