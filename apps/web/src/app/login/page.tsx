import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const t = await getTranslations("app");

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary font-mono text-lg font-bold text-primary-foreground">
          PZ
        </div>
        <h1 className="text-xl font-semibold tracking-tight">{t("name")}</h1>
        <p className="text-sm text-muted-foreground">{t("tagline")}</p>
      </div>
      <LoginForm />
    </main>
  );
}
