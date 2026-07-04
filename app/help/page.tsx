import Link from "next/link";
import {
  ArrowLeft,
  FileDown,
  FileUp,
  Copy,
  Table2,
  FileSpreadsheet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const steps = [
  {
    title: "Download Daily Sales",
    description: "Ambil laporan Sales Details dari Odoo setelah closing kasir.",
    icon: FileDown,
    items: ["Buka Odoo di kasir.", "Klik Close Register.", "Klik Daily Sales."],
  },
  {
    title: "Upload ke Website",
    description:
      "Upload PDF ke website agar data sales dan refund dibaca otomatis.",
    icon: FileUp,
    items: [
      "Buka tttm.haga.my.id pada Chrome kasir",
      "Pilih file PDF Daily Sales yang telah di download.",
      "Klik Proses PDF dan tunggu sampai data muncul.",
    ],
  },
  {
    title: "Salin Rumus OUT / REFUND",
    description: "Salin rumus yang dihasilkan pada website.",
    icon: Copy,
    items: [
      "Klik Salin Rumus OUT untuk penjualan.",
      "Jika ada refund, salin juga Rumus REFUND.",
      "Cek bagian Produk yang tidak masuk rumus untuk diinput manual jika ada.",
    ],
  },
  {
    title: "Paste di Movement Stock",
    description:
      "Tempel rumus cukup sekali pada baris produk pertama di tanggal yang sesuai.",
    icon: FileSpreadsheet,
    items: [
      "Buka Google Sheet Movement Stock.",
      "Cari tanggal movement stock.",
      "Paste Rumus OUT di baris produk pertama kolom OUT.",
      "Paste Rumus REFUND di baris produk pertama kolom REFUND jika diperlukan.",
    ],
  },
  {
    title: "Jadikan Paste Values Only",
    description: "Setelah angka keluar, ubah hasil rumus menjadi value.",
    icon: Table2,
    items: [
      "Blok hasil pada kolom OUT / REFUND yang baru terisi.",
      "Copy hasil tersebut.",
      "Klik salah satu kolom, lalu tekan Paste special → Values only.",
    ],
  },
];

export default function Help() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-4 py-6  font-[Inter]">
      <section className=" flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
        <div className="space-y-8">
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <ArrowLeft /> Kembali
            </Link>
          </Button>
          <h1 className="text-3xl mb-6 md:mb-0 font-medium md:text-4xl">
            Cara Penggunaan
          </h1>
        </div>
      </section>

      <div className="grid gap-4 s">
        {steps.map((step, index) => {
          return (
            <Card key={step.title}>
              <CardHeader className="md:grid-cols-[auto_1fr] md:items-start">
                <div>
                  <Badge variant="default">Langkah {index + 1}</Badge>
                  <div className="mb-1 mt-2 flex items-center">
                    <CardTitle>{step.title}</CardTitle>
                  </div>
                  <CardDescription>{step.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2.5 text-sm">
                  {step.items.map((item, itemIndex) => (
                    <li key={item} className="flex gap-3">
                      <span className=" flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                        {itemIndex + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/*<Separator className="my-6" />*/}

      {/*<Card className="mb-8">
        <CardHeader>
          <CardTitle>Catatan penting</CardTitle>
          <CardDescription>
            Supaya data tetap aman dan tidak berubah di hari berikutnya.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-lg border p-3">
            <p className="font-medium">Pastikan tanggal benar</p>
            <p className="mt-1 text-muted-foreground">
              Paste rumus hanya di kolom tanggal penjualan yang sesuai.
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="font-medium">Paste cukup sekali</p>
            <p className="mt-1 text-muted-foreground">
              Jangan paste ke semua baris. Rumus array akan mengisi hasil ke
              bawah otomatis.
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="font-medium">Akhiri dengan Values only</p>
            <p className="mt-1 text-muted-foreground">
              Setelah angka muncul, ubah hasil menjadi value agar kolom tersebut
              tidak bergantung pada rumus lagi.
            </p>
          </div>
        </CardContent>
      </Card>*/}
    </main>
  );
}
