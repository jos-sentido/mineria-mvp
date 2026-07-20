"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/tenant";

const activitySchema = z.object({
  code: z.string().min(1),
  label_es: z.string().min(1),
  label_en: z.string().nullable(),
  category: z.enum([
    "DRILLING",
    "MOVING",
    "STANDBY",
    "MAINTENANCE",
    "SAFETY",
    "OTHER",
  ]),
  billable: z.boolean(),
});

export type ActivityInput = z.infer<typeof activitySchema>;

export async function upsertActivity(
  id: string | null,
  input: ActivityInput,
): Promise<{ error?: string }> {
  const parsed = activitySchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase
      .from("activities")
      .update(parsed.data)
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const tenantId = await getTenantId(supabase);
    if (!tenantId) return { error: "Sin perfil de tenant" };
    const { error } = await supabase
      .from("activities")
      .insert({ ...parsed.data, tenant_id: tenantId });
    if (error) return { error: error.message };
  }

  revalidatePath("/catalogs/activities");
  return {};
}

export async function deleteActivity(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("activities").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/catalogs/activities");
  return {};
}
