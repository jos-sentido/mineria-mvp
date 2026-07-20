"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/tenant";

const drillerSchema = z.object({
  full_name: z.string().min(1),
  employee_code: z.string().nullable(),
  base_rate: z.number().nonnegative().nullable(),
  currency: z.string().length(3),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type DrillerInput = z.infer<typeof drillerSchema>;

export async function upsertDriller(
  id: string | null,
  input: DrillerInput,
): Promise<{ error?: string }> {
  const parsed = drillerSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase
      .from("drillers")
      .update(parsed.data)
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const tenantId = await getTenantId(supabase);
    if (!tenantId) return { error: "Sin perfil de tenant" };
    const { error } = await supabase
      .from("drillers")
      .insert({ ...parsed.data, tenant_id: tenantId });
    if (error) return { error: error.message };
  }

  revalidatePath("/catalogs/drillers");
  return {};
}

export async function deleteDriller(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("drillers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/catalogs/drillers");
  return {};
}
