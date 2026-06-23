"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Monitor, Moon, Sun } from "lucide-react";

import { logout } from "@/app/(auth)/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type ThemeMode = "light" | "dark" | "system";

const themeOptions: {
  value: ThemeMode;
  label: string;
  icon: typeof Sun;
}[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Sistem", icon: Monitor },
];

function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  const storedTheme = window.localStorage.getItem("theme");

  if (
    storedTheme === "light" ||
    storedTheme === "dark" ||
    storedTheme === "system"
  ) {
    return storedTheme;
  }

  return "dark";
}

function applyTheme(theme: ThemeMode) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolvedTheme = theme === "system" ? (prefersDark ? "dark" : "light") : theme;

  document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  document.documentElement.dataset.theme = theme;
  document.cookie = `theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
  window.localStorage.setItem("theme", theme);
}

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function syncSystemTheme() {
      if (getStoredTheme() === "system") {
        applyTheme("system");
      }
    }

    mediaQuery.addEventListener("change", syncSystemTheme);

    return () => mediaQuery.removeEventListener("change", syncSystemTheme);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("pointerdown", handlePointerDown);
    }

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function handleThemeChange(nextTheme: ThemeMode) {
    setTheme(nextTheme);
  }

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-1.5 pr-3 text-left shadow-sm transition hover:bg-muted"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground">
            EG
          </AvatarFallback>
        </Avatar>
        <div className="hidden leading-tight lg:block">
          <p className="text-sm font-medium text-foreground">
            Erhan Gokce
          </p>
          <p className="text-xs text-muted-foreground">Admin</p>
        </div>
        <ChevronDown className="hidden h-4 w-4 text-muted-foreground lg:block" />
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-72 rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-2xl shadow-black/35"
          role="menu"
        >
          <div className="px-3 py-2">
            <p className="text-sm font-semibold text-foreground">
              Görünüm
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Tema seçiminiz bu tarayıcıda saklanır.
            </p>
          </div>
          <div className="grid gap-1 p-1">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const active = theme === option.value;

              return (
                <button
                  className="flex h-10 items-center justify-between rounded-xl px-3 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                  data-active={active}
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {option.label}
                  </span>
                  {active ? <span className="text-xs">Seçili</span> : null}
                </button>
              );
            })}
          </div>
          <div className="mt-2 border-t border-border p-1 pt-2">
            <form action={logout}>
              <Button
                className="h-10 w-full justify-start rounded-xl text-red-500 hover:bg-red-500/10 hover:text-red-400"
                type="submit"
                variant="ghost"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Çıkış yap
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
