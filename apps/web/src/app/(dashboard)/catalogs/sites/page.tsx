import { getTranslations } from "next-intl/server";
import { Plus, Pencil } from "lucide-react";
import type { Site } from "@mineria/shared";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteButton } from "@/components/crud/delete-button";
import { SiteDialog } from "./site-dialog";
import { deleteSite } from "./actions";

export default async function SitesPage() {
  const t = await getTranslations("catalogs.sites");
  const tCrud = await getTranslations("crud");
  const supabase = await createClient();
  const { data: sites } = await supabase
    .from("sites")
    .select("*")
    .order("name");

  const rows = (sites ?? []) as Site[];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        <SiteDialog
          trigger={
            <Button size="sm">
              <Plus className="size-4" /> {t("new")}
            </Button>
          }
        />
      </div>

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {tCrud("empty")}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("code")}</TableHead>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("coords")}</TableHead>
              <TableHead>{tCrud("status")}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((site) => (
              <TableRow key={site.id}>
                <TableCell className="font-mono">{site.code}</TableCell>
                <TableCell>{site.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {site.lat != null && site.lng != null
                    ? `${site.lat.toFixed(5)}, ${site.lng.toFixed(5)}`
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={site.status === "ACTIVE" ? "default" : "secondary"}
                  >
                    {site.status === "ACTIVE"
                      ? tCrud("active")
                      : tCrud("inactive")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <SiteDialog
                      site={site}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={tCrud("edit")}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />
                    <DeleteButton
                      action={deleteSite.bind(null, site.id)}
                      itemLabel={site.name}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
