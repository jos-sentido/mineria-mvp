import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { ContractTabs } from "./contract-tabs";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("contracts");
  const supabase = await createClient();

  const [
    { data: contract },
    { data: rates },
    { data: bonuses },
    { data: penalties },
    { data: milestones },
    { data: scopeRigs },
    { data: scopeSites },
    { data: scopeConsumables },
    { data: rigs },
    { data: sites },
    { data: consumables },
    { data: activities },
  ] = await Promise.all([
    supabase.from("contracts").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("contract_rates")
      .select("*")
      .eq("contract_id", id)
      .order("valid_from", { ascending: false }),
    supabase.from("contract_bonuses").select("*").eq("contract_id", id),
    supabase.from("contract_penalties").select("*").eq("contract_id", id),
    supabase.from("contract_milestones").select("*").eq("contract_id", id),
    supabase.from("contract_rigs").select("rig_id").eq("contract_id", id),
    supabase.from("contract_sites").select("site_id").eq("contract_id", id),
    supabase
      .from("contract_consumables")
      .select("consumable_id")
      .eq("contract_id", id),
    supabase.from("rigs").select("id, code").order("code"),
    supabase.from("sites").select("id, name").order("name"),
    supabase.from("consumables").select("id, code, name").order("code"),
    supabase.from("activities").select("code, label_es").order("code"),
  ]);

  if (!contract) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h1 className="font-mono text-2xl font-semibold tracking-tight">
          {contract.code}
        </h1>
        <Badge variant={contract.status === "ACTIVE" ? "default" : "outline"}>
          {t(`statuses.${contract.status}`)}
        </Badge>
        <span className="text-muted-foreground">{contract.name}</span>
      </div>
      <ContractTabs
        contract={contract}
        rates={rates ?? []}
        bonuses={bonuses ?? []}
        penalties={penalties ?? []}
        milestones={milestones ?? []}
        scope={{
          rigs: (scopeRigs ?? []).map((r) => r.rig_id),
          sites: (scopeSites ?? []).map((s) => s.site_id),
          consumables: (scopeConsumables ?? []).map((c) => c.consumable_id),
        }}
        catalogs={{
          rigs: rigs ?? [],
          sites: sites ?? [],
          consumables: consumables ?? [],
          activities: activities ?? [],
        }}
      />
    </div>
  );
}
