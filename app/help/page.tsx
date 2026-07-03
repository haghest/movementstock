import { Card, CardContent, CardHeader } from "@/components/ui/card";
export default function Help() {
  return (
    <main className=" mx-auto p-10 gap-2 flex items-center justify-center min-h-screen">
      <Card className="min-w-xl max-w-2xl">
        <CardHeader>
          <h1 className="text-2xl font-semibold">Cara Penggunaan</h1>
        </CardHeader>
        <CardContent>
          <div className="*:py-2">
            <div>
              <h2 className="font-semibold text-lg">Download Daily Sales</h2>
              <ol className="list-decimal pl-5">
                <li>Buka Odoo pada kasir</li>
                <li>Klik Close Register</li>
                <li>Print Sales Details hari ini.</li>
              </ol>
            </div>
            <div>
              <h2 className="font-semibold text-lg">Buka tttm.haga.my.id</h2>
              <ol className="list-decimal pl-5">
                <li>Klik Pilih File</li>
                <li>Pilih PDF yang sudah didownload</li>
                <li>Klik Proses PDF.</li>
              </ol>
            </div>
            <div>
              <h2 className="font-semibold text-lg">Isi Kolom OUT / REFUND</h2>
              <ol className="list-decimal pl-5">
                <li>Buka Movement Stock.</li>
                <li>Cari kolom OUT atau REFUND pada tanggal yang sesuai.</li>
                <li>Salin rumus OUT / REFUND dari website.</li>
                <li>
                  Tempel rumus cukup sekali pada baris produk pertama di kolom
                  yang sesuai.
                </li>
                <li>
                  Setelah angka muncul:
                  <ul className="list-disc pl-5">
                    <li>Salin seluruh hasil pada kolom tersebut.</li>
                    <li>Gunakan Paste Special → Values Only.</li>
                  </ul>
                </li>
              </ol>
            </div>
            <div>
              <h2 className="font-semibold text-lg">Input Produk Tanpa Kode</h2>
              <ol className="list-decimal pl-5">
                <li>Periksa bagian Produk tanpa SKU</li>
                <li>Masukkan manual produk tanpa SKU ke Movement Stock</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
