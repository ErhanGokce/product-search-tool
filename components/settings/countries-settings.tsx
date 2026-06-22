import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CountriesSettings() {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Ülkeler</CardTitle>
        <CardDescription>
          Satış, tedarik ve ithalat maliyeti hesaplarında kullanılacak ülke ve
          para birimi tercihleri.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5 lg:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Satış ülkesi
            <Select defaultValue="tr">
              <SelectTrigger className="h-11 rounded-2xl border-slate-200">
                <SelectValue placeholder="Satış ülkesi seç" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tr">Türkiye</SelectItem>
                <SelectItem value="de">Almanya</SelectItem>
                <SelectItem value="uk">Birleşik Krallık</SelectItem>
                <SelectItem value="us">Amerika Birleşik Devletleri</SelectItem>
              </SelectContent>
            </Select>
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Tedarik ülkesi
            <Select defaultValue="cn">
              <SelectTrigger className="h-11 rounded-2xl border-slate-200">
                <SelectValue placeholder="Tedarik ülkesi seç" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cn">Çin</SelectItem>
                <SelectItem value="tr">Türkiye</SelectItem>
                <SelectItem value="de">Almanya</SelectItem>
                <SelectItem value="us">Amerika Birleşik Devletleri</SelectItem>
              </SelectContent>
            </Select>
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Varsayılan para birimi
            <Select defaultValue="try">
              <SelectTrigger className="h-11 rounded-2xl border-slate-200">
                <SelectValue placeholder="Para birimi seç" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="try">TRY</SelectItem>
                <SelectItem value="usd">USD</SelectItem>
                <SelectItem value="eur">EUR</SelectItem>
                <SelectItem value="gbp">GBP</SelectItem>
              </SelectContent>
            </Select>
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Varsayılan kur
            <Input
              className="h-11 rounded-2xl border-slate-200"
              inputMode="decimal"
              min="0"
              placeholder="0.00"
              step="0.01"
              type="number"
            />
          </label>
        </form>
      </CardContent>
    </Card>
  );
}
