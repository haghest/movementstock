"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PackageCheck, SwatchBook } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();

  useEffect(() => {
    const iconPath = pathname === "/cmd" ? "/cmd-favicon.ico" : "/movementstock.png";
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

  if (pathname?.startsWith("/track")) {
    return null;
  }



  const navItems = [
    {
      name: "Movement Stock",
      href: "/",
      icon: PackageCheck,
    },
    {
      name: "Custom Express",
      href: "/cmd",
      icon: SwatchBook,
    },
  ];

  return (
    <header className="w-full py-4 no-print flex justify-center">
      <nav className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border text-xs bg-white dark:bg-background">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors select-none",
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
              <span className="relative z-10">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

