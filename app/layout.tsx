import type { Metadata } from "next";
import { Geist, Roboto_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ModeToggle } from "@/components/toggle-theme";
import { Navbar } from "@/components/navbar";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Movement Stock",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/movementstock.png",
    apple: "/movementstock.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Movement Stock",
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
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        inter.variable,
        geistSans.variable,
        robotoMono.variable,
        "font-sans"
      )}
    >
      <body className="bg-[#F1F0EC] dark:bg-[#0a0a0a] min-h-screen font-sans flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Navbar />
          <div className="fixed bottom-4 right-4 z-50">
            <ModeToggle />
          </div>
          {children} <Toaster toastOptions={{ className: "font-[Geist]" }} />
        </ThemeProvider>
      </body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
      <Script
        defer
        src="https://cloud.umami.is/script.js"
        data-website-id="dca05189-0fef-4e80-b295-27636e9fc96f"
      ></Script>
    </html>
  );
}
