import type { Metadata, Viewport } from "next";
import "@fontsource-variable/public-sans";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Service Book", template: "%s · Service Book" },
  description: "Attestation processes, translation and service prices for the sales team.",
};

export const viewport: Viewport = {
  themeColor: "#1d3a8a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
