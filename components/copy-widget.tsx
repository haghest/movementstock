"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Check,
  Search,
  ExternalLink,
  Clock,
  RefreshCw,
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
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openPopout = () => {
    window.open(
      "/cmd/widget",
      "ExpressCopyWidget",
      "width=350,height=540,resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no"
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
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <CardTitle>Express Note</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {filtered.length} express
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-lg"
            onClick={loadHistory}
            disabled={isRefreshing}
            className="size-7"
            title="Refresh"
          >
            <RefreshCw className={cn("size-3.5 text-muted-foreground", isRefreshing && "animate-spin")} />
          </Button>

          {!standalone && (
            <Button
              variant="ghost"
              size="icon-lg"
              onClick={openPopout}
              className="size-7"
              title="Buka Pop-out Widget"
            >
              <ExternalLink className="size-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Quick Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs pl-8"
          />
        </div>

        {/* List of Today Expresses */}
        <div className="space-y-2 max-h-[380px] overflow-y-auto">
          {filtered.map((item) => {
            const isCopied = copiedId === item.id;
            const formattedText = generateCopyText(item);

            return (
              <div
                key={item.id}
                className="p-2 rounded-lg border border-border bg-card text-xs flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Badge variant="outline" className="text-xs font-semibold shrink-0">
                      #{item.expressNumber}
                    </Badge>
                    <span className="font-medium text-foreground capitalize truncate">
                      {item.customerName}
                    </span>
                    <span className="text-muted-foreground truncate text-[11px]">
                      ({item.staffName || "Staff"})
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(item)}
                    className="h-7 text-xs px-2.5 shrink-0 gap-1.5 font-medium transition-all"
                  >
                    {isCopied ? (
                      <Check className="size-3.5 text-emerald-600 transition-transform animate-in fade-in zoom-in-75 duration-200" />
                    ) : (
                      <Copy className="size-3.5 transition-transform animate-in fade-in duration-200" />
                    )}
                    <span>Salin</span>
                  </Button>
                </div>

                {/* Preview text string */}
                <div className="text-[11px] text-muted-foreground bg-muted/40 p-1.5 leading-tight break-words">
                  {formattedText}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
              <Clock className="size-5 mx-auto opacity-50 mb-1" />
              <p className="font-medium">Belum ada express hari ini</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
