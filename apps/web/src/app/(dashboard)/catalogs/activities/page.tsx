import { getTranslations } from "next-intl/server";
import { Plus, Pencil } from "lucide-react";
import type { Activity } from "@mineria/shared";
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
import { ActivityDialog } from "./activity-dialog";
import { deleteActivity } from "./actions";

export default async function ActivitiesPage() {
  const t = await getTranslations("catalogs.activities");
  const tCrud = await getTranslations("crud");
  const supabase = await createClient();
  const { data: activities } = await supabase
    .from("activities")
    .select("*")
    .order("code");

  const rows = (activities ?? []) as Activity[];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        <ActivityDialog
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
              <TableHead>{t("labelEs")}</TableHead>
              <TableHead>{t("category")}</TableHead>
              <TableHead>{t("billable")}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell className="font-mono">{activity.code}</TableCell>
                <TableCell>{activity.label_es}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {t(`categories.${activity.category}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {activity.billable ? tCrud("yes") : tCrud("no")}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <ActivityDialog
                      activity={activity}
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
                      action={deleteActivity.bind(null, activity.id)}
                      itemLabel={activity.code}
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
