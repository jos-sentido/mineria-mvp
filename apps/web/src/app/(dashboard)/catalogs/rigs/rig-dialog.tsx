"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Rig, RigStatus, RigType, Site } from "@mineria/shared";
import { Button } from "@/components/ui/button";
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
import { upsertRig } from "./actions";

const RIG_TYPES: RigType[] = [
  "DIAMOND_CORE",
  "RC",
  "PERCUSSION",
  "TUNNELING",
  "OTHER",
];
const RIG_STATUSES: RigStatus[] = [
  "OPERATIONAL",
  "MAINTENANCE",
  "INACTIVE",
  "MOVING",
];

const NO_SITE = "__none__";

export function RigDialog({
  rig,
  sites,
  trigger,
}: {
  rig?: Rig;
  sites: Pick<Site, "id" | "name">[];
  trigger: React.ReactElement;
}) {
  const t = useTranslations("catalogs.rigs");
  const tCrud = useTranslations("crud");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<string>(rig?.type ?? "DIAMOND_CORE");
  const [status, setStatus] = useState<string>(rig?.status ?? "OPERATIONAL");
  const [siteId, setSiteId] = useState<string>(rig?.site_id ?? NO_SITE);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const str = (k: string) => {
      const v = String(f.get(k) ?? "").trim();
      return v === "" ? null : v;
    };

    startTransition(async () => {
      const result = await upsertRig(rig?.id ?? null, {
        code: String(f.get("code") ?? ""),
        brand: str("brand"),
        model: str("model"),
        serial_number: str("serial_number"),
        type: type as RigType,
        status: status as RigStatus,
        site_id: siteId === NO_SITE ? null : siteId,
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
          <DialogTitle>{rig ? t("editTitle") : t("newTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rig-code">{t("code")}</Label>
              <Input id="rig-code" name="code" defaultValue={rig?.code} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rig-type">{t("type")}</Label>
              <FormSelect
                id="rig-type"
                value={type}
                onChange={setType}
                options={RIG_TYPES.map((v) => ({ value: v, label: t(`types.${v}`) }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rig-brand">{t("brand")}</Label>
              <Input id="rig-brand" name="brand" defaultValue={rig?.brand ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rig-model">{t("model")}</Label>
              <Input id="rig-model" name="model" defaultValue={rig?.model ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rig-serial">{t("serial")}</Label>
              <Input
                id="rig-serial"
                name="serial_number"
                defaultValue={rig?.serial_number ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rig-status">{tCrud("status")}</Label>
              <FormSelect
                id="rig-status"
                value={status}
                onChange={setStatus}
                options={RIG_STATUSES.map((v) => ({
                  value: v,
                  label: t(`statuses.${v}`),
                }))}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="rig-site">{t("site")}</Label>
              <FormSelect
                id="rig-site"
                value={siteId}
                onChange={setSiteId}
                options={[
                  { value: NO_SITE, label: t("noSite") },
                  ...sites.map((s) => ({ value: s.id, label: s.name })),
                ]}
              />
            </div>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? tCrud("saving") : tCrud("save")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
