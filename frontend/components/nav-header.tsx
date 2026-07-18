"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/maquinas", label: "Máquinas" },
];

export function NavHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-6 border-b bg-background px-6">
      <div className="text-sm font-bold tracking-tight">
        🚜 Analitica <span className="font-normal text-muted-foreground">· Frota</span>
      </div>
      <nav className="flex gap-1">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent",
              pathname === link.href && "bg-accent text-foreground"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
