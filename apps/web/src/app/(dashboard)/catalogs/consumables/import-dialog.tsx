"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { importConsumables } from "./actions";

const TEMPLATE =
  "code,name,category,unit,default_cost,currency\n" +
  "BROCA-NQ,Broca diamantada NQ,DRILL_BIT,pcs,4500,MXN\n" +
  "ACEITE-15W40,Aceite motor 15W40,LUBRICANT,L,180.50,MXN\n";

const CATEGORIES = new Set([
  "DRILL_BIT",
  "LUBRICANT",
  "WATER",
  "ADDITIVE",
  "CEMENT",
  "OTHER",
]);

/** Parser CSV mínimo: comas, comillas dobles opcionales, CRLF/LF. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

export function ImportDialog() {
  const t = useTranslations("catalogs.consumables.import");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [parsed, setParsed] = useState<Record<string, unknown>[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setParsed(null);
    setParseError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCsv(String(reader.result ?? ""));
      if (rows.length < 2) {
        setParseError(t("errorEmpty"));
        return;
      }
      const header = rows[0].map((h) => h.trim().toLowerCase());
      const idx = (name: string) => header.indexOf(name);
      if (idx("code") === -1 || idx("name") === -1) {
        setParseError(t("errorHeader"));
        return;
      }
      setParsed(
        rows.slice(1).map((r) => {
          const get = (name: string) => (r[idx(name)] ?? "").trim();
          const cost = get("default_cost");
          const category = get("category").toUpperCase();
          return {
            code: get("code"),
            name: get("name"),
            category: CATEGORIES.has(category) ? category : "OTHER",
            unit: get("unit") || "pcs",
            default_cost: cost === "" ? null : Number(cost),
            currency: (get("currency") || "MXN").toUpperCase(),
          };
        }),
      );
    };
    reader.readAsText(file);
  }

  function onImport() {
    if (!parsed) return;
    startTransition(async () => {
      const result = await importConsumables(parsed);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          t("done", { imported: result.imported ?? 0, invalid: result.invalid ?? 0 }),
        );
        setOpen(false);
        setParsed(null);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setParsed(null);
          setParseError(null);
        }
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <Upload className="size-4" /> {t("button")}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("hint")}{" "}
            <a
              className="underline underline-offset-2"
              href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`}
              download="consumibles-plantilla.csv"
            >
              {t("template")}
            </a>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Input type="file" accept=".csv,text/csv" onChange={onFile} />
          {parseError && (
            <p className="text-sm text-destructive">{parseError}</p>
          )}
          {parsed && (
            <p className="text-sm text-muted-foreground">
              {t("preview", { count: parsed.length })}
            </p>
          )}
          <Button onClick={onImport} disabled={!parsed || pending}>
            {pending ? t("importing") : t("import")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
