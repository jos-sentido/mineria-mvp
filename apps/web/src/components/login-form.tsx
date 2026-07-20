"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
// standardSchemaResolver: evita el acople de tipos a la versión exacta de zod
// (zodResolver rompía el build en Vercel por dos copias de zod v4)
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: standardSchemaResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      setServerError(
        error.message.includes("Invalid login credentials")
          ? t("errorInvalid")
          : t("errorGeneric"),
      );
      return;
    }

    router.replace(searchParams.get("next") ?? "/");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm">
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
          noValidate
        >
          <div className="flex flex-col gap-1 text-center">
            <h2 className="text-lg font-semibold">{t("title")}</h2>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{t("validationEmail")}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {t("validationPassword")}
              </p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-destructive" role="alert">
              {serverError}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
