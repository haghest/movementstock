"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { ThermalReceipt } from "@/components/thermal-receipt";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import {
  Printer,
  Clock,
  ArrowUpDown,
  ListFilter,
  Check,
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
  readyAt?: string;
  completedAt?: string;
  printedTime: string;
};

function getLocalDateString(d: Date = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateTrackingCode(expressNum?: number, dateObj: Date = new Date()) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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
  const [statusFilter, setStatusFilter] = useState<"all" | "processing" | "ready" | "completed">("all");
  const [filterOpen, setFilterOpen] = useState(false);
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
            readyAt: row.ready_at,
            completedAt: row.completed_at,
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

    // Auto-refresh when tab comes into focus or visibility changes
    const handleFocus = () => {
      loadHistory();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    // Fallback polling every 10 seconds to ensure data is always fresh
    const pollInterval = setInterval(() => {
      loadHistory();
    }, 10000);

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
                readyAt: row.ready_at,
                completedAt: row.completed_at,
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
                      readyAt: row.ready_at || h.readyAt,
                      completedAt: row.completed_at || h.completedAt,
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
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      clearInterval(pollInterval);
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

    const nowIso = new Date().toISOString();
    const readyAt = nextStatus === "ready" ? nowIso : item.readyAt;
    const completedAt = nextStatus === "completed" ? nowIso : item.completedAt;

    setHistory((prev) =>
      prev.map((h) =>
        h.id === item.id ? { ...h, status: nextStatus, readyAt, completedAt } : h
      )
    );

    const supabase = createClient();
    const updatePayload: any = { status: nextStatus };
    if (nextStatus === "ready") updatePayload.ready_at = nowIso;
    if (nextStatus === "completed") updatePayload.completed_at = nowIso;

    const { error } = await supabase
      .from("cmd_express_history")
      .update(updatePayload)
      .eq("id", item.id);

    if (error) {
      // Fallback if ready_at / completed_at columns don't exist yet on user DB schema
      const { error: fbError } = await supabase
        .from("cmd_express_history")
        .update({ status: nextStatus })
        .eq("id", item.id);

      if (fbError) {
        toast.error("Gagal memperbarui status ke Supabase");
      }
    } else {
      toast.success(
        `Status Express #${item.expressNumber} diubah ke ${nextStatus === "ready"
          ? "Siap Pickup"
          : nextStatus === "completed"
            ? "Selesai"
            : "Diproses"
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

  const processingCount = history.filter((i) => i.status === "processing").length;
  const readyCount = history.filter((i) => i.status === "ready").length;
  const completedCount = history.filter((i) => i.status === "completed").length;

  const filteredHistory = history
    .filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const cleanQ = q.replace("#", "").trim();
      const expressStr = String(item.expressNumber);
      return (
        item.customerName.toLowerCase().includes(q) ||
        item.staffName.toLowerCase().includes(q) ||
        (item.trackingCode && item.trackingCode.toLowerCase().includes(q)) ||
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
    <main className="flex-1 px-4 py-4  max-w-6xl mx-auto w-full">
      {/* TODAY'S & HISTORICAL EXPRESS TABLE */}
      <section className="no-print">
        <Card className="overflow-hidden bg-background">
          <CardHeader className="pb-3 space-y-3">
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

              </div>
              {history.length > 0 && (
                <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0">
                  {filteredHistory.length} dari {history.length} Total
                </Badge>
              )}
            </div>

            {/* Sub-bar: Date Filter & Sort (Left) & Search (Right) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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

                {/* Filter & Sort Button Group */}
                <div className="flex items-center gap-0.5 bg-background border p-0.5 rounded-xl shadow-2xs">
                  {/* Filter Popover Dropdown */}
                  <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 font-medium rounded-lg"
                      >
                        <ListFilter className="size-3.5" />
                        <span>Filter</span>
                        {statusFilter !== "all" && (
                          <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.2 rounded-full font-bold">
                            {statusFilter === "processing" ? "Diproses" : statusFilter === "ready" ? "Siap Pickup" : "Selesai"}
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-52 p-1.5 rounded-2xl shadow-xl border">
                      <div className="space-y-0.5">
                        {[
                          { id: "all", label: "Semua", count: history.length },
                          { id: "processing", label: "Diproses", count: processingCount },
                          { id: "ready", label: "Siap Pickup", count: readyCount },
                          { id: "completed", label: "Selesai", count: completedCount },
                        ].map((opt) => {
                          const isSelected = statusFilter === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setStatusFilter(opt.id as any);
                                setFilterOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-colors text-left cursor-pointer select-none",
                                isSelected
                                  ? "bg-muted font-bold text-foreground"
                                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                              )}
                            >
                              <span>
                                {opt.label} <span className="text-[11px] text-muted-foreground/70 font-normal">({opt.count})</span>
                              </span>
                              {isSelected && <Check className="size-3.5 text-foreground shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <div className="h-4 w-px bg-border shrink-0" />

                  {/* Sort Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))}
                    className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 font-medium rounded-lg"
                  >
                    <ArrowUpDown className="size-3.5" />
                    <span>Sort</span>
                    <span className="text-[11px] text-muted-foreground/70 font-normal">
                      ({sortOrder === "newest" ? "Terbaru" : "Terlama"})
                    </span>
                  </Button>
                </div>
              </div>

              <div className="relative min-w-[200px] sm:w-72">
                <Input
                  type="text"
                  placeholder="Cari..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                    {/* <th className="py-2.5 px-3.5">Status</th> */}
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
                      {/* <td className="py-3 px-3.5 whitespace-nowrap">
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
                      </td> */}
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
                              const pDate = item.pickupDate ? formatFullDisplayDate(item.pickupDate) : "";
                              const pTime = item.pickupTime ? ` ${item.pickupTime}` : "";
                              const pickupStr = pDate ? `Diambil ${pDate}${pTime}` : "";
                              const parts = [
                                `Express#${item.expressNumber} by ${item.staffName || "Staff"}`,
                                item.customerName,
                                pickupStr,
                                item.notes?.trim(),
                              ].filter(Boolean);
                              handleCopyPosFormat(parts.join(" - "));
                            }}
                            className="text-[11px] font-medium text-foreground hover:bg-muted gap-1"
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
                      <td colSpan={8} className="py-12 text-center text-muted-foreground">
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
          <ThermalReceipt
            expressNumber={reprintItem.expressNumber}
            pickupDate={reprintItem.pickupDate}
            pickupTime={reprintItem.pickupTime}
            customerName={reprintItem.customerName}
            staffName={reprintItem.staffName}
            items={reprintItem.items}
            totalQty={reprintItem.totalQty}
            notes={reprintItem.notes}
            trackingCode={reprintItem.trackingCode || generateTrackingCode(reprintItem.expressNumber)}
            printedTime={reprintItem.printedTime}
            origin={origin}
          />
        </div>
      )}
    </main>
  );
}
