"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PackageCheck, ShoppingCart, SwatchBook, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();

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
      <nav className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border  text-xs">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all select-none text-xs",
                isActive
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <Icon className="size-3.5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
