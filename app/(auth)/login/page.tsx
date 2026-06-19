import { AuthForm } from "@/app/(auth)/auth-form";
import { login } from "@/app/(auth)/actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <AuthForm
      action={login}
      description="Hesabinizla devam edin ve dashboard'a ulasin."
      error={error}
      submitLabel="Giris yap"
      title="Giris yap"
    />
  );
}
