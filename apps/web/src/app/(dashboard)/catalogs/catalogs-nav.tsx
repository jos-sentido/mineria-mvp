"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "sites", href: "/catalogs/sites" },
  { key: "rigs", href: "/catalogs/rigs" },
  { key: "drillers", href: "/catalogs/drillers" },
  { key: "crews", href: "/catalogs/crews" },
  { key: "activities", href: "/catalogs/activities" },
  { key: "consumables", href: "/catalogs/consumables" },
  { key: "regions", href: "/catalogs/regions" },
] as const;

export function CatalogsNav() {
  const t = useTranslations("catalogs.nav");
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b pb-px">
      {TABS.map(({ key, href }) => (
        <Link
          key={key}
          href={href}
          className={cn(
            "whitespace-nowrap rounded-t-md border-b-2 px-3 py-2 text-sm transition-colors",
            pathname.startsWith(href)
              ? "border-primary font-medium text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t(key)}
        </Link>
      ))}
    </nav>
  );
}
