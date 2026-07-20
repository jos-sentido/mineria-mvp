import { getTranslations } from "next-intl/server";
import { Plus, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
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
import { RegionDialog, type RegionRow } from "./region-dialog";
import { deleteRegion } from "./actions";

export default async function RegionsPage() {
  const t = await getTranslations("catalogs.regions");
  const tCrud = await getTranslations("crud");
  const supabase = await createClient();
  const { data: regions } = await supabase
    .from("regions")
    .select("id, name, country, timezone")
    .order("name");

  const rows = (regions ?? []) as RegionRow[];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        <RegionDialog
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
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("country")}</TableHead>
              <TableHead>{t("timezone")}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((region) => (
              <TableRow key={region.id}>
                <TableCell>{region.name}</TableCell>
                <TableCell className="font-mono">{region.country}</TableCell>
                <TableCell className="text-muted-foreground">
                  {region.timezone}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <RegionDialog
                      region={region}
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
                      action={deleteRegion.bind(null, region.id)}
                      itemLabel={region.name}
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
