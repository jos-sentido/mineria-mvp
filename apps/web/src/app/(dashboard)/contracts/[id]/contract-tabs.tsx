"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  simulateDsr,
  CONDITION_METRICS,
  type Condition,
  type RateRow,
} from "@mineria/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteButton } from "@/components/crud/delete-button";
import { FormSelect } from "@/components/crud/form-select";
import { upsertContract, type ContractInput } from "../actions";
import {
  addMilestone,
  deleteIncentive,
  deleteMilestone,
  deleteRate,
  setScope,
} from "./actions";
import { RateDialog } from "./rate-dialog";
import { IncentiveDialog } from "./incentive-dialog";

type Contract = ContractInput & { id: string };

type Incentive = {
  id: string;
  bonus_type?: string;
  penalty_type?: string;
  condition: Condition;
  amount: number;
  amount_type: "FIXED" | "PERCENTAGE";
  valid_from: string | null;
  valid_to: string | null;
};

type Milestone = {
  id: string;
  trigger: "DEPTH_REACHED" | "HOLE_COMPLETED" | "DATE_REACHED";
  trigger_value: Record<string, string | number>;
  amount: number;
};

type Catalogs = {
  rigs: { id: string; code: string }[];
  sites: { id: string; name: string }[];
  consumables: { id: string; code: string; name: string }[];
  activities: { code: string; label_es: string }[];
};

export function ContractTabs({
  contract,
  rates,
  bonuses,
  penalties,
  milestones,
  scope,
  catalogs,
}: {
  contract: Contract;
  rates: RateRow[];
  bonuses: Incentive[];
  penalties: Incentive[];
  milestones: Milestone[];
  scope: { rigs: string[]; sites: string[]; consumables: string[] };
  catalogs: Catalogs;
}) {
  const t = useTranslations("contracts");

  return (
    <Tabs defaultValue="general">
      <TabsList>
        <TabsTrigger value="general">{t("tabs.general")}</TabsTrigger>
        <TabsTrigger value="rates">{t("tabs.rates")}</TabsTrigger>
        <TabsTrigger value="bonuses">{t("tabs.bonuses")}</TabsTrigger>
        <TabsTrigger value="penalties">{t("tabs.penalties")}</TabsTrigger>
        <TabsTrigger value="milestones">{t("tabs.milestones")}</TabsTrigger>
        <TabsTrigger value="scope">{t("tabs.scope")}</TabsTrigger>
        <TabsTrigger value="simulator">{t("tabs.simulator")}</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="pt-4">
        <GeneralSection contract={contract} />
      </TabsContent>
      <TabsContent value="rates" className="pt-4">
        <RatesSection
          contractId={contract.id}
          currency={contract.currency}
          rates={rates}
          activities={catalogs.activities}
        />
      </TabsContent>
      <TabsContent value="bonuses" className="pt-4">
        <IncentivesSection
          kind="bonus"
          contractId={contract.id}
          items={bonuses}
        />
      </TabsContent>
      <TabsContent value="penalties" className="pt-4">
        <IncentivesSection
          kind="penalty"
          contractId={contract.id}
          items={penalties}
        />
      </TabsContent>
      <TabsContent value="milestones" className="pt-4">
        <MilestonesSection contractId={contract.id} milestones={milestones} />
      </TabsContent>
      <TabsContent value="scope" className="pt-4">
        <ScopeSection contractId={contract.id} scope={scope} catalogs={catalogs} />
      </TabsContent>
      <TabsContent value="simulator" className="pt-4">
        <SimulatorSection rates={rates} />
      </TabsContent>
    </Tabs>
  );
}

// ── General ────────────────────────────────────────────────────────────────

