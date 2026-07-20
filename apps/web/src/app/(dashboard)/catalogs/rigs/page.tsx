import { getTranslations } from "next-intl/server";
import { Plus, Pencil } from "lucide-react";
import type { Rig, Site } from "@mineria/shared";
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
import { RigDialog } from "./rig-dialog";
import { deleteRig } from "./actions";

const STATUS_VARIANT: Record<
  Rig["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  OPERATIONAL: "default",
  MAINTENANCE: "outline",
  MOVING: "outline",
  INACTIVE: "secondary",
};

export default async function RigsPage() {
  const t = await getTranslations("catalogs.rigs");
  const tCrud = await getTranslations("crud");
  const supabase = await createClient();

  const [{ data: rigs }, { data: sites }] = await Promise.all([
    supabase.from("rigs").select("*").order("code"),
    supabase.from("sites").select("id, name").order("name"),
  ]);

  const rows = (rigs ?? []) as Rig[];
  const siteOptions = (sites ?? []) as Pick<Site, "id" | "name">[];
  const siteName = new Map(siteOptions.map((s) => [s.id, s.name]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        <RigDialog
          sites={siteOptions}
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
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("brandModel")}</TableHead>
              <TableHead>{t("site")}</TableHead>
              <TableHead>{tCrud("status")}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((rig) => (
              <TableRow key={rig.id}>
                <TableCell className="font-mono">{rig.code}</TableCell>
                <TableCell>{t(`types.${rig.type}`)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {[rig.brand, rig.model].filter(Boolean).join(" ") || "—"}
                </TableCell>
                <TableCell>
                  {rig.site_id ? (siteName.get(rig.site_id) ?? "—") : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[rig.status]}>
                    {t(`statuses.${rig.status}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <RigDialog
                      rig={rig}
                      sites={siteOptions}
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
                      action={deleteRig.bind(null, rig.id)}
                      itemLabel={rig.code}
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
