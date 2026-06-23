import Link from "next/link";
import { ArrowRight, BarChart3, Calculator, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Search,
    title: "Ürün araştırması",
    description: "Pazaryeri adaylarını talep, rekabet ve fiyat sinyalleriyle izleyin.",
  },
  {
    icon: BarChart3,
    title: "Fırsat skoru",
    description: "Satıcı yoğunluğu, talep ve indirim avantajını tek ekranda görün.",
  },
  {
    icon: Calculator,
    title: "Kâr hesaplama",
    description: "Vergi, komisyon ve gider paylarıyla senaryo bazlı marj çıkarın.",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(217,255,143,0.16),transparent_26%),radial-gradient(circle_at_78%_10%,rgba(52,245,181,0.14),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_34%)]" />
      <div className="relative mx-auto flex min-h-svh w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-[0_16px_44px_rgba(217,255,143,0.18)]">
              PS
            </div>
            <div>
              <p className="text-sm font-semibold">Product Search</p>
              <p className="text-xs text-muted-foreground">Dark analytics workspace</p>
            </div>
          </div>
          <Button asChild className="rounded-2xl" variant="outline">
            <Link href="/login">Giriş yap</Link>
          </Button>
        </header>

        <section className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1fr_0.8fr]">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              E-ticaret ürün araştırması ve kâr analizi
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-normal text-foreground sm:text-5xl lg:text-6xl">
              Koyu, hızlı ve net bir ürün karar paneli.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              Ürün havuzu, kategori bazlı vergi/komisyon ayarları ve kâr
              senaryolarını tek bir modern SaaS çalışma alanında yönetin.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-11 rounded-2xl px-5">
                <Link href="/login">
                  Başla
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild className="h-11 rounded-2xl px-5" variant="outline">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-border bg-card/90 p-4 shadow-[0_34px_110px_rgba(0,0,0,0.42)] backdrop-blur">
            <div className="grid gap-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;

                return (
                  <div
                    className="rounded-2xl border border-border bg-surface-elevated p-4"
                    key={feature.title}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          0{index + 1}
                        </p>
                        <h2 className="mt-1 text-lg font-semibold">
                          {feature.title}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
