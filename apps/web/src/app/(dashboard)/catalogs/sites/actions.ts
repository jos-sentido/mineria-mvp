"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/tenant";

const siteSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  altitude_m: z.number().int().nullable(),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
});

export type SiteInput = z.infer<typeof siteSchema>;

export async function upsertSite(
  id: string | null,
  input: SiteInput,
): Promise<{ error?: string }> {
  const parsed = siteSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };
  const { lat, lng, ...fields } = parsed.data;

  const supabase = await createClient();
  const row: Record<string, unknown> = { ...fields };
  if (lat != null && lng != null) {
    row.location = `SRID=4326;POINT(${lng} ${lat})`;
  }

  if (id) {
    const { error } = await supabase.from("sites").update(row).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const tenantId = await getTenantId(supabase);
    if (!tenantId) return { error: "Sin perfil de tenant" };
    const { error } = await supabase
      .from("sites")
      .insert({ ...row, tenant_id: tenantId });
    if (error) return { error: error.message };
  }

  revalidatePath("/catalogs/sites");
  return {};
}

export async function deleteSite(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("sites").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/catalogs/sites");
  return {};
}
