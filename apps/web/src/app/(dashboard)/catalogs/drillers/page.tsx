import { getTranslations } from "next-intl/server";
import { Plus, Pencil } from "lucide-react";
import type { Driller } from "@mineria/shared";
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
import { DrillerDialog } from "./driller-dialog";
import { deleteDriller } from "./actions";

export default async function DrillersPage() {
  const t = await getTranslations("catalogs.drillers");
  const tCrud = await getTranslations("crud");
  const supabase = await createClient();
  const { data: drillers } = await supabase
    .from("drillers")
    .select("*")
    .order("full_name");

  const rows = (drillers ?? []) as Driller[];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        <DrillerDialog
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
              <TableHead>{t("fullName")}</TableHead>
              <TableHead>{t("employeeCode")}</TableHead>
              <TableHead>{t("baseRate")}</TableHead>
              <TableHead>{tCrud("status")}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((driller) => (
              <TableRow key={driller.id}>
                <TableCell>{driller.full_name}</TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {driller.employee_code ?? "—"}
                </TableCell>
                <TableCell className="font-mono">
                  {driller.base_rate != null
                    ? `$${Number(driller.base_rate).toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })} ${driller.currency}`
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      driller.status === "ACTIVE" ? "default" : "secondary"
                    }
                  >
                    {driller.status === "ACTIVE"
                      ? tCrud("active")
                      : tCrud("inactive")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <DrillerDialog
                      driller={driller}
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
                      action={deleteDriller.bind(null, driller.id)}
                      itemLabel={driller.full_name}
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
