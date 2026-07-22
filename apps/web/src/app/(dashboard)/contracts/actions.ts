"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/tenant";

const contractSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  currency: z.string().length(3),
  status: z.enum(["DRAFT", "ACTIVE", "SUSPENDED", "IN_BILLING", "CLOSED"]),
  billing_cycle: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM"]),
  starts_at: z.string().nullable(),
  ends_at: z.string().nullable(),
  po_number: z.string().nullable(),
  notes: z.string().nullable(),
});

export type ContractInput = z.infer<typeof contractSchema>;

export async function upsertContract(
  id: string | null,
  input: ContractInput,
): Promise<{ error?: string; id?: string }> {
  const parsed = contractSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase
      .from("contracts")
      .update(parsed.data)
      .eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/contracts/${id}`);
    revalidatePath("/contracts");
    return { id };
  }

  const tenantId = await getTenantId(supabase);
  if (!tenantId) return { error: "Sin perfil de tenant" };
  const { data, error } = await supabase
    .from("contracts")
    .insert({ ...parsed.data, tenant_id: tenantId })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/contracts");
  return { id: data.id };
}

export async function deleteContract(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("contracts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/contracts");
  return {};
}
