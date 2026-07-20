import { getTranslations } from "next-intl/server";
import { Plus, Pencil } from "lucide-react";
import type { Driller, Rig } from "@mineria/shared";
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
import { CrewDialog, type CrewRow } from "./crew-dialog";
import { deleteCrew } from "./actions";

type CrewQueryRow = {
  id: string;
  name: string;
  rig_id: string | null;
  lead_driller_id: string | null;
  crew_members: { driller_id: string }[];
};

export default async function CrewsPage() {
  const t = await getTranslations("catalogs.crews");
  const tCrud = await getTranslations("crud");
  const supabase = await createClient();

  const [{ data: crews }, { data: rigs }, { data: drillers }] =
    await Promise.all([
      supabase
        .from("crews")
        .select("id, name, rig_id, lead_driller_id, crew_members(driller_id)")
        .order("name"),
      supabase.from("rigs").select("id, code").order("code"),
      supabase.from("drillers").select("id, full_name").order("full_name"),
    ]);

  const rigOptions = (rigs ?? []) as Pick<Rig, "id" | "code">[];
  const drillerOptions = (drillers ?? []) as Pick<Driller, "id" | "full_name">[];
  const rigCode = new Map(rigOptions.map((r) => [r.id, r.code]));
  const drillerName = new Map(drillerOptions.map((d) => [d.id, d.full_name]));

  const rows: CrewRow[] = ((crews ?? []) as CrewQueryRow[]).map((c) => ({
    id: c.id,
    name: c.name,
    rig_id: c.rig_id,
    lead_driller_id: c.lead_driller_id,
    member_ids: c.crew_members.map((m) => m.driller_id),
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        <CrewDialog
          rigs={rigOptions}
          drillers={drillerOptions}
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
              <TableHead>{t("rig")}</TableHead>
              <TableHead>{t("lead")}</TableHead>
              <TableHead>{t("members")}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((crew) => (
              <TableRow key={crew.id}>
                <TableCell>{crew.name}</TableCell>
                <TableCell className="font-mono">
                  {crew.rig_id ? (rigCode.get(crew.rig_id) ?? "—") : "—"}
                </TableCell>
                <TableCell>
                  {crew.lead_driller_id
                    ? (drillerName.get(crew.lead_driller_id) ?? "—")
                    : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {crew.member_ids.length}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <CrewDialog
                      crew={crew}
                      rigs={rigOptions}
                      drillers={drillerOptions}
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
                      action={deleteCrew.bind(null, crew.id)}
                      itemLabel={crew.name}
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
