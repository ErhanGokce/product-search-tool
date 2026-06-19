import { Bell, Search } from "lucide-react";

import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-svh bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-19 border-r border-slate-200 bg-white/95 shadow-sm backdrop-blur md:flex">
        <SidebarNav />
      </aside>
      <div className="md:pl-19">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-slate-100/90 backdrop-blur">
          <div className="flex min-h-20 items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
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
      </div>
    </div>
  );
}
