import { redirect } from "next/navigation";

import { CountriesSettings } from "@/components/settings/countries-settings";
import { CompanyExpensesSettings } from "@/components/settings/company-expenses-settings";
import { MarketplaceSettings } from "@/components/settings/marketplace-settings";
import { TaxSettings } from "@/components/settings/tax-settings";
import type {
  CompanyExpense,
  CountrySetting,
  MarketplaceSetting,
  TaxSetting,
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

  const [
    countriesResult,
    companyExpensesResult,
    taxSettingsResult,
    marketplaceSettingsResult,
  ] =
    await Promise.all([
    supabase
      .from("countries")
      .select("id,user_id,name,code,has_atr,notes,created_at")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
    supabase
      .from("company_expenses")
      .select("id,user_id,name,amount,amount_includes_vat,vat_rate,vat_deductible,period,is_active,notes,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("tax_settings")
      .select(
        "id,user_id,name,tax_type,rate,fixed_amount,period,is_active,notes,created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("marketplace_settings")
      .select(
        "id,user_id,marketplace,default_commission_rate,commission_base,default_commission_includes_vat,default_commission_vat_rate,default_shipping_cost,default_shipping_includes_vat,default_shipping_vat_rate,service_fee,service_fee_includes_vat,service_fee_vat_rate,payment_term_days,is_active,created_at",
      )
      .eq("user_id", user.id)
      .order("marketplace", { ascending: true }),
  ]);

  if (countriesResult.error) {
    throw new Error(`Ulkeler yuklenemedi: ${countriesResult.error.message}`);
  }

  if (companyExpensesResult.error) {
    throw new Error(
      `Sirket giderleri yuklenemedi: ${companyExpensesResult.error.message}`,
    );
  }

  if (taxSettingsResult.error) {
    throw new Error(
      `Vergi ayarlari yuklenemedi: ${taxSettingsResult.error.message}`,
    );
  }

  if (marketplaceSettingsResult.error) {
    throw new Error(
      `Pazaryeri ayarlari yuklenemedi: ${marketplaceSettingsResult.error.message}`,
    );
  }

  return (
    <div className="app-page">
      <div className="max-w-3xl space-y-2">
        <h2 className="text-2xl font-semibold tracking-normal text-foreground">
          Ayarlar
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
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
          <TaxSettings
            taxSettings={(taxSettingsResult.data ?? []) as TaxSetting[]}
          />
        </TabsContent>
        <TabsContent value="marketplaces">
          <MarketplaceSettings
            settings={
              (marketplaceSettingsResult.data ?? []) as MarketplaceSetting[]
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
