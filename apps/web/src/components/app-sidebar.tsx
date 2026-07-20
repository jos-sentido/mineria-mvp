"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ClipboardList,
  FileText,
  Gauge,
  CalendarRange,
  CircleDot,
  Receipt,
  BookOpen,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { key: "dashboard", href: "/", icon: Gauge, enabled: true },
  { key: "dsrs", href: "/dsrs", icon: ClipboardList, enabled: false },
  { key: "holes", href: "/holes", icon: CircleDot, enabled: false },
  { key: "programs", href: "/programs", icon: CalendarRange, enabled: false },
  { key: "contracts", href: "/contracts", icon: FileText, enabled: false },
  { key: "billing", href: "/billing", icon: Receipt, enabled: false },
  { key: "catalogs", href: "/catalogs", icon: BookOpen, enabled: true },
  { key: "admin", href: "/admin", icon: Settings2, enabled: false },
] as const;

export function AppSidebar() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex size-7 items-center justify-center rounded bg-sidebar-primary font-mono text-xs font-bold text-sidebar-primary-foreground">
          PZ
        </div>
        <span className="text-sm font-semibold tracking-tight">
          Perforación Zacatecas
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {NAV_ITEMS.map(({ key, href, icon: Icon, enabled }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={key}
              href={enabled ? href : "#"}
              aria-disabled={!enabled}
              title={enabled ? undefined : tCommon("comingSoon")}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                !enabled && "cursor-default opacity-50 hover:bg-transparent",
              )}
            >
              <Icon className="size-4" />
              {t(key)}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3 text-[10px] text-sidebar-foreground/40">
        MVP · Sprint S1
      </div>
    </aside>
  );
}
