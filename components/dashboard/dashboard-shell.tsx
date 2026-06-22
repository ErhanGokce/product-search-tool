import { Bell, Search } from "lucide-react";

import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function DashboardShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TooltipProvider>
      <SidebarProvider
        defaultOpen
        style={
          {
            "--sidebar-width": "16rem",
            "--sidebar-width-icon": "4.75rem",
          } as React.CSSProperties
        }
      >
        <div className="flex min-h-svh w-full bg-slate-100 text-slate-950">
          <Sidebar
            className="border-r border-slate-200 bg-white/95 shadow-sm backdrop-blur"
            collapsible="icon"
          >
            <SidebarNav />
          </Sidebar>
          <SidebarInset className="bg-slate-100">
            <header className="sticky top-0 z-20 border-b border-slate-200 bg-slate-100/90 backdrop-blur">
              <div className="flex min-h-20 items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
                <SidebarTrigger className="rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase text-slate-500">
                    Dashboard
                  </p>
                  <h1 className="mt-1 truncate text-xl font-semibold tracking-normal text-slate-950">
                    Ürün Araştırması
                  </h1>
                </div>
                <div className="hidden w-full max-w-sm items-center sm:flex">
                  <div className="relative w-full">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <Input
                      className="h-11 rounded-2xl border-slate-200 bg-white pl-9 shadow-none"
                      placeholder="Urun, kategori veya rakip ara"
                      type="search"
                    />
                  </div>
                </div>
                <Button
                  aria-label="Bildirimler"
                  className="hidden h-11 w-11 rounded-2xl border-slate-200 bg-white p-0 text-slate-600 shadow-sm hover:bg-slate-50 sm:inline-flex"
                  type="button"
                  variant="outline"
                >
                  <Bell className="h-4 w-4" aria-hidden="true" />
                </Button>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-1.5 pr-3 shadow-sm">
                  <Avatar>
                    <AvatarFallback>EG</AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left leading-tight lg:block">
                    <p className="text-sm font-medium text-slate-950">
                      Erhan Gokce
                    </p>
                    <p className="text-xs text-slate-500">Admin</p>
                  </div>
                </div>
              </div>
              <div className="px-4 pb-4 sm:hidden">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <Input
                    className="h-11 rounded-2xl border-slate-200 bg-white pl-9 shadow-none"
                    placeholder="Ara"
                    type="search"
                  />
                </div>
              </div>
            </header>
            <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
