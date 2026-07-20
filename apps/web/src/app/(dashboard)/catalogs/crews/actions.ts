"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/tenant";

const crewSchema = z.object({
  name: z.string().min(1),
  rig_id: z.uuid().nullable(),
  lead_driller_id: z.uuid().nullable(),
  member_ids: z.array(z.uuid()),
});

export type CrewInput = z.infer<typeof crewSchema>;

export async function upsertCrew(
  id: string | null,
  input: CrewInput,
): Promise<{ error?: string }> {
  const parsed = crewSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };
  const { member_ids, ...fields } = parsed.data;

  const supabase = await createClient();
  let crewId = id;

  if (crewId) {
    const { error } = await supabase
      .from("crews")
      .update(fields)
      .eq("id", crewId);
    if (error) return { error: error.message };
  } else {
    const tenantId = await getTenantId(supabase);
    if (!tenantId) return { error: "Sin perfil de tenant" };
    const { data, error } = await supabase
      .from("crews")
      .insert({ ...fields, tenant_id: tenantId })
      .select("id")
      .single();
    if (error) return { error: error.message };
    crewId = data.id;
  }

  // Reemplazo completo de miembros (simple e idempotente)
  const { error: delError } = await supabase
    .from("crew_members")
    .delete()
    .eq("crew_id", crewId);
  if (delError) return { error: delError.message };

  if (member_ids.length > 0) {
    const { error: insError } = await supabase.from("crew_members").insert(
      member_ids.map((driller_id) => ({
        crew_id: crewId,
        driller_id,
        role_in_crew: driller_id === fields.lead_driller_id ? "lead" : "driller",
      })),
    );
    if (insError) return { error: insError.message };
  }

  revalidatePath("/catalogs/crews");
  return {};
}

export async function deleteCrew(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("crews").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/catalogs/crews");
  return {};
}
