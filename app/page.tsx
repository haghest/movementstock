"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Copy, Loader2, FileUp, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { ModeToggle } from "@/components/toggle-theme";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
export default function Home() {
  const [result, setResult] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
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

    setText(data.text);
    setResult(data);

    setLoading(false);
  }

  const formulas = {
    in: `=IFERROR(
  XLOOKUP(
  REGEXEXTRACT($B6,"\\[([^\\]]+)\\]"),
  IMPORT!$A:$A,
  IMPORT!$D:$D,
  ""
  ),"")`,

    refund: `=IFERROR(
  XLOOKUP(
  REGEXEXTRACT($B6,"\\[([^\\]]+)\\]"),
  IMPORT!$A:$A,
  IMPORT!$C:$C,
  ""
  ),"")`,

    out: `=IFERROR(
  XLOOKUP(
  REGEXEXTRACT($B6,"\\[([^\\]]+)\\]"),
  IMPORT!$A:$A,
  IMPORT!$D:$D,
  ""
  ),"")`,
  };

  const PRODUCT_ALIASES: Record<string, string> = {
    "MICRO POUCHES (Micro, Unique": "MICRO POUCHES (Micro, Unique (🌈))",

    "Mini Backpack XS - Made In Sunset": "Mini Backpack XS - Made In Sunset",

    "Mini Backpack - Made in Sunset": "Mini Backpack - Made In Sunset",

    "Product Reparation": "Product Reparation",

    "CMD Custom Embroidery": "CMD Custom Embroidery",

    "Sling Bag - Made in Sunset": "Sling Bag - Made In Sunset",
  };

  return (
    <main className="relative">
      <div className="fixed bottom-4 right-4">
        <ModeToggle />
      </div>

      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-2xl mx-auto p-10  gap-3">
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
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(result.importData);

                        toast.success(
                          "Data berhasil disalin, silahkan paste ke sheet IMPORT",
                          {
                            position: "top-center",
                          },
                        );
                      } catch {
                        toast.error("Gagal menyalin data", {
                          position: "top-center",
                        });
                      }
                    }}
                  >
                    <Copy className="size-4 mr-1" />
                    Salin Data
                  </Button>
                )}
              </div>

              {text && (
                <Textarea value={text} readOnly className="min-h-[400px]" />
              )}
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
                    {result.summary.salesQty + result.summary.unknownQty}
                  </p>
                </div>
                <div>
                  <h2 className="font-semibold text-xs text-muted-foreground tracking-wider uppercase">
                    Refund
                  </h2>
                  {/*<p>SKU: {result.summary.refundSkuCount}</p>*/}
                  <p className="font-semibold text-4xl">
                    {result.summary.refundQty}
                  </p>
                </div>
              </CardContent>
              <Separator className="" />
              <div className=" px-4">
                <Badge variant="destructive" className="mb-3">
                  Produk tanpa SKU tetap input manual
                </Badge>
                <div className="font-semibold flex items-center gap-2 justify-between">
                  <p>Produk terdeteksi tanpa SKU</p>
                  <p>Total: {result.summary.unknownQty} PCS</p>
                </div>
                <ul className="mt-2 space-y-1">
                  {result.parsed.unknown.map((item: any, index: number) => (
                    <li
                      key={index}
                      className="flex justify-between border-b py-1 last:border-b-0"
                    >
                      <span>{PRODUCT_ALIASES[item.name] ?? item.name}</span>
                      <span className="font-semibold">{item.qty} PCS</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}

          {/*{result && (
            <div className="mt-4 font-bold">
              {result.summary.unknownQty > 0
                ? "⚠ Ada item tanpa SKU"
                : "✅ Semua item berhasil diparse"}
            </div>
          )}

          {result?.parsed?.unknown && (
            <pre>{JSON.stringify(result.parsed.unknown, null, 2)}</pre>
          )}*/}

          <div className="grid gap-3 md:grid-cols-2 mt-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Rumus REFUND</CardTitle>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await navigator.clipboard.writeText(formulas.refund);

                    toast.success("Rumus REFUND berhasil disalin", {
                      position: "top-center",
                    });
                  }}
                >
                  <Copy className="size-4 mr-1" />
                  Salin
                </Button>
              </CardHeader>

              <CardContent>
                <pre className="text-xs whitespace-pre-wrap border rounded-sm p-3 border-dashed break-all ">
                  {formulas.refund}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Rumus OUT</CardTitle>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await navigator.clipboard.writeText(formulas.out);

                    toast.success("Rumus OUT berhasil disalin", {
                      position: "top-center",
                    });
                  }}
                >
                  <Copy className="size-4 mr-1" />
                  Salin
                </Button>
              </CardHeader>

              <CardContent>
                <pre className="text-xs whitespace-pre-wrap border rounded-sm p-3 border-dashed break-all">
                  {formulas.out}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
