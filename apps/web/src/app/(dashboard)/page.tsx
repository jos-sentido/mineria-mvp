import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const KPIS = [
  { key: "kpiMetersMonth", value: "—" },
  { key: "kpiActiveRigs", value: "—" },
  { key: "kpiPendingDsrs", value: "—" },
  { key: "kpiStandby", value: "—" },
] as const;

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map(({ key, value }) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t(key)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="font-mono text-3xl font-semibold">{value}</span>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{t("emptyHint")}</p>
    </div>
  );
}
