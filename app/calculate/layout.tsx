import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function CalculateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DashboardShell>{children}</DashboardShell>;
}
