import type { Metadata } from "next";
import { Geist, Geist_Mono, Pacifico } from "next/font/google";
import "./globals.css";

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pacifico',
})

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Security Services Portal",
  description:
    "Staff rota, incident and CCTV reporting, site inspections, KPI tracking, and operational management for security teams.",
  icons: {
    icon: "https://readdy.ai/api/search-image?query=Modern%20minimalist%20security%20company%20brand%20icon%2C%20a%20single%20bold%20shield%20emblem%20in%20deep%20navy%20blue%20with%20a%20subtle%20teal%20gradient%2C%20featuring%20a%20small%20elegant%20gold%20keyhole%20detail%20at%20the%20center%2C%20clean%20flat%20vector%20illustration%20style%2C%20perfectly%20centered%20on%20a%20plain%20white%20background%2C%20crisp%20smooth%20edges%2C%20high%20contrast%2C%20professional%20corporate%20identity%20mark%20suitable%20for%20a%20website%20favicon%2C%20no%20text%2C%20no%20letters%2C%20simple%20geometric%20symmetrical%20design%2C%20trustworthy%20and%20secure%20appearance&width=128&height=128&seq=9001&orientation=squarish",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}