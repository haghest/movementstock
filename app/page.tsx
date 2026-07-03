"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Copy, Loader2, FileUp } from "lucide-react";
import { toast } from "sonner";
import { ModeToggle } from "@/components/toggle-theme";
import { Separator } from "@/components/ui/separator";
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
    <main className="relative">
      <div className="fixed bottom-4 right-4">
        <ModeToggle />
      </div>

      <div className="flex items-center justify-center min-h-screen">
        <div className="min-w-2xl max-w-2xl mx-auto p-10  gap-3">
          <Card>
            <CardHeader>
              <h1 className="text-xl font-semibold">Movement Stock</h1>
              <p className="text-sm text-muted-foreground">
                Merubah Sales Details Odoo menjadi format sheets movement stock.
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />

                <div className="group  rounded-xl border border-dashed    p-8 transition-all duration-300  ">
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-full  p-4 border ">
                      <FileUp className="size-6" />
                    </div>

                    <div className="text-center">
                      <p className="font-medium">
                        {file ? file.name : "Upload .PDF Daily Sales"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Click or drag & drop PDF file
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="lg"
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}

                  {loading ? "Memproses..." : "Proses PDF"}
                </Button>

                {result && (
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() =>
                      copyToClipboard(
                        outFormula,
                        "Rumus OUT berhasil disalin, paste di baris produk pertama kolom OUT",
                      )
                    }
                  >
                    <Copy className="size-4 mr-1" />
                    Salin Rumus OUT
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {result && (
            <Card className="mt-3">
              <CardHeader className=" ">
                <h1 className="text-lg font-semibold">Data</h1>
              </CardHeader>
              <CardContent className="flex gap-12">
                <div>
                  <h2 className="font-semibold text-xs text-muted-foreground tracking-wider uppercase">
                    Sales
                  </h2>
                  {/*<p>SKU: {result.summary.salesSkuCount}</p>*/}
                  <p className="font-semibold text-4xl ">
                    {result.summary.salesQty + result.summary.unknownOutQty}
                  </p>
                </div>
                <div>
                  <h2 className="font-semibold text-xs text-muted-foreground tracking-wider uppercase">
                    Refund
                  </h2>
                  {/*<p>SKU: {result.summary.refundSkuCount}</p>*/}
                  <p className="font-semibold text-4xl">
                    {result.summary.refundQty + result.summary.unknownRefundQty}
                  </p>
                </div>
              </CardContent>
              <Separator className="" />
              <div className=" px-4">
                <Badge variant="destructive" className="mb-3">
                  Produk perlu input manual
                </Badge>
                <div className="font-semibold flex items-center gap-2 justify-between">
                  <p>Produk yang tidak masuk rumus</p>
                  <p>Total: {unmatchedQty} PCS</p>
                </div>

                <div className="mt-3 space-y-4">
                  <div>
                    <div className="flex justify-between text-sm font-semibold">
                      <p>Sales / OUT</p>
                      <p>{unmatchedOutQty} PCS</p>
                    </div>
                    {unmatchedOutItems.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {unmatchedOutItems.map((item, index) => (
                          <li
                            key={index}
                            className="flex justify-between gap-3 border-b py-1 last:border-b-0"
                          >
                            <span>
                              {PRODUCT_ALIASES[item.name] ?? item.name}
                            </span>
                            <span className="font-semibold">
                              {item.qty} PCS
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Semua produk sales tanpa SKU sudah masuk rumus.
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between text-sm font-semibold">
                      <p>Refund</p>
                      <p>{unmatchedRefundQty} PCS</p>
                    </div>
                    {unmatchedRefundItems.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {unmatchedRefundItems.map((item, index) => (
                          <li
                            key={index}
                            className="flex justify-between gap-3 border-b py-1 last:border-b-0"
                          >
                            <span>
                              {PRODUCT_ALIASES[item.name] ?? item.name}
                            </span>
                            <span className="font-semibold">
                              {item.qty} PCS
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Semua produk refund tanpa SKU sudah masuk rumus.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {result && (
            <div className="grid gap-3 md:grid-cols-2 mt-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Rumus REFUND</CardTitle>
                    {refundFormulaStats && (
                      <p className="text-xs text-muted-foreground">
                        {refundFormulaStats.uniqueItems} item unik ·{" "}
                        {refundFormulaStats.length} karakter
                      </p>
                    )}
                  </div>
                  <Button
                    variant="secondary"
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
                    Paste formula ini cukup sekali di baris produk pertama kolom
                    REFUND tanggal yang sesuai.
                  </p>
                  {refundFormula ? (
                    <pre className="max-h-48 overflow-auto text-xs whitespace-pre-wrap border rounded-sm p-3 border-dashed break-all">
                      {refundFormula}
                    </pre>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Tidak ada refund pada PDF ini.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Rumus OUT</CardTitle>
                    {outFormulaStats && (
                      <p className="text-xs text-muted-foreground">
                        {outFormulaStats.uniqueItems} item unik ·{" "}
                        {outFormulaStats.length} karakter
                      </p>
                    )}
                  </div>
                  <Button
                    variant="secondary"
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
                    Paste formula ini cukup sekali di baris produk pertama kolom
                    OUT tanggal yang sesuai.
                  </p>
                  <pre className="max-h-48 overflow-auto text-xs whitespace-pre-wrap border rounded-sm p-3 border-dashed break-all">
                    {outFormula}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
