"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { toast } from "sonner";
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
  IMPORT!$E:$E,
  ""
  ),"")`,

    out: `=IFERROR(
  XLOOKUP(
  REGEXEXTRACT($B6,"\\[([^\\]]+)\\]"),
  IMPORT!$A:$A,
  IMPORT!$F:$F,
  ""
  ),"")`,
  };

  return (
    <main className="bg-[#F1F0EC] ">
      <div className="flex items-center justify-center h-screen">
        <div className=" max-w-4xl mx-auto p-10 font-[Inter] ">
          <Card>
            <CardHeader>
              {/*<CardTitle>Movement Stock</CardTitle>*/}
              <h1 className="text-lg font-semibold">Movement Stock</h1>
              <p className="text-sm text-muted-foreground">
                Merubah PDF Daily Sales Odoo menjadi Format Sheets.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />

                <div className="group rounded-xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 p-10 transition-all duration-300 hover:border-slate-500 hover:shadow-lg ">
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-full bg-white p-4 border ">
                      <Upload className="h-8 w-8 text-zinc-700" />
                    </div>

                    <div className="text-center">
                      <p className="font-medium">
                        {file ? file.name : "Upload PDF Daily Sales"}
                      </p>
                      {/*<p className="mt-1 text-sm text-muted-foreground">
                    Click or drag & drop PDF file
                  </p>*/}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="lg"
                  onClick={handleUpload}
                  disabled={!file || loading}
                >
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
                            // description: "Silakan paste ke sheet IMPORT.",
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
                    Salin Data
                  </Button>
                )}
              </div>

              {text && (
                <Textarea value={text} readOnly className="min-h-[400px]" />
              )}
            </CardContent>
          </Card>
          <div className="grid gap-2 md:grid-cols-2 mt-2">
            {/*<Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Formula IN</CardTitle>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigator.clipboard.writeText(formulas.in)}
            >
              Copy
            </Button>
          </CardHeader>

          <CardContent>
            <pre className="text-xs whitespace-pre-wrap break-all">
              {formulas.in}
            </pre>
          </CardContent>
        </Card>*/}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Rumus REFUND</CardTitle>
                <Button
                  onClick={async () => {
                    await navigator.clipboard.writeText(formulas.refund);

                    toast.success("Rumus REFUND berhasil disalin", {
                      position: "top-center",
                    });
                  }}
                >
                  Salin
                </Button>
              </CardHeader>

              <CardContent>
                <pre className="text-xs whitespace-pre-wrap break-all">
                  {formulas.refund}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Rumus OUT</CardTitle>
                <Button
                  onClick={async () => {
                    await navigator.clipboard.writeText(formulas.out);

                    toast.success("Rumus OUT berhasil disalin", {
                      position: "top-center",
                    });
                  }}
                >
                  Salin
                </Button>
              </CardHeader>

              <CardContent>
                <pre className="text-xs whitespace-pre-wrap break-all">
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
