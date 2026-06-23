"use client";

import { useActionState, useState } from "react";

import { saveMarketplaceSetting } from "@/app/dashboard/settings/actions";
import {
  marketplaces,
  type Marketplace,
} from "@/components/product-pool/types";
import type {
  ActionState,
  CommissionBase,
  MarketplaceSetting,
} from "@/components/settings/types";
import { commissionBases } from "@/components/settings/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

type MarketplaceSettingsProps = {
  settings: MarketplaceSetting[];
};

const initialActionState: ActionState = { ok: false };

const commissionBaseLabels: Record<CommissionBase, string> = {
  gross_sale_price: "KDV dahil satış fiyatı",
  net_sale_price: "KDV hariç satış fiyatı",
};

function getInputValue(value: number | string | null | undefined, fallback = "") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function getSetting(
  settings: MarketplaceSetting[],
  marketplace: Marketplace,
) {
  return (
    settings.find(
      (setting) => setting.marketplace === marketplace && setting.is_active,
    ) ??
    settings.find((setting) => setting.marketplace === marketplace) ??
    null
  );
}

function MarketplaceSettingForm({
  marketplace,
  setting,
}: {
  marketplace: Marketplace;
  setting: MarketplaceSetting | null;
}) {
  const [state, formAction, pending] = useActionState(
    saveMarketplaceSetting,
    initialActionState,
  );
  const selectedCommissionBase = commissionBases.includes(
    setting?.commission_base as CommissionBase,
  )
    ? (setting?.commission_base as CommissionBase)
    : "gross_sale_price";
  const [isActive, setIsActive] = useState(setting?.is_active ?? true);
  const [commissionIncludesVat, setCommissionIncludesVat] = useState(
    setting?.default_commission_includes_vat ?? false,
  );
  const [serviceFeeIncludesVat, setServiceFeeIncludesVat] = useState(
    setting?.service_fee_includes_vat ?? false,
  );
  const [shippingIncludesVat, setShippingIncludesVat] = useState(
    setting?.default_shipping_includes_vat ?? false,
  );

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
    >
      {setting ? <input name="id" type="hidden" value={setting.id} /> : null}
      <input name="marketplace" type="hidden" value={marketplace} />
      {isActive ? <input name="is_active" type="hidden" value="on" /> : null}
      {commissionIncludesVat ? (
        <input name="default_commission_includes_vat" type="hidden" value="on" />
      ) : null}
      {serviceFeeIncludesVat ? (
        <input name="service_fee_includes_vat" type="hidden" value="on" />
      ) : null}
      {shippingIncludesVat ? (
        <input name="default_shipping_includes_vat" type="hidden" value="on" />
      ) : null}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-950">
            <Checkbox
              checked={isActive}
              onCheckedChange={(value) => setIsActive(value === true)}
              type="button"
            />
            <span>{marketplace}</span>
          </label>
          <p className="text-xs text-slate-500">
            {setting ? "Kayıtlı varsayımlar" : "Varsayılan kayıt oluşturulacak"}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Komisyon oranı
            <Input
              className="h-11 rounded-2xl border-slate-200 bg-white"
              defaultValue={getInputValue(setting?.default_commission_rate)}
              inputMode="decimal"
              max="100"
              min="0"
              name="default_commission_rate"
              placeholder="15"
              step="0.01"
              type="number"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Komisyon matrahı
            <Select defaultValue={selectedCommissionBase} name="commission_base">
              <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {commissionBases.map((commissionBase) => (
                  <SelectItem key={commissionBase} value={commissionBase}>
                    {commissionBaseLabels[commissionBase]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Komisyon KDV %
            <Input
              className="h-11 rounded-2xl border-slate-200 bg-white"
              defaultValue={getInputValue(
                setting?.default_commission_vat_rate,
                "20",
              )}
              inputMode="decimal"
              min="0"
              name="default_commission_vat_rate"
              placeholder="20"
              step="0.01"
              type="number"
            />
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
            <Checkbox
              checked={commissionIncludesVat}
              onCheckedChange={(value) =>
                setCommissionIncludesVat(value === true)
              }
              type="button"
            />
            <span>
              <span className="block font-medium text-slate-950">
                Komisyon KDV dahil
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Kapalıysa komisyon KDV’si ayrıca hesaplanır.
              </span>
            </span>
          </label>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Hizmet bedeli
            <Input
              className="h-11 rounded-2xl border-slate-200 bg-white"
              defaultValue={getInputValue(setting?.service_fee)}
              inputMode="decimal"
              min="0"
              name="service_fee"
              placeholder="0.00"
              step="0.01"
              type="number"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Hizmet KDV %
            <Input
              className="h-11 rounded-2xl border-slate-200 bg-white"
              defaultValue={getInputValue(setting?.service_fee_vat_rate, "20")}
              inputMode="decimal"
              min="0"
              name="service_fee_vat_rate"
              placeholder="20"
              step="0.01"
              type="number"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Kargo payı
            <Input
              className="h-11 rounded-2xl border-slate-200 bg-white"
              defaultValue={getInputValue(setting?.default_shipping_cost)}
              inputMode="decimal"
              min="0"
              name="default_shipping_cost"
              placeholder="0.00"
              step="0.01"
              type="number"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Kargo KDV %
            <Input
              className="h-11 rounded-2xl border-slate-200 bg-white"
              defaultValue={getInputValue(
                setting?.default_shipping_vat_rate,
                "20",
              )}
              inputMode="decimal"
              min="0"
              name="default_shipping_vat_rate"
              placeholder="20"
              step="0.01"
              type="number"
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
            <Checkbox
              checked={serviceFeeIncludesVat}
              onCheckedChange={(value) =>
                setServiceFeeIncludesVat(value === true)
              }
              type="button"
            />
            <span>Hizmet bedeli KDV dahil</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
            <Checkbox
              checked={shippingIncludesVat}
              onCheckedChange={(value) => setShippingIncludesVat(value === true)}
              type="button"
            />
            <span>Kargo payı KDV dahil</span>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Ödeme vadesi
            <Input
              className="h-11 rounded-2xl border-slate-200 bg-white"
              defaultValue={getInputValue(setting?.payment_term_days, "28")}
              inputMode="numeric"
              min="0"
              name="payment_term_days"
              type="number"
            />
          </label>
        </div>

        {state.error ? (
          <p className="text-sm text-red-600">{state.error}</p>
        ) : null}
        {state.ok ? (
          <p className="text-sm text-emerald-700">Pazaryeri ayarı kaydedildi.</p>
        ) : null}

        <div>
          <Button className="rounded-2xl" disabled={pending} type="submit">
            {pending ? "Kaydediliyor" : "Kaydet"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function MarketplaceSettings({ settings }: MarketplaceSettingsProps) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Pazaryeri Ayarları</CardTitle>
        <CardDescription>
          Kâr hesabında kullanılan komisyon matrahı, komisyon KDV’si, kargo ve
          hizmet bedeli varsayımlarını yönetin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {marketplaces.map((marketplace) => (
            <MarketplaceSettingForm
              key={marketplace}
              marketplace={marketplace}
              setting={getSetting(settings, marketplace)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
