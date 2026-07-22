"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CONDITION_METRICS, type ConditionOp } from "@mineria/shared";
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
import { addBonus, addPenalty } from "./actions";

const BONUS_TYPES = ["GOAL_ACHIEVED", "SAFETY", "EFFICIENCY", "EARLY_COMPLETION"];
const PENALTY_TYPES = ["STANDBY_EXCEED", "INCIDENT", "DELAY", "QUALITY"];
const OPS: ConditionOp[] = [">=", ">", "<=", "<", "=="];

export function IncentiveDialog({
  kind,
  contractId,
  trigger,
}: {
  kind: "bonus" | "penalty";
  contractId: string;
  trigger: React.ReactElement;
}) {
  const t = useTranslations("contracts.incentives");
  const tCrud = useTranslations("crud");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const types = kind === "bonus" ? BONUS_TYPES : PENALTY_TYPES;
  const [type, setType] = useState(types[0]);
  const [metric, setMetric] = useState<string>(CONDITION_METRICS[0]);
  const [op, setOp] = useState<string>(">=");
  const [amountType, setAmountType] = useState("FIXED");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const condition = {
      metric,
      op: op as ConditionOp,
      value: Number(f.get("cond_value")),
    };
    const base = {
      amount: Number(f.get("amount")),
      amount_type: amountType as "FIXED" | "PERCENTAGE",
      condition,
      valid_from: null,
      valid_to: null,
    };

    startTransition(async () => {
      const result =
        kind === "bonus"
          ? await addBonus(contractId, {
              bonus_type: type as (typeof BONUS_TYPES)[number] &
                ("GOAL_ACHIEVED" | "SAFETY" | "EFFICIENCY" | "EARLY_COMPLETION"),
              ...base,
            })
          : await addPenalty(contractId, {
              penalty_type: type as
                | "STANDBY_EXCEED"
                | "INCIDENT"
                | "DELAY"
                | "QUALITY",
              ...base,
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
          <DialogTitle>{t(`${kind}New`)}</DialogTitle>
          <DialogDescription>{t("conditionHint")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inc-type">{t("type")}</Label>
            <FormSelect
              id="inc-type"
              value={type}
              onChange={setType}
              options={types.map((v) => ({ value: v, label: t(`kinds.${v}`) }))}
            />
          </div>

          {/* Condition builder: SI métrica OP valor ENTONCES monto */}
          <fieldset className="rounded-md border p-3">
            <legend className="px-1 text-xs text-muted-foreground">
              {t("condition")}
            </legend>
            <div className="grid grid-cols-[1fr_auto_6rem] items-end gap-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="inc-metric">{t("metric")}</Label>
                <FormSelect
                  id="inc-metric"
                  value={metric}
                  onChange={setMetric}
                  options={CONDITION_METRICS.map((m) => ({
                    value: m,
                    label: t(`metrics.${m}`),
                  }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="inc-op">{t("op")}</Label>
                <FormSelect
                  id="inc-op"
                  value={op}
                  onChange={setOp}
                  options={OPS.map((o) => ({ value: o, label: o }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="inc-value">{t("value")}</Label>
                <Input
                  id="inc-value"
                  name="cond_value"
                  type="number"
                  step="any"
                  required
                />
              </div>
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="inc-amount">{t("amount")}</Label>
              <Input
                id="inc-amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="inc-amount-type">{t("amountType")}</Label>
              <FormSelect
                id="inc-amount-type"
                value={amountType}
                onChange={setAmountType}
                options={[
                  { value: "FIXED", label: t("amountFixed") },
                  { value: "PERCENTAGE", label: t("amountPct") },
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
