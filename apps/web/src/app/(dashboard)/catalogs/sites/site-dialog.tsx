"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Site } from "@mineria/shared";
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
import { upsertSite } from "./actions";

const NO_REGION = "__none__";

export function SiteDialog({
  site,
  regions,
  trigger,
}: {
  site?: Site;
  regions: { id: string; name: string }[];
  trigger: React.ReactElement;
}) {
  const t = useTranslations("catalogs.sites");
  const tCrud = useTranslations("crud");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string>(site?.status ?? "ACTIVE");
  const [regionId, setRegionId] = useState<string>(
    site?.region_id ?? NO_REGION,
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const num = (k: string) => {
      const v = String(f.get(k) ?? "").trim();
      return v === "" ? null : Number(v);
    };

    startTransition(async () => {
      const result = await upsertSite(site?.id ?? null, {
        name: String(f.get("name") ?? ""),
        code: String(f.get("code") ?? ""),
        status: status as "ACTIVE" | "INACTIVE",
        region_id: regionId === NO_REGION ? null : regionId,
        altitude_m: num("altitude_m"),
        lat: num("lat"),
        lng: num("lng"),
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
          <DialogTitle>{site ? t("editTitle") : t("newTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="site-name">{t("name")}</Label>
              <Input id="site-name" name="name" defaultValue={site?.name} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="site-code">{t("code")}</Label>
              <Input id="site-code" name="code" defaultValue={site?.code} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="site-status">{tCrud("status")}</Label>
              <FormSelect
                id="site-status"
                value={status}
                onChange={setStatus}
                options={[
                  { value: "ACTIVE", label: tCrud("active") },
                  { value: "INACTIVE", label: tCrud("inactive") },
                ]}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="site-lat">{t("lat")}</Label>
              <Input
                id="site-lat"
                name="lat"
                type="number"
                step="any"
                defaultValue={site?.lat ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="site-lng">{t("lng")}</Label>
              <Input
                id="site-lng"
                name="lng"
                type="number"
                step="any"
                defaultValue={site?.lng ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="site-region">{t("region")}</Label>
              <FormSelect
                id="site-region"
                value={regionId}
                onChange={setRegionId}
                options={[
                  { value: NO_REGION, label: t("noRegion") },
                  ...regions.map((r) => ({ value: r.id, label: r.name })),
                ]}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="site-altitude">{t("altitude")}</Label>
              <Input
                id="site-altitude"
                name="altitude_m"
                type="number"
                defaultValue={site?.altitude_m ?? ""}
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
