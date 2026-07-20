import { getTranslations } from "next-intl/server";
import { CatalogsNav } from "./catalogs-nav";

export default async function CatalogsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const t = await getTranslations("catalogs");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <CatalogsNav />
      {children}
    </div>
  );
}
