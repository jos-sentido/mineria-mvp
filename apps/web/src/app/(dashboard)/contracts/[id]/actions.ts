"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isValidCondition } from "@mineria/shared";
import { createClient } from "@/lib/supabase/server";

const rateSchema = z.object({
  rate_type: z.enum([
    "PER_METER",
    "PER_HOUR",
    "PER_DAY",
    "PER_ACTIVITY",
    "PER_DEPTH_TIER",
  ]),
  activity_code: z.string().nullable(),
  depth_from_m: z.number().int().nonnegative().nullable(),
  depth_to_m: z.number().int().positive().nullable(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  valid_from: z.string().min(10),
  valid_to: z.string().nullable(),
});

export type RateInput = z.infer<typeof rateSchema>;

export async function addRate(
  contractId: string,
  input: RateInput,
): Promise<{ error?: string }> {
  const parsed = rateSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };
  const data = parsed.data;
  if (
    data.rate_type === "PER_DEPTH_TIER" &&
    data.depth_from_m !== null &&
    data.depth_to_m !== null &&
    data.depth_to_m <= data.depth_from_m
  ) {
    return { error: "El tier de profundidad es inválido (hasta ≤ desde)" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Versionado: cerrar la tarifa abierta equivalente (mismo tipo, actividad
  // y tier) un día antes de la nueva vigencia. Nunca se mutan montos.
  const { data: openRates } = await supabase
    .from("contract_rates")
    .select("id, valid_from")
    .eq("contract_id", contractId)
    .eq("rate_type", data.rate_type)
    .is("valid_to", null);

  const dayBefore = new Date(data.valid_from + "T00:00:00Z");
  dayBefore.setUTCDate(dayBefore.getUTCDate() - 1);
  const closeDate = dayBefore.toISOString().slice(0, 10);

  // Filtro fino en memoria (PostgREST no compara null-safe fácil)
  const { data: fullOpen } = await supabase
    .from("contract_rates")
    .select("id, activity_code, depth_from_m, depth_to_m, valid_from")
    .in("id", (openRates ?? []).map((r) => r.id));

  for (const r of fullOpen ?? []) {
    const sameKey =
      r.activity_code === data.activity_code &&
      r.depth_from_m === data.depth_from_m &&
      r.depth_to_m === data.depth_to_m;
    if (sameKey && r.valid_from < data.valid_from) {
      const { error } = await supabase
        .from("contract_rates")
        .update({ valid_to: closeDate })
        .eq("id", r.id);
      if (error) return { error: error.message };
    }
  }

  const { error } = await supabase.from("contract_rates").insert({
    ...data,
    contract_id: contractId,
    created_by: user?.id ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/contracts/${contractId}`);
  return {};
}

export async function deleteRate(
  contractId: string,
  rateId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("contract_rates")
    .delete()
    .eq("id", rateId);
  if (error) return { error: error.message };
  revalidatePath(`/contracts/${contractId}`);
  return {};
}

// ── Bonos y penalizaciones ─────────────────────────────────────────────────

const incentiveBase = {
  amount: z.number().positive(),
  amount_type: z.enum(["FIXED", "PERCENTAGE"]),
  condition: z.object({
    metric: z.string().min(1),
    op: z.enum([">=", ">", "<=", "<", "=="]),
    value: z.number(),
  }),
  valid_from: z.string().nullable(),
  valid_to: z.string().nullable(),
};

const bonusSchema = z.object({
  bonus_type: z.enum(["GOAL_ACHIEVED", "SAFETY", "EFFICIENCY", "EARLY_COMPLETION"]),
  ...incentiveBase,
});

const penaltySchema = z.object({
  penalty_type: z.enum(["STANDBY_EXCEED", "INCIDENT", "DELAY", "QUALITY"]),
  ...incentiveBase,
});

export type BonusInput = z.infer<typeof bonusSchema>;
export type PenaltyInput = z.infer<typeof penaltySchema>;

export async function addBonus(
  contractId: string,
  input: BonusInput,
): Promise<{ error?: string }> {
  const parsed = bonusSchema.safeParse(input);
  if (!parsed.success || !isValidCondition(parsed.data.condition))
    return { error: "Datos inválidos" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("contract_bonuses")
    .insert({ ...parsed.data, contract_id: contractId });
  if (error) return { error: error.message };
  revalidatePath(`/contracts/${contractId}`);
  return {};
}

export async function addPenalty(
  contractId: string,
  input: PenaltyInput,
): Promise<{ error?: string }> {
  const parsed = penaltySchema.safeParse(input);
  if (!parsed.success || !isValidCondition(parsed.data.condition))
    return { error: "Datos inválidos" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("contract_penalties")
    .insert({ ...parsed.data, contract_id: contractId });
  if (error) return { error: error.message };
  revalidatePath(`/contracts/${contractId}`);
  return {};
}

export async function deleteIncentive(
  contractId: string,
  table: "contract_bonuses" | "contract_penalties",
  id: string,
): Promise<{ error?: string }> {
  if (!["contract_bonuses", "contract_penalties"].includes(table))
    return { error: "Tabla inválida" };
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/contracts/${contractId}`);
  return {};
}

// ── Hitos ──────────────────────────────────────────────────────────────────

const milestoneSchema = z.object({
  trigger: z.enum(["DEPTH_REACHED", "HOLE_COMPLETED", "DATE_REACHED"]),
  trigger_value: z.record(z.string(), z.union([z.string(), z.number()])),
  amount: z.number().positive(),
});

export type MilestoneInput = z.infer<typeof milestoneSchema>;

export async function addMilestone(
  contractId: string,
  input: MilestoneInput,
): Promise<{ error?: string }> {
  const parsed = milestoneSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("contract_milestones")
    .insert({ ...parsed.data, contract_id: contractId });
  if (error) return { error: error.message };
  revalidatePath(`/contracts/${contractId}`);
  return {};
}

export async function deleteMilestone(
  contractId: string,
  id: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("contract_milestones")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/contracts/${contractId}`);
  return {};
}

// ── Alcance (rigs / sitios / consumibles) ──────────────────────────────────

const SCOPE_TABLES = {
  rigs: { table: "contract_rigs", column: "rig_id" },
  sites: { table: "contract_sites", column: "site_id" },
  consumables: { table: "contract_consumables", column: "consumable_id" },
} as const;

export async function setScope(
  contractId: string,
  kind: keyof typeof SCOPE_TABLES,
  ids: string[],
): Promise<{ error?: string }> {
  const scope = SCOPE_TABLES[kind];
  if (!scope) return { error: "Alcance inválido" };
  const parsedIds = z.array(z.uuid()).safeParse(ids);
  if (!parsedIds.success) return { error: "Datos inválidos" };

  const supabase = await createClient();
  const { error: delError } = await supabase
    .from(scope.table)
    .delete()
    .eq("contract_id", contractId);
  if (delError) return { error: delError.message };

  if (parsedIds.data.length > 0) {
    const { error } = await supabase.from(scope.table).insert(
      parsedIds.data.map((id) => ({
        contract_id: contractId,
        [scope.column]: id,
      })),
    );
    if (error) return { error: error.message };
  }

  revalidatePath(`/contracts/${contractId}`);
  return {};
}
