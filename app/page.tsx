"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Copy, Loader2, FileUp, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { ModeToggle } from "@/components/toggle-theme";
import { Badge } from "@/components/ui/badge";
import {
  generateSkuArrayFormula,
  getFormulaStats,
} from "@/lib/generateFormula";

type UnknownItem = { name: string; qty: number };

type ParsedResult = {
  parsed: {
    out: Record<string, number>;
    refund: Record<string, number>;
    unknown: UnknownItem[];
    unknownOut: UnknownItem[];
    unknownRefund: UnknownItem[];
  };
  summary: {
    salesSkuCount: number;
    salesQty: number;
    refundSkuCount: number;
    refundQty: number;
    unknownQty: number;
    unknownOutQty: number;
    unknownRefundQty: number;
  };
  importData: string;
  text?: string;
};

const PRODUCT_ALIASES: Record<string, string> = {
  "MICRO POUCHES (Micro, Unique": "MICRO POUCHES (Micro, Unique (🌈))",
  "Mini Backpack XS - Made In Sunset": "Mini Backpack XS - Made In Sunset",
  "Mini Backpack - Made in Sunset": "Mini Backpack - Made In Sunset",
  "Product Reparation": "Product Reparation",
  "CMD Custom Embroidery": "CMD Custom Embroidery",
  "Sling Bag - Made in Sunset": "Sling Bag - Made In Sunset",
};

function getMovementStockProductName(name: string) {
  return PRODUCT_ALIASES[name] ?? name;
}

function shouldIncludeNameInFormula(name: string) {
  const normalizedName = name.toLowerCase();

  return (
    normalizedName.includes("made in sunset") ||
    normalizedName.includes("embroidery") ||
    normalizedName.includes("product reparation") ||
    normalizedName.includes("keychain kuksa standard - one shot")
  );
}

function getFormulaNameItems(items: UnknownItem[]) {
  const merged = new Map<string, number>();

  for (const item of items) {
    if (!shouldIncludeNameInFormula(item.name)) continue;

    const productName = getMovementStockProductName(item.name);
    merged.set(productName, (merged.get(productName) ?? 0) + item.qty);
  }

  return Array.from(merged.entries()).map(([name, qty]) => ({ name, qty }));
}

function getItemsNotInFormula(items: UnknownItem[]) {
  return items.filter((item) => !shouldIncludeNameInFormula(item.name));
}

