"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/tenant";

const rigSchema = z.object({
  code: z.string().min(1),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  serial_number: z.string().nullable(),
  type: z.enum(["DIAMOND_CORE", "RC", "PERCUSSION", "TUNNELING", "OTHER"]),
  status: z.enum(["OPERATIONAL", "MAINTENANCE", "INACTIVE", "MOVING"]),
  site_id: z.uuid().nullable(),
});

export type RigInput = z.infer<typeof rigSchema>;

export async function upsertRig(
  id: string | null,
  input: RigInput,
): Promise<{ error?: string }> {
  const parsed = rigSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase
      .from("rigs")
      .update(parsed.data)
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const tenantId = await getTenantId(supabase);
    if (!tenantId) return { error: "Sin perfil de tenant" };
    const { error } = await supabase
      .from("rigs")
      .insert({ ...parsed.data, tenant_id: tenantId });
    if (error) return { error: error.message };
  }

  revalidatePath("/catalogs/rigs");
  return {};
}

export async function deleteRig(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("rigs").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/catalogs/rigs");
  return {};
}
