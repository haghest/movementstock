"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Printer,
  Clock,
  ArrowUpDown,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const BAG_ITEMS = [
  "Mini Backpack 15L",
  "Backpack XS 6L",
  "Eco Bag",
  "Sling Bag",
  "Embroidery",
] as const;

export type BagName = (typeof BAG_ITEMS)[number];
export type OrderStatus = "processing" | "ready" | "completed";

export type CmdHistoryItem = {
  id: string;
  expressNumber: number;
  customerName: string;
  items: { name: BagName; qty: number }[];
  totalQty: number;
  pickupDate: string;
  pickupTime: string;
  staffName: string;
  notes?: string;
  status?: OrderStatus;
  trackingCode?: string;
  createdAt?: string;
  printedTime: string;
};

function getLocalDateString(d: Date = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateTrackingCode(expressNum: number, dateObj: Date = new Date()) {
  const yy = String(dateObj.getFullYear()).slice(-2);
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const numStr = String(expressNum).padStart(2, "0");
  return `EX${yy}${mm}${dd}-${numStr}`;
}

function formatFullDisplayDate(dateStr?: string) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatTimestamp(isoOrText?: string) {
  if (!isoOrText) return "-";
  try {
    const d = new Date(isoOrText);
    if (isNaN(d.getTime())) return isoOrText;
    return d.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoOrText;
  }
}

function splitTimestamp(isoOrText?: string) {
  if (!isoOrText) return { date: "-", time: "" };
  try {
    const d = new Date(isoOrText);
    if (isNaN(d.getTime())) {
      const parts = isoOrText.split(",");
      if (parts.length === 2) {
        return { date: parts[0].trim(), time: parts[1].trim() };
      }
      return { date: isoOrText, time: "" };
    }
    const date = d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
    const time = d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { date, time };
  } catch {
    return { date: isoOrText, time: "" };
  }
}

export default function CmdPage() {
  const [history, setHistory] = useState<CmdHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [historyDateFilter, setHistoryDateFilter] = useState<string>(getLocalDateString());
  const [copiedPos, setCopiedPos] = useState(false);
  const [origin, setOrigin] = useState("");

  // States for reprint thermal receipt rendering
  const [reprintItem, setReprintItem] = useState<CmdHistoryItem | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    async function loadHistory() {
      try {
        let queryBuilder = supabase.from("cmd_express_history").select("*");

        if (historyDateFilter === "all") {
          queryBuilder = queryBuilder.order("created_at", { ascending: false });
        } else {
          const [year, month, day] = historyDateFilter.split("-").map(Number);
          const startLocal = new Date(year, month - 1, day, 0, 0, 0, 0);
          const endLocal = new Date(year, month - 1, day, 23, 59, 59, 999);

          const startIso = startLocal.toISOString();
          const endIso = endLocal.toISOString();

          queryBuilder = queryBuilder
            .gte("created_at", startIso)
            .lte("created_at", endIso)
            .order("express_number", { ascending: false });
        }

        const { data, error } = await queryBuilder;

        if (!error && data) {
          const mapped: CmdHistoryItem[] = data.map((row) => ({
            id: row.id,
            expressNumber: row.express_number,
            customerName: row.customer_name,
            items: row.items || [],
            totalQty: row.total_qty,
            pickupDate: row.pickup_date,
            pickupTime: row.pickup_time,
            staffName: row.staff_name,
            notes: row.notes || undefined,
            status: (row.status as OrderStatus) || "processing",
            trackingCode:
              row.tracking_code ||
              generateTrackingCode(row.express_number, new Date(row.created_at || Date.now())),
            createdAt: row.created_at,
            printedTime: formatTimestamp(row.created_at || row.printed_time),
          }));
          setHistory(mapped);
        } else {
          setHistory([]);
        }
      } catch (err) {
        console.warn("Supabase fetch error:", err);
        setHistory([]);
      }
    }

    loadHistory();

    // Supabase Realtime Subscription (INSERT & UPDATE)
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel("cmd_express_changes_table")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "cmd_express_history" },
          (payload) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new;
              const mappedItem: CmdHistoryItem = {
                id: row.id,
                expressNumber: row.express_number,
                customerName: row.customer_name,
                items: row.items || [],
                totalQty: row.total_qty,
                pickupDate: row.pickup_date,
                pickupTime: row.pickup_time,
                staffName: row.staff_name,
                notes: row.notes || undefined,
                status: (row.status as OrderStatus) || "processing",
                trackingCode:
                  row.tracking_code ||
                  generateTrackingCode(row.express_number, new Date(row.created_at || Date.now())),
                createdAt: row.created_at,
                printedTime: formatTimestamp(row.created_at || row.printed_time),
              };
              setHistory((prev) => {
                if (prev.some((h) => h.id === mappedItem.id)) {
                  return prev.map((h) => (h.id === mappedItem.id ? mappedItem : h));
                }
                return [mappedItem, ...prev];
              });
            } else if (payload.eventType === "UPDATE") {
              const row = payload.new;
              setHistory((prev) =>
                prev.map((h) =>
                  h.id === row.id
                    ? {
                        ...h,
                        status: (row.status as OrderStatus) || h.status,
                        customerName: row.customer_name || h.customerName,
                        staffName: row.staff_name || h.staffName,
                      }
                    : h
                )
              );
            }
          }
        )
        .subscribe();
    } catch {
      // ignore
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [historyDateFilter]);

  function handleReprint(item: CmdHistoryItem) {
    setReprintItem(item);
    toast.success(`Mencetak ulang Tiket EXPRESS#${item.expressNumber}...`, {
      position: "top-center",
    });
    setTimeout(() => {
      window.print();
    }, 150);
  }

  async function handleToggleStatus(item: CmdHistoryItem) {
    const nextStatus: OrderStatus =
      item.status === "processing"
        ? "ready"
        : item.status === "ready"
        ? "completed"
        : "processing";

    setHistory((prev) =>
      prev.map((h) => (h.id === item.id ? { ...h, status: nextStatus } : h))
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("cmd_express_history")
      .update({ status: nextStatus })
      .eq("id", item.id);

    if (error) {
      toast.error("Gagal memperbarui status ke Supabase");
    } else {
      toast.success(
        `Status Express #${item.expressNumber} diubah ke ${
          nextStatus === "ready"
            ? "Siap Pickup 🟢"
            : nextStatus === "completed"
            ? "Selesai ✅"
            : "Diproses ⏳"
        }`
      );
    }
  }

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const dateObj = new Date(dateStr);
      return dateObj.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return dateStr;
    }
  };

  const handleCopyPosFormat = (str: string) => {
    navigator.clipboard.writeText(str);
    setCopiedPos(true);
    toast.success("Customer note disalin!", { position: "top-center" });
    setTimeout(() => setCopiedPos(false), 2000);
  };

  const filteredHistory = history
    .filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const cleanQ = q.replace("#", "").trim();
      const expressStr = String(item.expressNumber);
      return (
        item.customerName.toLowerCase().includes(q) ||
        item.staffName.toLowerCase().includes(q) ||
        expressStr === cleanQ ||
        `express #${item.expressNumber}`.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortOrder === "newest") {
        return b.expressNumber - a.expressNumber;
      } else {
        return a.expressNumber - b.expressNumber;
      }
    });

  return (
    <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
      {/* TODAY'S & HISTORICAL EXPRESS TABLE */}
      <section className="no-print">
        <Card className="overflow-hidden bg-background">
          <CardHeader className="pb-3">
            {/* Title Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground tracking-tight text-base">
                  {historyDateFilter === getLocalDateString()
                    ? "Express Hari Ini"
                    : historyDateFilter === "all"
                    ? "Semua Data Express"
                    : `Express Tanggal ${formatDisplayDate(historyDateFilter)}`}
                </h3>
                {historyDateFilter !== getLocalDateString() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setHistoryDateFilter(getLocalDateString())}
                    className="h-6 px-2 text-[11px] text-primary hover:text-primary/80 font-medium"
                  >
                    (Kembali ke Hari Ini)
                  </Button>
                )}
              </div>
              {history.length > 0 && (
                <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0">
                  {history.length} Total
                </Badge>
              )}
            </div>

            {/* Sub-bar: Date Filter & Sort (Left) & Search (Right) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                {/* Quick Filter Buttons & Custom Date Input */}
                <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border">
                  <Input
                    type="date"
                    value={historyDateFilter === "all" ? "" : historyDateFilter}
                    onChange={(e) => {
                      if (e.target.value) {
                        setHistoryDateFilter(e.target.value);
                      }
                    }}
                    className="h-7 text-xs bg-background border shadow-2xs rounded-lg px-2 w-32 cursor-pointer"
                  />
                  <Button
                    variant={historyDateFilter === getLocalDateString() ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setHistoryDateFilter(getLocalDateString())}
                    className="h-7 px-2.5 text-xs rounded-lg font-medium"
                  >
                    Hari Ini
                  </Button>
                  <Button
                    variant={historyDateFilter === "all" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setHistoryDateFilter("all")}
                    className="h-7 px-2.5 text-xs rounded-lg font-medium"
                  >
                    Semua
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))}
                  className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 hover:bg-muted/40 font-normal rounded-xl border border-dashed"
                >
                  <ArrowUpDown className="size-3.5" />
                  <span>
                    Sort{" "}
                    <span className="text-[11px] text-muted-foreground/70 font-normal">
                      ({sortOrder === "newest" ? "Terbaru" : "Terlama"})
                    </span>
                  </span>
                </Button>
              </div>

              <div className="relative min-w-[200px] sm:w-72">
                <Input
                  type="text"
                  placeholder="Search name, express #, resi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-y border-border/60 bg-muted/20 text-[11px] text-muted-foreground font-normal whitespace-nowrap">
                    <th className="py-2.5 px-6">Express</th>
                    <th className="py-2.5 px-4">Nama</th>
                    <th className="py-2.5 px-4">Item Custom</th>
                    <th className="py-2.5 px-4">Waktu Pickup</th>
                    <th className="py-2.5 px-4">Staff</th>
                    <th className="py-2.5 px-4 text-right">Tanggal</th>
                    <th className="py-2.5 px-3.5">Status</th>
                    <th className="py-2.5 px-4">Note</th>
                    <th className="py-2.5 px-6">Print</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-6 font-semibold text-xs text-foreground whitespace-nowrap">
                        #{item.expressNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold capitalize text-foreground whitespace-nowrap">
                        {item.customerName}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {item.items.map((it, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs font-medium bg-muted/60 text-foreground border-border/40 whitespace-nowrap"
                            >
                              {it.name} (x{it.qty})
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-foreground font-medium whitespace-nowrap">
                        <div className="flex flex-col text-xs leading-tight">
                          <span>{formatDisplayDate(item.pickupDate)}</span>
                          {item.pickupTime && (
                            <span className="text-[11px] text-muted-foreground font-normal mt-0.5">
                              {item.pickupTime}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground capitalize whitespace-nowrap">
                        {item.staffName || "-"}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {(() => {
                          const { date, time } = splitTimestamp(item.createdAt || item.printedTime);
                          return (
                            <div className="flex flex-col text-xs leading-tight items-start">
                              <span className="font-semibold text-foreground">{date}</span>
                              {time && (
                                <span className="text-[11px] text-muted-foreground font-normal mt-0.5">
                                  {time}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer select-none",
                            item.status === "ready"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20"
                              : item.status === "completed"
                              ? "bg-blue-500/10 text-blue-600 border-blue-500/30 hover:bg-blue-500/20"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20"
                          )}
                          title="Klik untuk ubah status pesanan"
                        >
                          {item.status === "ready" ? (
                            <>
                              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Siap Pickup
                            </>
                          ) : item.status === "completed" ? (
                            <>
                              <span className="size-1.5 rounded-full bg-blue-500" />
                              Selesai
                            </>
                          ) : (
                            <>
                              <span className="size-1.5 rounded-full bg-amber-500" />
                              Diproses
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-xs text-foreground leading-snug whitespace-pre-wrap break-words max-w-[200px]">
                        {item.notes ? (
                          <span>{item.notes}</span>
                        ) : (
                          <span className="text-muted-foreground/40 italic text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="icon-lg"
                            onClick={() => handleReprint(item)}
                            className="text-[11px] font-medium text-foreground hover:bg-muted gap-1"
                            title="Print Ulang"
                          >
                            <Printer className="size-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon-lg"
                            onClick={() => {
                              const pDate = item.pickupDate ? formatDisplayDate(item.pickupDate) : "";
                              const pTime = item.pickupTime ? ` ${item.pickupTime}` : "";
                              const pStr = pDate ? ` - Pickup ${pDate}${pTime}` : "";
                              handleCopyPosFormat(
                                `Express#${item.expressNumber} by ${item.staffName || "Staff"} - ${item.customerName}${pStr}`
                              );
                            }}
                            className="text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted gap-1"
                            title="Salin untuk customer note"
                          >
                            <Copy className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-1.5">
                          <div className="size-10 rounded-full bg-muted/40 flex items-center justify-center mb-1 text-muted-foreground/60">
                            <Clock className="size-5" />
                          </div>
                          <p className="text-sm font-semibold text-foreground">
                            Belum ada pesanan terdaftar
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Pesanan yang dicetak hari ini akan muncul secara otomatis di sini.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {history.length > 0 && filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-muted-foreground italic">
                        Tidak ada data pesanan yang cocok dengan pencarian "{searchQuery}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* HIDDEN THERMAL RECEIPT FOR REPRINTING */}
      {reprintItem && (
        <div className="hidden print:block">
          <div
            id="thermal-receipt"
            style={{ width: "210px" }}
            className="bg-white text-black p-3.5 text-xs leading-snug select-none mx-auto"
          >
            <div className="text-center border-black border-dashed flex flex-col items-center">
              <img
                src="/tttm.jpg"
                alt="Ticket to the Moon Logo"
                className="h-auto w-full mx-auto mb-1 object-contain mix-blend-multiply"
              />
              <p className="font-semibold text-lg py-1 inline-block font-mono">
                Express #{reprintItem.expressNumber}
              </p>
            </div>

            <div className="text-center border-t border-black border-dashed pt-2">
              <p className="text-[10px] uppercase font-bold text-neutral-600 tracking-wider">
                Pickup Date
              </p>
              <p className="text-xs font-bold mt-0.5 text-black">
                {formatFullDisplayDate(reprintItem.pickupDate)}
              </p>
              <p className="text-[11px] font-bold text-neutral-900">
                {reprintItem.pickupTime || "-"}
              </p>
            </div>

            <div className="py-1.5 border-b border-black border-dashed space-y-1 text-[11px]">
              <div className="flex justify-between gap-3 font-mono">
                <span className="text-neutral-600 shrink-0">CUSTOMER:</span>
                <span className="font-semibold uppercase text-right break-words">
                  {reprintItem.customerName || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-3 font-mono">
                <span className="text-neutral-600 shrink-0">STAFF:</span>
                <span className="font-semibold uppercase text-right break-words">
                  {reprintItem.staffName || "-"}
                </span>
              </div>
            </div>

            <div className="py-2 border-b border-black border-dashed">
              <div className="flex justify-between items-center mb-1 text-[10px] font-semibold text-neutral-600">
                <span>ITEM</span>
                <span>QYT: {reprintItem.totalQty} PCS</span>
              </div>

              <div className="space-y-1.5">
                {reprintItem.items.map((item) => (
                  <div
                    key={item.name}
                    className="flex justify-between items-center font-medium text-xs gap-2"
                  >
                    <span>{item.name}</span>
                    <span className="font-mono shrink-0">x{item.qty}</span>
                  </div>
                ))}
              </div>
            </div>

            {reprintItem.notes && (
              <div className="py-1.5 border-b border-black border-dashed overflow-hidden">
                <p className="text-[9px] font-bold text-neutral-600 uppercase mb-0.5">NOTES:</p>
                <p className="text-xs leading-snug whitespace-pre-wrap break-words max-w-full">
                  {reprintItem.notes}
                </p>
              </div>
            )}

            <div className="pt-2 pb-1 text-center flex flex-col items-center space-y-0.5">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  origin
                    ? `${origin}/track?id=${
                        reprintItem.trackingCode ||
                        generateTrackingCode(reprintItem.expressNumber)
                      }`
                    : `https://tttm.haga.my.id/track?id=${
                        reprintItem.trackingCode ||
                        generateTrackingCode(reprintItem.expressNumber)
                      }`
                )}`}
                alt="Scan untuk tracking pesanan"
                className="w-full aspect-square object-contain mix-blend-multiply mx-auto"
              />
              <p className="text-[9px] font-mono text-neutral-900 font-bold uppercase tracking-tight pt-0.5">
                Tracking Code:{" "}
                {reprintItem.trackingCode || generateTrackingCode(reprintItem.expressNumber)}
              </p>
              <p className="text-[10px] font-mono text-neutral-600 font-semibold uppercase tracking-tight">
                Scan to Track Bag Status
              </p>
            </div>

            <div className="py-1 text-center text-[10px] text-neutral-600">
              <span>{reprintItem.printedTime || "TODAY"}</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
