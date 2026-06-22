import { CountriesSettings } from "@/components/settings/countries-settings";
import { CompanyExpensesSettings } from "@/components/settings/company-expenses-settings";
import { MarketplaceSettings } from "@/components/settings/marketplace-settings";
import { TaxSettings } from "@/components/settings/tax-settings";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="max-w-3xl space-y-2">
        <h2 className="text-2xl font-semibold tracking-normal text-slate-950">
          Ayarlar
        </h2>
        <p className="text-sm leading-6 text-slate-500">
          Kâr hesaplama, ithalat maliyeti, pazaryeri komisyonları ve şirket
          giderleri için temel ayarları yönetin.
        </p>
      </div>

      <Tabs className="space-y-4" defaultValue="countries">
        <div className="overflow-x-auto pb-1">
          <TabsList className="w-max min-w-full justify-start sm:min-w-0">
            <TabsTrigger value="countries">Ülkeler</TabsTrigger>
            <TabsTrigger value="expenses">Şirket Giderleri</TabsTrigger>
            <TabsTrigger value="taxes">Vergiler</TabsTrigger>
            <TabsTrigger value="marketplaces">Pazaryeri Ayarları</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="countries">
          <CountriesSettings />
        </TabsContent>
        <TabsContent value="expenses">
          <CompanyExpensesSettings />
        </TabsContent>
        <TabsContent value="taxes">
          <TaxSettings />
        </TabsContent>
        <TabsContent value="marketplaces">
          <MarketplaceSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
