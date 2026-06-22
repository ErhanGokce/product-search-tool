import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const marketplaces = ["Trendyol", "Hepsiburada", "Amazon"];

export function MarketplaceSettings() {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Pazaryeri Ayarları</CardTitle>
        <CardDescription>
          Pazaryeri bazlı komisyon, hizmet ve operasyon maliyeti varsayımları.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {marketplaces.map((marketplace) => (
            <div
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              key={marketplace}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                <label className="flex items-center gap-3 text-sm font-medium text-slate-700 lg:w-52">
                  <Checkbox defaultChecked id={`${marketplace}-active`} />
                  <span>{marketplace}</span>
                </label>

                <label className="min-w-0 flex-1 space-y-2 text-sm font-medium text-slate-700">
                  Komisyon oranı
                  <div className="relative">
                    <Input
                      className="h-11 rounded-2xl border-slate-200 bg-white pr-10"
                      inputMode="decimal"
                      max="100"
                      min="0"
                      placeholder="15"
                      step="0.01"
                      type="number"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      %
                    </span>
                  </div>
                </label>

                <label className="min-w-0 flex-1 space-y-2 text-sm font-medium text-slate-700">
                  Hizmet bedeli
                  <Input
                    className="h-11 rounded-2xl border-slate-200 bg-white"
                    inputMode="decimal"
                    min="0"
                    placeholder="0.00"
                    step="0.01"
                    type="number"
                  />
                </label>

                <label className="min-w-0 flex-1 space-y-2 text-sm font-medium text-slate-700">
                  Kargo payı
                  <Input
                    className="h-11 rounded-2xl border-slate-200 bg-white"
                    inputMode="decimal"
                    min="0"
                    placeholder="0.00"
                    step="0.01"
                    type="number"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
