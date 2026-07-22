import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ContractDialog } from "./contract-dialog";

type ContractRow = {
  id: string;
  code: string;
  name: string;
  currency: string;
  status: "DRAFT" | "ACTIVE" | "SUSPENDED" | "IN_BILLING" | "CLOSED";
  billing_cycle: string;
  starts_at: string | null;
  ends_at: string | null;
};

const STATUS_VARIANT: Record<
  ContractRow["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  DRAFT: "outline",
  ACTIVE: "default",
  SUSPENDED: "destructive",
  IN_BILLING: "secondary",
  CLOSED: "secondary",
};

export default async function ContractsPage() {
  const t = await getTranslations("contracts");
  const tCrud = await getTranslations("crud");
  const supabase = await createClient();
  const { data: contracts } = await supabase
    .from("contracts")
    .select("id, code, name, currency, status, billing_cycle, starts_at, ends_at")
    .order("code");

  const rows = (contracts ?? []) as ContractRow[];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <ContractDialog
          trigger={
            <Button size="sm">
              <Plus className="size-4" /> {t("new")}
            </Button>
          }
        />
      </div>

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {tCrud("empty")}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("code")}</TableHead>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("billingCycle")}</TableHead>
              <TableHead>{t("validity")}</TableHead>
              <TableHead>{tCrud("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell className="font-mono">
                  <Link
                    href={`/contracts/${contract.id}`}
                    className="underline-offset-2 hover:underline"
                  >
                    {contract.code}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/contracts/${contract.id}`}>
                    {contract.name}
                  </Link>
                </TableCell>
                <TableCell>{t(`cycles.${contract.billing_cycle}`)}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {contract.starts_at ?? "—"} → {contract.ends_at ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[contract.status]}>
                    {t(`statuses.${contract.status}`)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
