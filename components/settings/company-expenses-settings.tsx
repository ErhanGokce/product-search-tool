import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const expenseFields = [
  {
    label: "Aylık sabit gider",
    placeholder: "25000",
  },
  {
    label: "Operasyon gideri",
    placeholder: "7500",
  },
  {
    label: "Paketleme gideri",
    placeholder: "15",
  },
  {
    label: "Kargo operasyon payı",
    placeholder: "30",
  },
];

export function CompanyExpensesSettings() {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Şirket Giderleri</CardTitle>
        <CardDescription>
          Kâr hesabı sırasında ürün maliyetine dağıtılacak sabit ve değişken
          gider kalemleri.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5 lg:grid-cols-2">
          {expenseFields.map((field) => (
            <label
              className="space-y-2 text-sm font-medium text-slate-700"
              key={field.label}
            >
              {field.label}
              <Input
                className="h-11 rounded-2xl border-slate-200"
                inputMode="decimal"
                min="0"
                placeholder={field.placeholder}
                step="0.01"
                type="number"
              />
            </label>
          ))}
        </form>
      </CardContent>
    </Card>
  );
}
