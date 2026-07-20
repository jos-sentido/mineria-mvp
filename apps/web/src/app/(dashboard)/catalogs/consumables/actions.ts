"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/tenant";

const consumableSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  category: z.enum([
    "DRILL_BIT",
    "LUBRICANT",
    "WATER",
    "ADDITIVE",
    "CEMENT",
    "OTHER",
  ]),
  unit: z.string().min(1),
  default_cost: z.number().nonnegative().nullable(),
  currency: z.string().length(3),
});

export type ConsumableInput = z.infer<typeof consumableSchema>;

export async function upsertConsumable(
  id: string | null,
  input: ConsumableInput,
): Promise<{ error?: string }> {
  const parsed = consumableSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase
      .from("consumables")
      .update(parsed.data)
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const tenantId = await getTenantId(supabase);
    if (!tenantId) return { error: "Sin perfil de tenant" };
    const { error } = await supabase
      .from("consumables")
      .insert({ ...parsed.data, tenant_id: tenantId });
    if (error) return { error: error.message };
  }

  revalidatePath("/catalogs/consumables");
  return {};
}

const importRowSchema = consumableSchema.extend({
  default_cost: z.number().nonnegative().nullable(),
});

export async function importConsumables(
  rows: unknown[],
): Promise<{ error?: string; imported?: number; invalid?: number }> {
  if (!Array.isArray(rows) || rows.length === 0)
    return { error: "Archivo vacío" };
  if (rows.length > 1000) return { error: "Máximo 1000 filas por importación" };

  const valid: ConsumableInput[] = [];
  let invalid = 0;
  for (const row of rows) {
    const parsed = importRowSchema.safeParse(row);
    if (parsed.success) valid.push(parsed.data);
    else invalid++;
  }
  if (valid.length === 0) return { error: "Ninguna fila válida", invalid };

  const supabase = await createClient();
  const tenantId = await getTenantId(supabase);
  if (!tenantId) return { error: "Sin perfil de tenant" };

  const { error } = await supabase
    .from("consumables")
    .upsert(
      valid.map((v) => ({ ...v, tenant_id: tenantId })),
      { onConflict: "tenant_id,code" },
    );
  if (error) return { error: error.message };

  revalidatePath("/catalogs/consumables");
  return { imported: valid.length, invalid };
}

export async function deleteConsumable(
  id: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("consumables").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/catalogs/consumables");
  return {};
}
