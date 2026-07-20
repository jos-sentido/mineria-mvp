import { getTranslations } from "next-intl/server";
import { Plus, Pencil } from "lucide-react";
import type { Consumable } from "@mineria/shared";
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
import { ConsumableDialog } from "./consumable-dialog";
import { deleteConsumable } from "./actions";

export default async function ConsumablesPage() {
  const t = await getTranslations("catalogs.consumables");
  const tCrud = await getTranslations("crud");
  const supabase = await createClient();
  const { data: consumables } = await supabase
    .from("consumables")
    .select("*")
    .order("code");

  const rows = (consumables ?? []) as Consumable[];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        <ConsumableDialog
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
              <TableHead>{t("category")}</TableHead>
              <TableHead>{t("unit")}</TableHead>
              <TableHead>{t("defaultCost")}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((consumable) => (
              <TableRow key={consumable.id}>
                <TableCell className="font-mono">{consumable.code}</TableCell>
                <TableCell>{consumable.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {t(`categories.${consumable.category}`)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {consumable.unit}
                </TableCell>
                <TableCell className="font-mono">
                  {consumable.default_cost != null
                    ? `$${Number(consumable.default_cost).toLocaleString(
                        "es-MX",
                        { minimumFractionDigits: 2 },
                      )} ${consumable.currency}`
                    : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <ConsumableDialog
                      consumable={consumable}
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
                      action={deleteConsumable.bind(null, consumable.id)}
                      itemLabel={consumable.code}
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
