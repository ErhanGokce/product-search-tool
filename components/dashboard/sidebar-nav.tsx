"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ChartNoAxesCombined,
  LayoutDashboard,
  Settings,
  Store,
  Tags,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    href: "/dashboard/product-pool",
    icon: Boxes,
    label: "Urun Havuzu",
  },
  {
    href: "/dashboard/categories",
    icon: Tags,
    label: "Kategoriler",
  },
  {
    href: "/dashboard/competitors",
    icon: Store,
    label: "Rakipler",
  },
  {
    href: "/dashboard/analytics",
    icon: ChartNoAxesCombined,
    label: "Analizler",
  },
  {
    href: "/dashboard/settings",
    icon: Settings,
    label: "Ayarlar",
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col items-center gap-2 px-3 py-4">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
        <BarChart3 className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Erhan Product Search</span>
      </div>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = isActivePath(pathname, item.href);

        return (
          <Link
            aria-label={item.label}
            className={cn(
              "group relative flex h-11 w-11 items-center justify-center rounded-2xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950",
              isActive && "bg-slate-950 text-white shadow-sm hover:bg-slate-950 hover:text-white",
            )}
            href={item.href}
            key={item.href}
            title={item.label}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="pointer-events-none absolute left-14 z-20 hidden whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
