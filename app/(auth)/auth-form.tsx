import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AuthFormProps = {
  action: ComponentProps<"form">["action"];
  description: string;
  error?: string;
  submitLabel: string;
  title: string;
};

export function AuthForm({
  action,
  description,
  error,
  submitLabel,
  title,
}: AuthFormProps) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-50 px-4 py-12">
      <Card className="w-full max-w-md border-slate-200 shadow-[0_18px_70px_rgba(15,23,42,0.08)]">
        <CardHeader className="space-y-2">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="email"
              >
                Email
              </label>
              <Input
                autoComplete="email"
                id="email"
                name="email"
                placeholder="ornek@email.com"
                required
                type="email"
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="password"
              >
                Sifre
              </label>
              <Input
                autoComplete="current-password"
                id="password"
                minLength={6}
                name="password"
                placeholder="En az 6 karakter"
                required
                type="password"
              />
            </div>
            {error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <Button className="w-full" type="submit">
              {submitLabel}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
