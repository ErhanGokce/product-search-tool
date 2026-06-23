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
        <div className="flex h-11 items-center gap-3 rounded-2xl bg-primary px-3 text-primary-foreground shadow-[0_16px_42px_rgba(217,255,143,0.16)]">
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
                  className="h-11 rounded-2xl px-3 text-muted-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-[0_14px_34px_rgba(217,255,143,0.14)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
