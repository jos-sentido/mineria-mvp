"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/tenant";

const regionSchema = z.object({
  name: z.string().min(1),
  country: z.string().length(2).toUpperCase(),
  timezone: z.string().min(1),
});

export type RegionInput = z.infer<typeof regionSchema>;

export async function upsertRegion(
  id: string | null,
  input: RegionInput,
): Promise<{ error?: string }> {
  const parsed = regionSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase
      .from("regions")
      .update(parsed.data)
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const tenantId = await getTenantId(supabase);
    if (!tenantId) return { error: "Sin perfil de tenant" };
    const { error } = await supabase
      .from("regions")
      .insert({ ...parsed.data, tenant_id: tenantId });
    if (error) return { error: error.message };
  }

  revalidatePath("/catalogs/regions");
  return {};
}

export async function deleteRegion(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("regions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/catalogs/regions");
  return {};
}
