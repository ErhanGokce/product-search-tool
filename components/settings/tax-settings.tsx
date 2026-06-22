import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const taxFields = [
  {
    label: "KDV oranı",
    placeholder: "20",
  },
  {
    label: "Gümrük vergisi",
    placeholder: "12",
  },
  {
    label: "Stopaj oranı",
    placeholder: "0",
  },
  {
    label: "Kâr vergisi",
    placeholder: "25",
  },
];

export function TaxSettings() {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Vergiler</CardTitle>
        <CardDescription>
          Net kâr ve ithalat maliyeti hesaplarında kullanılacak vergi oranları.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5 lg:grid-cols-2">
          {taxFields.map((field) => (
            <label
              className="space-y-2 text-sm font-medium text-slate-700"
              key={field.label}
            >
              {field.label}
              <div className="relative">
                <Input
                  className="h-11 rounded-2xl border-slate-200 pr-10"
                  inputMode="decimal"
                  max="100"
                  min="0"
                  placeholder={field.placeholder}
                  step="0.01"
                  type="number"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  %
                </span>
              </div>
            </label>
          ))}
        </form>
      </CardContent>
    </Card>
  );
}
