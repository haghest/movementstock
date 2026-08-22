"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Copy,
  Check,
  Search,
  ExternalLink,
  Clock,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type CmdHistoryItem = {
  id: string;
  expressNumber: number;
  customerName: string;
  items: { name: string; qty: number }[];
  totalQty: number;
  pickupDate: string;
  pickupTime: string;
  staffName: string;
  notes?: string;
  status?: string;
  trackingCode?: string;
  createdAt?: string;
  printedTime: string;
};

function formatFullDisplayDate(dateStr?: string) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getLocalDateString(d: Date = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function generateCopyText(item: CmdHistoryItem): string {
  const pDate = item.pickupDate ? formatFullDisplayDate(item.pickupDate) : "";
  const pTime = item.pickupTime ? ` ${item.pickupTime}` : "";
  const pickupStr = pDate ? `Diambil ${pDate}${pTime}` : "";

  const parts = [
    `Express#${item.expressNumber} by ${item.staffName || "Staff"}`,
    item.customerName,
    pickupStr,
    item.notes?.trim(),
  ].filter(Boolean);

  return parts.join(" - ");
}

export interface CopyWidgetProps {
  standalone?: boolean;
  className?: string;
}

export function CopyWidget({ standalone = false, className }: CopyWidgetProps) {
  const [history, setHistory] = useState<CmdHistoryItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function loadHistory() {
    setIsRefreshing(true);
    try {
      const supabase = createClient();
      const todayStr = getLocalDateString();
      const [year, month, day] = todayStr.split("-").map(Number);
      const startLocal = new Date(year, month - 1, day, 0, 0, 0, 0);

      const { data, error } = await supabase
        .from("cmd_express_history")
        .select("*")
        .gte("created_at", startLocal.toISOString())
        .order("created_at", { ascending: false });

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
          status: row.status || "processing",
          trackingCode: row.tracking_code,
          createdAt: row.created_at,
          printedTime: row.printed_time || "",
        }));
        setHistory(mapped);
      }
    } catch (err) {
      console.warn("Widget fetch error:", err);
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadHistory();

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel("widget_express_changes")
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
                status: row.status || "processing",
                trackingCode: row.tracking_code,
                createdAt: row.created_at,
                printedTime: row.printed_time || "",
              };
              setHistory((prev) => [mappedItem, ...prev.filter((h) => h.id !== mappedItem.id)]);
              toast.success(`⭐️ Express #${row.express_number} Baru Dibuat!`, {
                position: "top-center",
                description: `${row.customer_name} oleh ${row.staff_name}`,
              });
            }
          }
        )
        .subscribe();
    } catch {
      // ignore
    }

    const interval = setInterval(loadHistory, 8000);

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const handleCopy = (item: CmdHistoryItem) => {
    const text = generateCopyText(item);
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    toast.success(`Disalin: Express #${item.expressNumber}`, {
      position: "top-center",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openPopout = () => {
    window.open(
      "/cmd/widget",
      "ExpressCopyWidget",
      "width=380,height=540,resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no"
    );
  };

  const filtered = history.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const cleanQ = q.replace("#", "").trim();
    return (
      item.customerName.toLowerCase().includes(q) ||
      item.staffName.toLowerCase().includes(q) ||
      String(item.expressNumber) === cleanQ
    );
  });

  return (
    <Card className={cn("w-full shadow-md bg-background border", className)}>
      <CardHeader className="p-3 pb-2 border-b bg-muted/30 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-foreground">
            <Sparkles className="size-3.5 text-amber-500 animate-pulse" />
            <span>Copy Express Note</span>
          </CardTitle>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-bold">
            {filtered.length} Hari Ini
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={loadHistory}
            disabled={isRefreshing}
            className="size-7 text-muted-foreground hover:text-foreground"
            title="Refresh data"
          >
            <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
          </Button>

          {!standalone && (
            <Button
              variant="outline"
              size="icon-sm"
              onClick={openPopout}
              className="size-7 text-xs font-semibold gap-1 text-primary border-primary/30 hover:bg-primary/10"
              title="Buka Jendela Melayang (Pop-out)"
            >
              <ExternalLink className="size-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-2 space-y-2">
        {/* Quick Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari nama / #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs pl-8 pr-2 bg-background"
          />
        </div>

        {/* List of Today Expresses */}
        <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-0.5 select-none">
          {filtered.map((item) => {
            const isCopied = copiedId === item.id;
            const formattedText = generateCopyText(item);

            return (
              <div
                key={item.id}
                className={cn(
                  "p-2.5 rounded-xl border text-xs transition-all flex flex-col gap-1.5",
                  isCopied
                    ? "bg-emerald-500/10 border-emerald-500/40"
                    : "bg-card hover:bg-muted/40 border-border"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Badge variant="default" className="text-[11px] font-black shrink-0 px-2 py-0.5">
                      #{item.expressNumber}
                    </Badge>
                    <span className="font-bold text-foreground capitalize truncate">
                      {item.customerName}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      ({item.staffName || "Staff"})
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant={isCopied ? "default" : "outline"}
                    onClick={() => handleCopy(item)}
                    className={cn(
                      "h-8 px-3 text-xs font-bold shrink-0 gap-1.5 rounded-lg active:scale-95 transition-transform",
                      isCopied
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    {isCopied ? (
                      <>
                        <Check className="size-3.5" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        <span>COPY NOTE</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Preview text string */}
                <div className="text-[11px] text-muted-foreground bg-muted/30 p-1.5 rounded-lg font-mono leading-tight break-words">
                  {formattedText}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
              <Clock className="size-6 mx-auto opacity-40 mb-1" />
              <p className="font-semibold text-foreground">Belum ada Express hari ini</p>
              <p className="text-[11px]">Setiap nota yang diprint akan otomatis muncul di sini.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
