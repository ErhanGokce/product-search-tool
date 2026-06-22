import { redirect } from "next/navigation";

import { CountriesSettings } from "@/components/settings/countries-settings";
import { CompanyExpensesSettings } from "@/components/settings/company-expenses-settings";
import { MarketplaceSettings } from "@/components/settings/marketplace-settings";
import { TaxSettings } from "@/components/settings/tax-settings";
import type {
  CompanyExpense,
  CountrySetting,
} from "@/components/settings/types";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [countriesResult, companyExpensesResult] = await Promise.all([
    supabase
      .from("countries")
      .select("id,user_id,name,code,has_atr,notes,created_at")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
    supabase
      .from("company_expenses")
      .select("id,user_id,name,amount,period,is_active,notes,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (countriesResult.error) {
    throw new Error(`Ulkeler yuklenemedi: ${countriesResult.error.message}`);
  }

  if (companyExpensesResult.error) {
    throw new Error(
      `Sirket giderleri yuklenemedi: ${companyExpensesResult.error.message}`,
    );
  }

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
          <CountriesSettings
            countries={(countriesResult.data ?? []) as CountrySetting[]}
          />
        </TabsContent>
        <TabsContent value="expenses">
          <CompanyExpensesSettings
            expenses={(companyExpensesResult.data ?? []) as CompanyExpense[]}
          />
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
