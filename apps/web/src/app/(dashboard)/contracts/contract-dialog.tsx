"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { FormSelect } from "@/components/crud/form-select";
import { upsertContract } from "./actions";

export function ContractDialog({ trigger }: { trigger: React.ReactElement }) {
  const t = useTranslations("contracts");
  const tCrud = useTranslations("crud");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [currency, setCurrency] = useState("MXN");
  const [cycle, setCycle] = useState("MONTHLY");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const str = (k: string) => {
      const v = String(f.get(k) ?? "").trim();
      return v === "" ? null : v;
    };

    startTransition(async () => {
      const result = await upsertContract(null, {
        code: String(f.get("code") ?? ""),
        name: String(f.get("name") ?? ""),
        currency,
        status: "DRAFT",
        billing_cycle: cycle as "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "CUSTOM",
        starts_at: str("starts_at"),
        ends_at: str("ends_at"),
        po_number: str("po_number"),
        notes: null,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(tCrud("saved"));
        setOpen(false);
        if (result.id) router.push(`/contracts/${result.id}`);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("newTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ct-code">{t("code")}</Label>
              <Input
                id="ct-code"
                name="code"
                placeholder="CTR-2026-Z01"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ct-currency">{t("currency")}</Label>
              <FormSelect
                id="ct-currency"
                value={currency}
                onChange={setCurrency}
                options={[
                  { value: "MXN", label: "MXN" },
                  { value: "USD", label: "USD" },
                  { value: "CAD", label: "CAD" },
                ]}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="ct-name">{t("name")}</Label>
              <Input id="ct-name" name="name" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ct-cycle">{t("billingCycle")}</Label>
              <FormSelect
                id="ct-cycle"
                value={cycle}
                onChange={setCycle}
                options={[
                  { value: "WEEKLY", label: t("cycles.WEEKLY") },
                  { value: "BIWEEKLY", label: t("cycles.BIWEEKLY") },
                  { value: "MONTHLY", label: t("cycles.MONTHLY") },
                  { value: "CUSTOM", label: t("cycles.CUSTOM") },
                ]}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ct-po">{t("poNumber")}</Label>
              <Input id="ct-po" name="po_number" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ct-starts">{t("startsAt")}</Label>
              <Input id="ct-starts" name="starts_at" type="date" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ct-ends">{t("endsAt")}</Label>
              <Input id="ct-ends" name="ends_at" type="date" />
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
