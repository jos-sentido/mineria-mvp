import type { SupabaseClient } from "@supabase/supabase-js";

/** tenant_id del usuario autenticado (perfil en public.users). */
export async function getTenantId(
  supabase: SupabaseClient,
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  return data?.tenant_id ?? null;
}
