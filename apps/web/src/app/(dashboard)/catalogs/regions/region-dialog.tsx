"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
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
import { upsertRegion } from "./actions";

export type RegionRow = {
  id: string;
  name: string;
  country: string;
  timezone: string;
};

export function RegionDialog({
  region,
  trigger,
}: {
  region?: RegionRow;
  trigger: React.ReactElement;
}) {
  const t = useTranslations("catalogs.regions");
  const tCrud = useTranslations("crud");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await upsertRegion(region?.id ?? null, {
        name: String(f.get("name") ?? ""),
        country: String(f.get("country") ?? "MX"),
        timezone: String(f.get("timezone") ?? "America/Mexico_City"),
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
          <DialogTitle>{region ? t("editTitle") : t("newTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="region-name">{t("name")}</Label>
            <Input
              id="region-name"
              name="name"
              defaultValue={region?.name}
              placeholder="Zacatecas"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="region-country">{t("country")}</Label>
              <Input
                id="region-country"
                name="country"
                defaultValue={region?.country ?? "MX"}
                maxLength={2}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="region-tz">{t("timezone")}</Label>
              <Input
                id="region-tz"
                name="timezone"
                defaultValue={region?.timezone ?? "America/Mexico_City"}
                required
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
