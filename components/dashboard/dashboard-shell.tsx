import { Bell, Search } from "lucide-react";

import { ProfileMenu } from "@/components/dashboard/profile-menu";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
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
        <div className="flex min-h-svh w-full overflow-x-hidden bg-background text-foreground">
          <Sidebar
            className="border-r border-sidebar-border bg-sidebar/95 shadow-[18px_0_80px_rgba(0,0,0,0.18)] backdrop-blur"
            collapsible="icon"
          >
            <SidebarNav />
          </Sidebar>
          <SidebarInset className="min-w-0 overflow-x-hidden bg-background">
            <header className="sticky top-0 z-30 w-full border-b border-border bg-background/86 backdrop-blur-xl">
              <div className="flex min-h-20 min-w-0 items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
                <SidebarTrigger className="rounded-2xl border border-border bg-card text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Dashboard
                  </p>
                  <h1 className="mt-1 truncate text-xl font-semibold tracking-normal text-foreground">
                    Ürün Araştırması
                  </h1>
                </div>
                <div className="hidden min-w-0 w-full max-w-sm items-center sm:flex">
                  <div className="relative w-full">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      className="h-11 rounded-2xl border-border bg-card pl-9 shadow-none"
                      placeholder="Urun, kategori veya rakip ara"
                      type="search"
                    />
                  </div>
                </div>
                <Button
                  aria-label="Bildirimler"
                  className="hidden h-11 w-11 rounded-2xl border-border bg-card p-0 text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground sm:inline-flex"
                  type="button"
                  variant="outline"
                >
                  <Bell className="h-4 w-4" aria-hidden="true" />
                </Button>
                <ProfileMenu />
              </div>
              <div className="px-4 pb-4 sm:hidden">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    className="h-11 rounded-2xl border-border bg-card pl-9 shadow-none"
                    placeholder="Ara"
                    type="search"
                  />
                </div>
              </div>
            </header>
            <main className="min-w-0 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
