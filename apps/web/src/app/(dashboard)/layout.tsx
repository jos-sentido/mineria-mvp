import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/app-sidebar";
import { UserMenu } from "@/components/user-menu";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El middleware ya protege; esto es defensa en profundidad.
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-svh w-full">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4">
          <div />
          <UserMenu email={user.email ?? ""} />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
