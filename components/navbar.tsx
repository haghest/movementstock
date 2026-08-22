"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PackageCheck, SwatchBook, Receipt, LogOut, LogIn, ReceiptText } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const iconPath = pathname?.startsWith("/nota") || pathname === "/cmd" ? "/cmd-favicon.ico" : "/movementstock.png";
    const links = document.querySelectorAll("link[rel*='icon']");
    if (links.length > 0) {
      links.forEach((link) => {
        (link as HTMLLinkElement).href = iconPath;
      });
    } else {
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = iconPath;
      document.head.appendChild(link);
    }
  }, [pathname]);

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserEmail(data.user.email || null);
      }
    }
    checkUser();
  }, []);

  // Hide Navbar on public /track page, /login page, and /cmd/widget
  if (pathname?.startsWith("/track") || pathname?.startsWith("/login") || pathname?.startsWith("/cmd/widget")) {
    return null;
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserEmail(null);
    router.push("/login");
    router.refresh();
  }

  const navItems = [
    {
      name: "Movement",
      shortName: "Movement",
      href: "/",
      icon: PackageCheck,
    },
    {
      name: "Nota",
      shortName: "Nota",
      href: "/nota",
      icon: ReceiptText,
    },
    {
      name: "Express",
      shortName: "Express",
      href: "/cmd",
      icon: SwatchBook,
    },

  ];

  return (
    <header className="w-full py-2.5 px-3 sm:px-6 no-print border-b bg-background/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* LEFT: Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img src="/movementstock.png" alt="TTTM Logo" className="size-8 sm:size-10 object-contain" />
        </Link>

        {/* MIDDLE: Pages Navigation */}
        <nav className="flex items-center gap-0.5 sm:gap-1 bg-muted/60 p-1 rounded-xl border text-xs bg-background ' max-w-full overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg font-semibold transition-colors select-none shrink-0",
                  isActive
                    ? "text-white dark:text-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-pill"
                    className="absolute inset-0 bg-black dark:bg-white rounded-lg shadow-2xs"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="relative z-10 size-3.5" />
                <span className="relative z-10 hidden sm:inline">{item.name}</span>
                <span className="relative z-10 inline sm:hidden text-[11px] font-bold">{item.shortName}</span>
              </Link>
            );
          })}
        </nav>

        {/* RIGHT: Logout / Login Button */}
        <div className="flex items-center gap-2 shrink-0">
          {userEmail ? (
            <div className="flex items-center gap-2">
              {/* <span className="text-xs text-muted-foreground hidden md:inline-block font-mono">
                {userEmail}
              </span> */}
              <Button
                variant="outline"
                size="default"
                onClick={handleLogout}
                className=" text-xs gap-1.5  hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 px-2.5 sm:px-3"
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" asChild className="h-8 text-xs gap-1.5 rounded-xl px-2.5 sm:px-3">
              <Link href="/login">
                <LogIn className="size-3.5" />
                <span className="hidden sm:inline">Login</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
