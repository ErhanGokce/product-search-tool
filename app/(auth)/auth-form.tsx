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
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-12 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(217,255,143,0.16),transparent_28%),radial-gradient(circle_at_80%_12%,rgba(52,245,181,0.12),transparent_24%)]" />
      <Card className="relative w-full max-w-md border-border bg-card/95 shadow-[0_28px_90px_rgba(0,0,0,0.4)] backdrop-blur">
        <CardHeader className="space-y-2">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-[0_16px_44px_rgba(217,255,143,0.18)]">
            PS
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-foreground"
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
                className="text-sm font-medium text-foreground"
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
              <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            ) : null}
            <Button className="h-11 w-full rounded-2xl" type="submit">
              {submitLabel}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
