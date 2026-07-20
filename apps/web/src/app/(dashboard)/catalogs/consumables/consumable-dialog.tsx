"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Consumable, ConsumableCategory } from "@mineria/shared";
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
import { upsertConsumable } from "./actions";

const CATEGORIES: ConsumableCategory[] = [
  "DRILL_BIT",
  "LUBRICANT",
  "WATER",
  "ADDITIVE",
  "CEMENT",
  "OTHER",
];

export function ConsumableDialog({
  consumable,
  trigger,
}: {
  consumable?: Consumable;
  trigger: React.ReactElement;
}) {
  const t = useTranslations("catalogs.consumables");
  const tCrud = useTranslations("crud");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [category, setCategory] = useState<string>(
    consumable?.category ?? "DRILL_BIT",
  );
  const [currency, setCurrency] = useState<string>(
    consumable?.currency ?? "MXN",
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const cost = String(f.get("default_cost") ?? "").trim();

    startTransition(async () => {
      const result = await upsertConsumable(consumable?.id ?? null, {
        code: String(f.get("code") ?? ""),
        name: String(f.get("name") ?? ""),
        category: category as ConsumableCategory,
        unit: String(f.get("unit") ?? "pcs"),
        default_cost: cost === "" ? null : Number(cost),
        currency,
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
            {consumable ? t("editTitle") : t("newTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cons-code">{t("code")}</Label>
              <Input
                id="cons-code"
                name="code"
                defaultValue={consumable?.code}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cons-category">{t("category")}</Label>
              <FormSelect
                id="cons-category"
                value={category}
                onChange={setCategory}
                options={CATEGORIES.map((c) => ({
                  value: c,
                  label: t(`categories.${c}`),
                }))}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="cons-name">{t("name")}</Label>
              <Input
                id="cons-name"
                name="name"
                defaultValue={consumable?.name}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cons-unit">{t("unit")}</Label>
              <Input
                id="cons-unit"
                name="unit"
                defaultValue={consumable?.unit ?? "pcs"}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cons-cost">{t("defaultCost")}</Label>
              <Input
                id="cons-cost"
                name="default_cost"
                type="number"
                step="0.01"
                min="0"
                defaultValue={consumable?.default_cost ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cons-currency">{t("currency")}</Label>
              <FormSelect
                id="cons-currency"
                value={currency}
                onChange={setCurrency}
                options={[
                  { value: "MXN", label: "MXN" },
                  { value: "USD", label: "USD" },
                  { value: "CAD", label: "CAD" },
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
