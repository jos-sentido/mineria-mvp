"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Driller } from "@mineria/shared";
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
import { upsertDriller } from "./actions";

export function DrillerDialog({
  driller,
  trigger,
}: {
  driller?: Driller;
  trigger: React.ReactElement;
}) {
  const t = useTranslations("catalogs.drillers");
  const tCrud = useTranslations("crud");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string>(driller?.status ?? "ACTIVE");
  const [currency, setCurrency] = useState<string>(driller?.currency ?? "MXN");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const rate = String(f.get("base_rate") ?? "").trim();
    const code = String(f.get("employee_code") ?? "").trim();

    startTransition(async () => {
      const result = await upsertDriller(driller?.id ?? null, {
        full_name: String(f.get("full_name") ?? ""),
        employee_code: code === "" ? null : code,
        base_rate: rate === "" ? null : Number(rate),
        currency,
        status: status as "ACTIVE" | "INACTIVE",
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
            {driller ? t("editTitle") : t("newTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="driller-name">{t("fullName")}</Label>
              <Input
                id="driller-name"
                name="full_name"
                defaultValue={driller?.full_name}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="driller-code">{t("employeeCode")}</Label>
              <Input
                id="driller-code"
                name="employee_code"
                defaultValue={driller?.employee_code ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="driller-status">{tCrud("status")}</Label>
              <FormSelect
                id="driller-status"
                value={status}
                onChange={setStatus}
                options={[
                  { value: "ACTIVE", label: tCrud("active") },
                  { value: "INACTIVE", label: tCrud("inactive") },
                ]}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="driller-rate">{t("baseRate")}</Label>
              <Input
                id="driller-rate"
                name="base_rate"
                type="number"
                step="0.01"
                min="0"
                defaultValue={driller?.base_rate ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="driller-currency">{t("currency")}</Label>
              <FormSelect
                id="driller-currency"
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
