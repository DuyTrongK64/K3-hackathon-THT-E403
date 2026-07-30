import type { Metadata } from "next";
import { Be_Vietnam_Pro, Manrope } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "vietnamese"],
});

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "VinCareer Insight AI — Chọn đúng nơi, đi đúng hướng";
  const description =
    "Prototype AI tra cứu công ty, phân tích JD, so sánh Tech Stack và đánh giá Fit Score dành cho sinh viên.";

  return {
    title,
    description,
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "vi_VN",
      images: [
        {
          url: `${origin}/og.png`,
          width: 1734,
          height: 907,
          alt: "VinCareer Insight AI — Chọn đúng nơi. Đi đúng hướng.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${manrope.variable} ${beVietnam.variable}`}>
        {children}
      </body>
    </html>
  );
}
