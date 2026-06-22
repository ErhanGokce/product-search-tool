"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  Calculator,
  ChartNoAxesCombined,
  LayoutDashboard,
  Settings,
  Store,
  Tags,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

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
    href: "/calculate/profit",
    icon: Calculator,
    label: "Kâr Hesapla",
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
    <>
      <SidebarHeader className="px-3 py-4">
        <div className="flex h-11 items-center gap-3 rounded-2xl bg-slate-950 px-3 text-white shadow-sm">
          <BarChart3 className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">
            Product Search
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3 pb-4">
        <SidebarMenu className="gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(pathname, item.href);

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  className="h-11 rounded-2xl px-3 text-slate-500 data-[active=true]:bg-slate-950 data-[active=true]:text-white data-[active=true]:shadow-sm hover:bg-slate-100 hover:text-slate-950"
                  isActive={isActive}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