function GeneralSection({ contract }: { contract: Contract }) {
  const t = useTranslations("contracts");
  const tCrud = useTranslations("crud");
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string>(contract.status);
  const [cycle, setCycle] = useState<string>(contract.billing_cycle);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const str = (k: string) => {
      const v = String(f.get(k) ?? "").trim();
      return v === "" ? null : v;
    };

    startTransition(async () => {
      const result = await upsertContract(contract.id, {
        code: String(f.get("code") ?? ""),
        name: String(f.get("name") ?? ""),
        currency: contract.currency,
        status: status as Contract["status"],
        billing_cycle: cycle as Contract["billing_cycle"],
        starts_at: str("starts_at"),
        ends_at: str("ends_at"),
        po_number: str("po_number"),
        notes: str("notes"),
      });
      if (result.error) toast.error(result.error);
      else toast.success(tCrud("saved"));
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-2xl grid-cols-2 gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="g-code">{t("code")}</Label>
        <Input id="g-code" name="code" defaultValue={contract.code} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="g-status">{tCrud("status")}</Label>
        <FormSelect
          id="g-status"
          value={status}
          onChange={setStatus}
          options={["DRAFT", "ACTIVE", "SUSPENDED", "IN_BILLING", "CLOSED"].map(
            (s) => ({ value: s, label: t(`statuses.${s}`) }),
          )}
        />
      </div>
      <div className="col-span-2 flex flex-col gap-1.5">
        <Label htmlFor="g-name">{t("name")}</Label>
        <Input id="g-name" name="name" defaultValue={contract.name} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="g-cycle">{t("billingCycle")}</Label>
        <FormSelect
          id="g-cycle"
          value={cycle}
          onChange={setCycle}
          options={["WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM"].map((c) => ({
            value: c,
            label: t(`cycles.${c}`),
          }))}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="g-po">{t("poNumber")}</Label>
        <Input id="g-po" name="po_number" defaultValue={contract.po_number ?? ""} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="g-starts">{t("startsAt")}</Label>
        <Input
          id="g-starts"
          name="starts_at"
          type="date"
          defaultValue={contract.starts_at ?? ""}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="g-ends">{t("endsAt")}</Label>
        <Input
          id="g-ends"
          name="ends_at"
          type="date"
          defaultValue={contract.ends_at ?? ""}
        />
      </div>
      <div className="col-span-2 flex flex-col gap-1.5">
        <Label htmlFor="g-notes">{t("notes")}</Label>
        <Input id="g-notes" name="notes" defaultValue={contract.notes ?? ""} />
      </div>
      <div className="col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? tCrud("saving") : tCrud("save")}
        </Button>
      </div>
    </form>
  );
}

// ── Tarifas ────────────────────────────────────────────────────────────────

function RatesSection({
  contractId,
  currency,
  rates,
  activities,
}: {
  contractId: string;
  currency: string;
  rates: RateRow[];
  activities: Catalogs["activities"];
}) {
  const t = useTranslations("contracts.rates");
  const tCrud = useTranslations("crud");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        <RateDialog
          contractId={contractId}
          defaultCurrency={currency}
          activities={activities}
          trigger={
            <Button size="sm">
              <Plus className="size-4" /> {t("new")}
            </Button>
          }
        />
      </div>
      {rates.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {tCrud("empty")}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("activity")}</TableHead>
              <TableHead>{t("tier")}</TableHead>
              <TableHead>{t("amount")}</TableHead>
              <TableHead>{t("validity")}</TableHead>
              <TableHead className="w-14" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rates.map((rate) => {
              const active =
                rate.valid_from <= today &&
                (rate.valid_to === null || rate.valid_to >= today);
              return (
                <TableRow key={rate.id} className={active ? "" : "opacity-50"}>
                  <TableCell>{t(`types.${rate.rate_type}`)}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {rate.activity_code ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {rate.rate_type === "PER_DEPTH_TIER"
                      ? `${rate.depth_from_m ?? 0}–${rate.depth_to_m ?? "∞"} m`
                      : "—"}
                  </TableCell>
                  <TableCell className="font-mono">
                    ${Number(rate.amount).toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    {rate.currency}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {rate.valid_from} → {rate.valid_to ?? "∞"}
                  </TableCell>
                  <TableCell>
                    <DeleteButton
                      action={deleteRate.bind(null, contractId, rate.id)}
                      itemLabel={t(`types.${rate.rate_type}`)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// ── Bonos / Penalizaciones ─────────────────────────────────────────────────

function IncentivesSection({
  kind,
  contractId,
  items,
}: {
  kind: "bonus" | "penalty";
  contractId: string;
  items: Incentive[];
}) {
  const t = useTranslations("contracts.incentives");
  const tCrud = useTranslations("crud");
  const table = kind === "bonus" ? "contract_bonuses" : "contract_penalties";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t(`${kind}Description`)}
        </p>
        <IncentiveDialog
          kind={kind}
          contractId={contractId}
          trigger={
            <Button size="sm">
              <Plus className="size-4" /> {t(`${kind}New`)}
            </Button>
          }
        />
      </div>
      {items.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {tCrud("empty")}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("condition")}</TableHead>
              <TableHead>{t("amount")}</TableHead>
              <TableHead className="w-14" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const typeKey = item.bonus_type ?? item.penalty_type ?? "";
              return (
                <TableRow key={item.id}>
                  <TableCell>{t(`kinds.${typeKey}`)}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {(CONDITION_METRICS as readonly string[]).includes(
                      item.condition.metric,
                    )
                      ? t(`metrics.${item.condition.metric}`)
                      : item.condition.metric}{" "}
                    {item.condition.op} {item.condition.value}
                  </TableCell>
                  <TableCell className="font-mono">
                    {item.amount_type === "PERCENTAGE"
                      ? `${item.amount}%`
                      : `$${Number(item.amount).toLocaleString("es-MX")}`}
                  </TableCell>
                  <TableCell>
                    <DeleteButton
                      action={deleteIncentive.bind(
                        null,
                        contractId,
                        table,
                        item.id,
                      )}
                      itemLabel={t(`kinds.${typeKey}`)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// ── Hitos ──────────────────────────────────────────────────────────────────

function MilestonesSection({
  contractId,
  milestones,
}: {
  contractId: string;
  milestones: Milestone[];
}) {
  const t = useTranslations("contracts.milestones");
  const tCrud = useTranslations("crud");
  const [pending, startTransition] = useTransition();
  const [trigger, setTrigger] = useState<string>("DEPTH_REACHED");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const amount = Number(f.get("amount"));
    const value = String(f.get("value") ?? "").trim();
    if (!amount || !value) return;

    const trigger_value: Record<string, string | number> =
      trigger === "DATE_REACHED"
        ? { date: value }
        : trigger === "DEPTH_REACHED"
          ? { depth_m: Number(value) }
          : { hole_code: value };

    startTransition(async () => {
      const result = await addMilestone(contractId, {
        trigger: trigger as Milestone["trigger"],
        trigger_value,
        amount,
      });
      if (result.error) toast.error(result.error);
      else {
        toast.success(tCrud("saved"));
        form.reset();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t("description")}</p>
      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>{t("trigger")}</Label>
          <FormSelect
            value={trigger}
            onChange={setTrigger}
            options={["DEPTH_REACHED", "HOLE_COMPLETED", "DATE_REACHED"].map(
              (v) => ({ value: v, label: t(`triggers.${v}`) }),
            )}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ms-value">
            {trigger === "DATE_REACHED"
              ? t("valueDate")
              : trigger === "DEPTH_REACHED"
                ? t("valueDepth")
                : t("valueHole")}
          </Label>
          <Input
            id="ms-value"
            name="value"
            type={
              trigger === "DATE_REACHED"
                ? "date"
                : trigger === "DEPTH_REACHED"
                  ? "number"
                  : "text"
            }
            className="w-40"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ms-amount">{t("amount")}</Label>
          <Input
            id="ms-amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            className="w-36"
            required
          />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          <Plus className="size-4" /> {t("add")}
        </Button>
      </form>

      {milestones.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("trigger")}</TableHead>
              <TableHead>{t("value")}</TableHead>
              <TableHead>{t("amount")}</TableHead>
              <TableHead className="w-14" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {milestones.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{t(`triggers.${m.trigger}`)}</TableCell>
                <TableCell className="font-mono text-xs">
                  {Object.values(m.trigger_value).join(", ")}
                </TableCell>
                <TableCell className="font-mono">
                  ${Number(m.amount).toLocaleString("es-MX")}
                </TableCell>
                <TableCell>
                  <DeleteButton
                    action={deleteMilestone.bind(null, contractId, m.id)}
                    itemLabel={t(`triggers.${m.trigger}`)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// ── Alcance ────────────────────────────────────────────────────────────────

function ScopeSection({
  contractId,
  scope,
  catalogs,
}: {
  contractId: string;
  scope: { rigs: string[]; sites: string[]; consumables: string[] };
  catalogs: Catalogs;
}) {
  const t = useTranslations("contracts.scope");
  const tCrud = useTranslations("crud");
  const [pending, startTransition] = useTransition();
  const [rigIds, setRigIds] = useState(new Set(scope.rigs));
  const [siteIds, setSiteIds] = useState(new Set(scope.sites));
  const [consumableIds, setConsumableIds] = useState(new Set(scope.consumables));

  function save() {
    startTransition(async () => {
      const results = await Promise.all([
        setScope(contractId, "rigs", [...rigIds]),
        setScope(contractId, "sites", [...siteIds]),
        setScope(contractId, "consumables", [...consumableIds]),
      ]);
      const failed = results.find((r) => r.error);
      if (failed?.error) toast.error(failed.error);
      else toast.success(tCrud("saved"));
    });
  }

  const toggle =
    (setter: React.Dispatch<React.SetStateAction<Set<string>>>) =>
    (id: string, checked: boolean) =>
      setter((prev) => {
        const next = new Set(prev);
        if (checked) next.add(id);
        else next.delete(id);
        return next;
      });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t("description")}</p>
      <div className="flex flex-wrap gap-4">
        <CheckList
          title={t("rigs")}
          emptyLabel={tCrud("empty")}
          items={catalogs.rigs.map((r) => ({ id: r.id, label: r.code }))}
          selected={rigIds}
          onToggle={toggle(setRigIds)}
        />
        <CheckList
          title={t("sites")}
          emptyLabel={tCrud("empty")}
          items={catalogs.sites.map((s) => ({ id: s.id, label: s.name }))}
          selected={siteIds}
          onToggle={toggle(setSiteIds)}
        />
        <CheckList
          title={t("consumables")}
          emptyLabel={tCrud("empty")}
          items={catalogs.consumables.map((c) => ({
            id: c.id,
            label: `${c.code} · ${c.name}`,
          }))}
          selected={consumableIds}
          onToggle={toggle(setConsumableIds)}
        />
      </div>
      <div>
        <Button onClick={save} disabled={pending}>
          {pending ? tCrud("saving") : tCrud("save")}
        </Button>
      </div>
    </div>
  );
}

function CheckList({
  title,
  emptyLabel,
  items,
  selected,
  onToggle,
}: {
  title: string;
  emptyLabel: string;
  items: { id: string; label: string }[];
  selected: Set<string>;
  onToggle: (id: string, checked: boolean) => void;
}) {
  return (
    <div className="flex min-w-56 flex-1 flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="flex max-h-64 flex-col gap-2 overflow-y-auto rounded-md border p-3">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">{emptyLabel}</p>
        ) : (
          items.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={selected.has(item.id)}
                onCheckedChange={(checked) =>
                  onToggle(item.id, checked === true)
                }
              />
              {item.label}
            </label>
          ))
        )}
      </div>
    </div>
  );
}

// ── Simulador ──────────────────────────────────────────────────────────────

function SimulatorSection({ rates }: { rates: RateRow[] }) {
  const t = useTranslations("contracts.simulator");
  const [meters, setMeters] = useState("50");
  const [depth, setDepth] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const hasTiers = rates.some((r) => r.rate_type === "PER_DEPTH_TIER");

  const result = useMemo(() => {
    const normalized = rates.map((r) => ({
      ...r,
      amount: Number(r.amount),
    }));
    return simulateDsr(normalized, {
      date,
      metersDrilled: Number(meters) || 0,
      avgDepthM: depth.trim() === "" ? null : Number(depth),
    });
  }, [rates, meters, depth, date]);

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t("description")}</p>
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sim-meters">{t("meters")}</Label>
          <Input
            id="sim-meters"
            type="number"
            min="0"
            className="w-32"
            value={meters}
            onChange={(e) => setMeters(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sim-depth">{t("avgDepth")}</Label>
          <Input
            id="sim-depth"
            type="number"
            min="0"
            className="w-32"
            value={depth}
            onChange={(e) => setDepth(e.target.value)}
            disabled={!hasTiers}
            title={hasTiers ? undefined : t("depthNoTiers")}
          />
          {!hasTiers && (
            <p className="max-w-40 text-xs text-muted-foreground">
              {t("depthNoTiers")}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sim-date">{t("date")}</Label>
          <Input
            id="sim-date"
            type="date"
            className="w-40"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2">
          {result.lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noLines")}</p>
          ) : (
            result.lines.map((line, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {line.label.startsWith("METERS")
                    ? t("lineMeters")
                    : line.label}
                  {" · "}
                  {line.quantity} × ${line.unitAmount.toLocaleString("es-MX")}
                </span>
                <span className="font-mono">
                  ${line.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))
          )}
          <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
            <span>{t("total")}</span>
            <span className="font-mono">
              ${result.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}{" "}
              {result.currency ?? ""}
            </span>
          </div>
          {result.warnings.map((w) => (
            <p key={w} className="text-xs text-destructive">
              ⚠ {w}
            </p>
          ))}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">{t("disclaimer")}</p>
    </div>
  );
}

export { CONDITION_METRICS };
