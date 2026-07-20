"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Activity, ActivityCategory } from "@mineria/shared";
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
import { upsertActivity } from "./actions";

const CATEGORIES: ActivityCategory[] = [
  "DRILLING",
  "MOVING",
  "STANDBY",
  "MAINTENANCE",
  "SAFETY",
  "OTHER",
];

export function ActivityDialog({
  activity,
  trigger,
}: {
  activity?: Activity;
  trigger: React.ReactElement;
}) {
  const t = useTranslations("catalogs.activities");
  const tCrud = useTranslations("crud");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [category, setCategory] = useState<string>(
    activity?.category ?? "DRILLING",
  );
  const [billable, setBillable] = useState<string>(
    activity ? String(activity.billable) : "true",
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const labelEn = String(f.get("label_en") ?? "").trim();

    startTransition(async () => {
      const result = await upsertActivity(activity?.id ?? null, {
        code: String(f.get("code") ?? ""),
        label_es: String(f.get("label_es") ?? ""),
        label_en: labelEn === "" ? null : labelEn,
        category: category as ActivityCategory,
        billable: billable === "true",
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
          <DialogTitle>
            {activity ? t("editTitle") : t("newTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="act-code">{t("code")}</Label>
              <Input
                id="act-code"
                name="code"
                defaultValue={activity?.code}
                placeholder="DRILL_ROCK_HARD"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="act-category">{t("category")}</Label>
              <FormSelect
                id="act-category"
                value={category}
                onChange={setCategory}
                options={CATEGORIES.map((c) => ({
                  value: c,
                  label: t(`categories.${c}`),
                }))}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="act-label-es">{t("labelEs")}</Label>
              <Input
                id="act-label-es"
                name="label_es"
                defaultValue={activity?.label_es}
                required
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="act-label-en">{t("labelEn")}</Label>
              <Input
                id="act-label-en"
                name="label_en"
                defaultValue={activity?.label_en ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="act-billable">{t("billable")}</Label>
              <FormSelect
                id="act-billable"
                value={billable}
                onChange={setBillable}
                options={[
                  { value: "true", label: tCrud("yes") },
                  { value: "false", label: tCrud("no") },
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
