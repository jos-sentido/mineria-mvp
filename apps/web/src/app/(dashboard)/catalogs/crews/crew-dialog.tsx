"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Driller, Rig } from "@mineria/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSelect } from "@/components/crud/form-select";
import { upsertCrew } from "./actions";

const NONE = "__none__";

export type CrewRow = {
  id: string;
  name: string;
  rig_id: string | null;
  lead_driller_id: string | null;
  member_ids: string[];
};

export function CrewDialog({
  crew,
  rigs,
  drillers,
  trigger,
}: {
  crew?: CrewRow;
  rigs: Pick<Rig, "id" | "code">[];
  drillers: Pick<Driller, "id" | "full_name">[];
  trigger: React.ReactElement;
}) {
  const t = useTranslations("catalogs.crews");
  const tCrud = useTranslations("crud");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [rigId, setRigId] = useState<string>(crew?.rig_id ?? NONE);
  const [leadId, setLeadId] = useState<string>(crew?.lead_driller_id ?? NONE);
  const [memberIds, setMemberIds] = useState<Set<string>>(
    new Set(crew?.member_ids ?? []),
  );

  function toggleMember(id: string, checked: boolean) {
    setMemberIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const lead = leadId === NONE ? null : leadId;
    // El líder siempre es miembro
    const members = new Set(memberIds);
    if (lead) members.add(lead);

    startTransition(async () => {
      const result = await upsertCrew(crew?.id ?? null, {
        name: String(f.get("name") ?? ""),
        rig_id: rigId === NONE ? null : rigId,
        lead_driller_id: lead,
        member_ids: [...members],
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(tCrud("saved"));
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{crew ? t("editTitle") : t("newTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="crew-name">{t("name")}</Label>
            <Input id="crew-name" name="name" defaultValue={crew?.name} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="crew-rig">{t("rig")}</Label>
              <FormSelect
                id="crew-rig"
                value={rigId}
                onChange={setRigId}
                options={[
                  { value: NONE, label: t("noRig") },
                  ...rigs.map((r) => ({ value: r.id, label: r.code })),
                ]}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="crew-lead">{t("lead")}</Label>
              <FormSelect
                id="crew-lead"
                value={leadId}
                onChange={setLeadId}
                options={[
                  { value: NONE, label: t("noLead") },
                  ...drillers.map((d) => ({ value: d.id, label: d.full_name })),
                ]}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("members")}</Label>
            {drillers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("noDrillers")}
              </p>
            ) : (
              <div className="flex max-h-48 flex-col gap-2 overflow-y-auto rounded-md border p-3">
                {drillers.map((d) => (
                  <label
                    key={d.id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={memberIds.has(d.id) || d.id === leadId}
                      disabled={d.id === leadId}
                      onCheckedChange={(checked) =>
                        toggleMember(d.id, checked === true)
                      }
                    />
                    {d.full_name}
                    {d.id === leadId && (
                      <span className="text-xs text-muted-foreground">
                        · {t("leadTag")}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? tCrud("saving") : tCrud("save")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
