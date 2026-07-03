import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardPaste,
  Download,
  FileText,
  MousePointerClick,
  Upload,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
    icon: Download,
    items: [
      "Buka Odoo di kasir.",
      "Klik Close Register.",
      "Print atau download Sales Details hari ini dalam format PDF.",
    ],
  },
  {
    title: "Upload ke Parser",
    description:
      "Masukkan PDF ke website agar data sales dan refund dibaca otomatis.",
    icon: Upload,
    items: [
      "Buka halaman utama Movement Stock Parser.",
      "Pilih file PDF Daily Sales.",
      "Klik Proses PDF dan tunggu sampai data muncul.",
    ],
  },
  {
    title: "Salin Rumus OUT / REFUND",
    description:
      "Website akan membuat rumus siap paste. Data sudah ada di dalam rumus, jadi tidak perlu sheet IMPORT.",
    icon: FileText,
    items: [
      "Klik Salin Rumus OUT untuk penjualan.",
      "Jika ada refund, salin juga Rumus REFUND.",
      "Cek bagian Produk yang tidak masuk rumus untuk input manual.",
    ],
  },
  {
    title: "Paste di Movement Stock",
    description:
      "Tempel rumus cukup sekali pada baris produk pertama di tanggal yang sesuai.",
    icon: ClipboardPaste,
    items: [
      "Buka Google Sheet Movement Stock.",
      "Cari tanggal penjualan yang benar.",
      "Paste Rumus OUT di baris produk pertama kolom OUT.",
      "Paste Rumus REFUND di baris produk pertama kolom REFUND jika diperlukan.",
    ],
  },
  {
    title: "Jadikan Values Only",
    description:
      "Setelah angka keluar, ubah hasil rumus menjadi value agar data hari ini tidak berubah lagi.",
    icon: MousePointerClick,
    items: [
      "Blok hasil pada kolom OUT / REFUND yang baru terisi.",
      "Copy hasil tersebut.",
      "Gunakan Paste special → Values only.",
    ],
  },
];

export default function Help() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8 md:py-12">
      <section className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <Badge variant="secondary">Panduan harian</Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Cara pakai Movement Stock Parser
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Ubah PDF Daily Sales dari Odoo menjadi rumus Google Sheets yang
              bisa langsung ditempel ke Movement Stock. Tidak perlu sheet IMPORT
              dan tidak perlu paste rumus ke semua baris.
            </p>
          </div>
        </div>

        <Button asChild>
          <Link href="/">
            Mulai parsing
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </section>

      <Alert className="mb-6">
        <CheckCircle2 className="size-4" />
        <AlertTitle>Workflow baru lebih singkat</AlertTitle>
        <AlertDescription>
          Paste rumus cukup sekali di baris produk pertama pada kolom OUT atau
          REFUND. Rumus akan membaca SKU dari kolom Product, sehingga aman walau
          urutan baris produk berubah.
        </AlertDescription>
      </Alert>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Ringkasan workflow</CardTitle>
          <CardDescription>
            Dari PDF Odoo sampai angka final di Movement Stock.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-5">
            {[
              "Download PDF",
              "Upload parser",
              "Copy rumus",
              "Paste sekali",
              "Values only",
            ].map((label, index) => (
              <div
                key={label}
                className="rounded-lg border bg-muted/30 p-3 text-sm"
              >
                <div className="mb-2 flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {index + 1}
                </div>
                <p className="font-medium">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <Card key={step.title}>
              <CardHeader className="md:grid-cols-[auto_1fr] md:items-start">
                <div className="flex size-10 items-center justify-center rounded-full border bg-muted">
                  <Icon className="size-5" />
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="outline">Step {index + 1}</Badge>
                    <CardTitle>{step.title}</CardTitle>
                  </div>
                  <CardDescription>{step.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 text-sm">
                  {step.items.map((item, itemIndex) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
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

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Produk yang otomatis masuk rumus</CardTitle>
            <CardDescription>
              Selain produk dengan SKU, beberapa produk tanpa SKU juga sudah
              dicocokkan berdasarkan nama.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>Made in Sunset</li>
              <li>Product Reparation</li>
              <li>CMD Custom Embroidery</li>
              <li>Keychain Kuksa Standard - One Shot</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produk yang perlu input manual</CardTitle>
            <CardDescription>
              Cek bagian ini setelah proses PDF selesai. Item di daftar ini
              belum masuk rumus.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>IZIPIZI</li>
              <li>MUNDAKA</li>
              <li>Produk tanpa SKU lain yang belum punya rule otomatis</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      <Card>
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
      </Card>
    </main>
  );
}