function sumQty(items: UnknownItem[]) {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

export default function Home() {
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("pdf", file);

    const res = await fetch("/api/parse", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    setResult(data);

    setLoading(false);
  }

  const outNameItems = result
    ? getFormulaNameItems(result.parsed.unknownOut)
    : [];
  const refundNameItems = result
    ? getFormulaNameItems(result.parsed.unknownRefund)
    : [];
  const outFormula = result
    ? generateSkuArrayFormula(result.parsed.out, {
        negative: true,
        nameItems: outNameItems,
      })
    : "";
  const refundFormula = result
    ? generateSkuArrayFormula(result.parsed.refund, {
        nameItems: refundNameItems,
      })
    : "";
  const outFormulaStats = result
    ? getFormulaStats(
        outFormula,
        result.summary.salesSkuCount + outNameItems.length,
      )
    : null;
  const refundFormulaStats = result
    ? getFormulaStats(
        refundFormula,
        result.summary.refundSkuCount + refundNameItems.length,
      )
    : null;
  const unmatchedOutItems = result
    ? getItemsNotInFormula(result.parsed.unknownOut)
    : [];
  const unmatchedRefundItems = result
    ? getItemsNotInFormula(result.parsed.unknownRefund)
    : [];
  const unmatchedOutQty = sumQty(unmatchedOutItems);
  const unmatchedRefundQty = sumQty(unmatchedRefundItems);
  const unmatchedQty = unmatchedOutQty + unmatchedRefundQty;

  async function copyToClipboard(value: string, successMessage: string) {
    if (!value) {
      toast.error("Tidak ada data untuk disalin", {
        position: "top-center",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(value);

      toast.success(successMessage, {
        position: "top-center",
      });
    } catch {
      toast.error("Gagal menyalin data", {
        position: "top-center",
      });
    }
  }

  return (
    <main className="relative min-h-screen px-4 py-6 sm:px-6 lg:px-8 flex justify-center items-center ">
      <div className="mx-auto  w-full max-w-xl flex-col gap-3 sm:gap-4">
        <div className="w-full">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h1 className="text-lg font-medium">Movement Stock</h1>
              <Button asChild variant="outline">
                <Link href="/help">
                  <HelpCircle className="size-4" />
                  Tutorial
                </Link>
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];

                    if (!selectedFile) return;

                    // Hanya PDF
                    if (selectedFile.type !== "application/pdf") {
                      toast.error("Hanya file PDF yang diperbolehkan.", {
                        position: "top-center",
                      });

                      e.target.value = "";
                      setFile(null);
                      return;
                    }

                    // Maksimal 2 MB
                    const MAX_SIZE = 2 * 1024 * 1024;

                    if (selectedFile.size > MAX_SIZE) {
                      toast.error("Ukuran file maksimal 2 MB.", {
                        position: "top-center",
                      });

                      e.target.value = "";
                      setFile(null);
                      return;
                    }

                    setFile(selectedFile);
                  }}
                  className="absolute inset-0 cursor-pointer opacity-0 "
                />

                <div className="group rounded-xl border border-dashed p-5 transition-all duration-300 sm:p-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-full  p-4 border ">
                      <FileUp className="size-6" />
                    </div>

                    <div className="text-center">
                      <p className="break-all font-medium sm:break-normal">
                        {file ? file.name : "Upload .PDF Daily Sales"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Click or drag & drop PDF file
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  size="lg"
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="w-full gap-2 sm:w-auto"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}

                  {loading ? "Memproses..." : "Proses PDF"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {result && (
            <Card className="mt-3">
              <CardHeader className=" ">
                <h1 className="text-lg font-semibold">Data</h1>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 sm:flex sm:gap-12">
                <div>
                  <h2 className="font-semibold text-xs text-muted-foreground tracking-wider uppercase">
                    Sales
                  </h2>
                  {/*<p>SKU: {result.summary.salesSkuCount}</p>*/}
                  <p className="font-semibold text-3xl sm:text-4xl">
                    {result.summary.salesQty + result.summary.unknownOutQty}
                  </p>
                </div>
                <div>
                  <h2 className="font-semibold text-xs text-muted-foreground tracking-wider uppercase">
                    Refund
                  </h2>
                  {/*<p>SKU: {result.summary.refundSkuCount}</p>*/}
                  <p className="font-semibold text-3xl sm:text-4xl">
                    {result.summary.refundQty + result.summary.unknownRefundQty}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {result && unmatchedQty > 0 && (
            <Card className="mt-3">
              <CardContent>
                <Badge variant="destructive" className="mb-3">
                  Produk tidak masuk rumus
                </Badge>
                {/*<div className="flex flex-col gap-1 font-bold sm:flex-row sm:items-center sm:justify-between">
                  <p>Produk yang tidak masuk rumus</p>
                  <p>Total: {unmatchedQty} PCS</p>
                </div>*/}

                <div className=" space-y-4">
                  {unmatchedOutItems.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between gap-3 text-sm font-semibold">
                        <p>Sales / OUT</p>
                        <p className="shrink-0">Total: {unmatchedOutQty} PCS</p>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {unmatchedOutItems.map((item, index) => (
                          <li
                            key={index}
                            className="flex items-start justify-between gap-3 border-b py-1 last:border-b-0"
                          >
                            <span className="min-w-0 wrap-break-words">
                              {PRODUCT_ALIASES[item.name] ?? item.name}
                            </span>
                            <span className="shrink-0 font-semibold">
                              {item.qty} PCS
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {unmatchedRefundItems.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between gap-3 text-sm font-semibold">
                        <p>Refund</p>
                        <p className="shrink-0">
                          Total: {unmatchedRefundQty} PCS
                        </p>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {unmatchedRefundItems.map((item, index) => (
                          <li
                            key={index}
                            className="flex items-start justify-between gap-3 border-b py-1 last:border-b-0"
                          >
                            <span className="min-w-0 wrap-break-words">
                              {PRODUCT_ALIASES[item.name] ?? item.name}
                            </span>
                            <span className="shrink-0 font-semibold">
                              {item.qty} PCS
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {result && (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <CardTitle className="text-base">Rumus REFUND</CardTitle>
                    {refundFormulaStats && (
                      <p className="text-xs text-muted-foreground">
                        {/*{refundFormulaStats.uniqueItems} item unik ·{" "}*/}
                        {refundFormulaStats.length} karakter
                      </p>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    className="w-full sm:w-auto"
                    disabled={!refundFormula}
                    onClick={() =>
                      copyToClipboard(
                        refundFormula,
                        "Rumus REFUND berhasil disalin, paste di baris produk pertama kolom REFUND",
                      )
                    }
                  >
                    <Copy className="size-4 mr-1" />
                    Salin
                  </Button>
                </CardHeader>

                <CardContent className="space-y-2">
                  {refundFormulaStats?.isNearLimit && (
                    <Badge variant="destructive">
                      Formula mendekati batas panjang Google Sheets
                    </Badge>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Paste formula ini di baris produk pertama kolom REFUND
                    tanggal yang sesuai.
                  </p>
                  <pre className="max-h-48 overflow-auto text-xs whitespace-pre-wrap border rounded-sm p-3 border-dashed break-all">
                    {refundFormula}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <CardTitle className="text-base">Rumus OUT</CardTitle>
                    {outFormulaStats && (
                      <p className="text-xs text-muted-foreground">
                        {/*{outFormulaStats.uniqueItems} item unik ·{" "}*/}
                        {outFormulaStats.length} karakter
                      </p>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    className="w-full sm:w-auto"
                    disabled={!outFormula}
                    onClick={() =>
                      copyToClipboard(
                        outFormula,
                        "Rumus OUT berhasil disalin, paste di baris produk pertama kolom OUT",
                      )
                    }
                  >
                    <Copy className="size-4 mr-1" />
                    Salin
                  </Button>
                </CardHeader>

                <CardContent className="space-y-2">
                  {outFormulaStats?.isNearLimit && (
                    <Badge variant="destructive">
                      Formula mendekati batas panjang Google Sheets
                    </Badge>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Paste formula ini di baris produk pertama kolom OUT tanggal
                    yang sesuai.
                  </p>
                  <pre className="max-h-48 overflow-auto text-xs whitespace-pre-wrap border rounded-sm p-3 border-dashed break-all">
                    {outFormula}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}
          <p className="text-center font-medium text-xs text-muted-foreground pt-6">
            Versi 0.2 - 2026
          </p>
        </div>
      </div>
    </main>
  );
}
