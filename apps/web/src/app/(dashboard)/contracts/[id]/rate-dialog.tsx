"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSelect } from "@/components/crud/form-select";
import { addRate } from "./actions";

const RATE_TYPES = [
  "PER_METER",
  "PER_HOUR",
  "PER_DAY",
  "PER_ACTIVITY",
  "PER_DEPTH_TIER",
] as const;

const ANY_ACTIVITY = "__any__";

export function RateDialog({
  contractId,
  defaultCurrency,
  activities,
  trigger,
}: {
  contractId: string;
  defaultCurrency: string;
  activities: { code: string; label_es: string }[];
  trigger: React.ReactElement;
}) {
  const t = useTranslations("contracts.rates");
  const tCrud = useTranslations("crud");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [rateType, setRateType] = useState<string>("PER_METER");
  const [activityCode, setActivityCode] = useState<string>(ANY_ACTIVITY);
  const [currency, setCurrency] = useState(defaultCurrency);

  const isTier = rateType === "PER_DEPTH_TIER";
  const usesActivity = rateType === "PER_HOUR" || rateType === "PER_ACTIVITY";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const num = (k: string) => {
      const v = String(f.get(k) ?? "").trim();
      return v === "" ? null : Number(v);
    };
    const str = (k: string) => {
      const v = String(f.get(k) ?? "").trim();
      return v === "" ? null : v;
    };

    startTransition(async () => {
      const result = await addRate(contractId, {
        rate_type: rateType as (typeof RATE_TYPES)[number],
        activity_code:
          usesActivity && activityCode !== ANY_ACTIVITY ? activityCode : null,
        depth_from_m: isTier ? (num("depth_from") ?? 0) : null,
        depth_to_m: isTier ? num("depth_to") : null,
        amount: Number(f.get("amount")),
        currency,
        valid_from: String(f.get("valid_from")),
        valid_to: str("valid_to"),
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
          <DialogTitle>{t("newTitle")}</DialogTitle>
          <DialogDescription>{t("versioningHint")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rt-type">{t("type")}</Label>
              <FormSelect
                id="rt-type"
                value={rateType}
                onChange={setRateType}
                options={RATE_TYPES.map((v) => ({
                  value: v,
                  label: t(`types.${v}`),
                }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rt-amount">{t("amount")}</Label>
              <Input
                id="rt-amount"
                name="amount"
                type="number"
                step="0.0001"
                min="0.0001"
                required
              />
            </div>

            {usesActivity && (
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="rt-activity">{t("activity")}</Label>
                <FormSelect
                  id="rt-activity"
                  value={activityCode}
                  onChange={setActivityCode}
                  options={[
                    { value: ANY_ACTIVITY, label: t("anyActivity") },
                    ...activities.map((a) => ({
                      value: a.code,
                      label: `${a.code} · ${a.label_es}`,
                    })),
                  ]}
                />
              </div>
            )}

            {isTier && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="rt-from">{t("depthFrom")}</Label>
                  <Input
                    id="rt-from"
                    name="depth_from"
                    type="number"
                    min="0"
                    defaultValue="0"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="rt-to">{t("depthTo")}</Label>
                  <Input
                    id="rt-to"
                    name="depth_to"
                    type="number"
                    min="1"
                    placeholder="∞"
                  />
                </div>
              </>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rt-currency">{t("currency")}</Label>
              <FormSelect
                id="rt-currency"
                value={currency}
                onChange={setCurrency}
                options={[
                  { value: "MXN", label: "MXN" },
                  { value: "USD", label: "USD" },
                  { value: "CAD", label: "CAD" },
                ]}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rt-vfrom">{t("validFrom")}</Label>
              <Input
                id="rt-vfrom"
                name="valid_from"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="rt-vto">{t("validTo")}</Label>
              <Input id="rt-vto" name="valid_to" type="date" />
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
