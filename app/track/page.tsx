"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  PackageCheck,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Scissors,
  ShoppingBag,
  User,
  Calendar,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  MessageCircle,
  Mail,
  Loader2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type OrderStatus = "processing" | "ready" | "completed";

export type TrackItem = {
  id: string;
  expressNumber: number;
  customerName: string;
  items: { name: string; qty: number }[];
  totalQty: number;
  pickupDate: string;
  pickupTime: string;
  staffName: string;
  notes?: string;
  status: OrderStatus;
  trackingCode?: string;
  createdAt?: string;
  updatedAt?: string;
  readyAt?: string;
  completedAt?: string;
  printedTime: string;
};

function formatDisplayDate(dateStr: string) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatTimestampEng(isoOrText?: string) {
  if (!isoOrText) return null;
  try {
    const d = new Date(isoOrText);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return null;
  }
}

function formatSplitTimestamp(isoOrText?: string) {
  if (!isoOrText) return { date: "-", time: "-" };
  try {
    const d = new Date(isoOrText);
    if (isNaN(d.getTime())) return { date: "-", time: "-" };
    const date = d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return { date, time };
  } catch {
    return { date: "-", time: "-" };
  }
}

function TrackContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("express") || searchParams.get("id") || searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [activeOrder, setActiveOrder] = useState<TrackItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  function parseTrackingCode(codeStr: string) {
    const clean = codeStr.trim().toUpperCase().replace("#", "");
    const match = clean.match(/^EX(\d{2,4})(\d{2})(\d{2})-(\d+)$/);
    if (!match) return null;

    let [, yearStr, mmStr, ddStr, numStr] = match;
    if (yearStr.length === 2) {
      yearStr = `20${yearStr}`;
    }

    const year = parseInt(yearStr, 10);
    const month = parseInt(mmStr, 10);
    const day = parseInt(ddStr, 10);
    const expressNum = parseInt(numStr, 10);

    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(expressNum)) return null;

    return { year, month, day, expressNum };
  }

  async function handleSearch(searchVal: string) {
    const clean = searchVal.trim().replace("#", "");
    if (!clean) return;

    setLoading(true);
    setNotFound(false);

    try {
      let dataRow: any = null;
      const upperClean = clean.toUpperCase();

      // 1. First search by tracking_code column in Supabase (e.g. 6-char code like K7B9X2, or EX20260808-1)
      const { data: resiData } = await supabase
        .from("cmd_express_history")
        .select("*")
        .ilike("tracking_code", `%${clean}%`)
        .limit(1);

      if (resiData && resiData.length > 0) {
        dataRow = resiData[0];
      }
      // 2. Check if searching by standard 36-char UUID
      else if (clean.length === 36 && clean.includes("-")) {
        const { data: uuidData } = await supabase
          .from("cmd_express_history")
          .select("*")
          .eq("id", clean)
          .limit(1);
        if (uuidData && uuidData.length > 0) {
          dataRow = uuidData[0];
        }
      }
      // 3. Fallback for old EX date-based tracking format if not found by tracking_code
      else if (upperClean.startsWith("EX")) {
        const parsed = parseTrackingCode(clean);
        if (parsed) {
          const startLocal = new Date(parsed.year, parsed.month - 1, parsed.day, 0, 0, 0, 0);
          const endLocal = new Date(parsed.year, parsed.month - 1, parsed.day, 23, 59, 59, 999);

          const { data: dateNumData } = await supabase
            .from("cmd_express_history")
            .select("*")
            .eq("express_number", parsed.expressNum)
            .gte("created_at", startLocal.toISOString())
            .lte("created_at", endLocal.toISOString())
            .limit(1);

          if (dateNumData && dateNumData.length > 0) {
            dataRow = dateNumData[0];
          }
        }
      }
      // 4. Check if searching by numeric express number (e.g. 1)
      else if (!isNaN(Number(clean))) {
        const { data: numData } = await supabase
          .from("cmd_express_history")
          .select("*")
          .eq("express_number", Number(clean))
          .order("created_at", { ascending: false })
          .limit(1);
        if (numData && numData.length > 0) {
          dataRow = numData[0];
        }
      }
      // 5. Fallback search by customer name
      else {
        const { data: nameData } = await supabase
          .from("cmd_express_history")
          .select("*")
          .ilike("customer_name", `%${clean}%`)
          .order("created_at", { ascending: false })
          .limit(1);
        if (nameData && nameData.length > 0) {
          dataRow = nameData[0];
        }
      }

      if (dataRow) {
        setActiveOrder({
          id: dataRow.id,
          expressNumber: dataRow.express_number,
          customerName: dataRow.customer_name,
          items: dataRow.items || [],
          totalQty: dataRow.total_qty,
          pickupDate: dataRow.pickup_date,
          pickupTime: dataRow.pickup_time,
          staffName: dataRow.staff_name,
          notes: dataRow.notes,
          status: (dataRow.status as OrderStatus) || "processing",
          trackingCode: dataRow.tracking_code || upperClean,
          createdAt: dataRow.created_at,
          updatedAt: dataRow.updated_at,
          readyAt: dataRow.ready_at,
          completedAt: dataRow.completed_at,
          printedTime: dataRow.printed_time,
        });
      } else {
        setActiveOrder(null);
        setNotFound(true);
      }
    } catch (err) {
      console.warn("Search error:", err);
      setActiveOrder(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  // Realtime listener for order status changes
  useEffect(() => {
    if (!activeOrder?.id) return;

    const channel = supabase
      .channel(`track_order_${activeOrder.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "cmd_express_history",
          filter: `id=eq.${activeOrder.id}`,
        },
        (payload) => {
          const updated = payload.new;
          if (updated) {
            setActiveOrder((prev) =>
              prev
                ? {
                  ...prev,
                  status: (updated.status as OrderStatus) || prev.status,
                  updatedAt: updated.updated_at || prev.updatedAt,
                  readyAt: updated.ready_at || prev.readyAt,
                  completedAt: updated.completed_at || prev.completedAt,
                }
                : null
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrder?.id]);

  const steps = [
    {
      id: "processing",
      title: "In Production",
      desc: "Your bag is currently being crafted & stitched by our production team.",
      icon: Scissors,
    },
    {
      id: "ready",
      title: "Ready for Pickup",
      desc: "Your custom bag is finished & ready to be picked up at the store.",
      icon: CheckCircle2,
    },
    {
      id: "completed",
      title: "Order Completed",
      desc: "The bag has been picked up by the customer.",
      icon: PackageCheck,
    },
  ];

  const currentStepIndex = activeOrder
    ? activeOrder.status === "completed"
      ? 2
      : activeOrder.status === "ready"
        ? 1
        : 0
    : 0;

  return (
    <div className="min-h-screen  text-foreground flex flex-col items-center px-4 py-8 sm:px-6">
      {/* Header Brand */}
      <div className="w-full max-w-lg flex flex-col items-center mb-6 text-center space-y-2">
        <div className="flex items-center gap-2">
          <img src="/tttm_wordmark_dark.png" alt="TTTM Logo" className="h-7 w-auto" />
        </div>
        {/* <h1 className="text-xl font-bold tracking-tight">Custom Express Tracking</h1> */}
      </div>

      {/* Search Input Bar */}
      <div className="w-full max-w-lg mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Enter Tracking Code (e.g. EX26XXXX-XX)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 text-xs h-10 bg-background shadow-xs"
            />
          </div>
          <Button type="submit" size="default" className="h-10 px-4 text-xs font-semibold shrink-0">
            Track Order
          </Button>
        </form>
      </div>

      {/* Main Status Display Container */}
      <div className="w-full max-w-lg">
        {loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-8">
              <Loader2 className="size-5 animate-spin text-primary" />
              <p className="text-xs font-medium text-muted-foreground">
                Checking your order status...
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && notFound && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                <AlertCircle className="size-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-semibold">
                  Order Not Found
                </h3>

                <p className="text-xs text-muted-foreground">
                  Please make sure you entered the correct Tracking Code or Name
                  matching your receipt.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && activeOrder && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeOrder.status}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* CURRENT STATUS BANNER CARD */}
              <Card
                className={` overflow-hidden transition-all ${activeOrder.status === "ready"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                  : activeOrder.status === "completed"
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-950 dark:text-blue-200"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
                  }`}
              >
                <CardContent className="flex items-center gap-3">
                  <div
                    className={`size-16 rounded-lg flex items-center justify-center shrink-0 ${activeOrder.status === "ready"
                      ? "bg-emerald-600 text-white"
                      : activeOrder.status === "completed"
                        ? "bg-blue-600 text-white"
                        : "bg-amber-600 text-white"
                      }`}
                  >
                    {activeOrder.status === "ready" ? (
                      <CheckCircle2 className="size-8" />
                    ) : activeOrder.status === "completed" ? (
                      <PackageCheck className="size-8" />
                    ) : (
                      <Scissors className="size-8 animate-pulse" />
                    )}
                  </div>
                  <div className="space-y-1 min-w-0 p-1.5">
                    <h2 className="text-lg font-bold tracking-tight">
                      {activeOrder.status === "ready"
                        ? "Your Custom Bag is Ready for Pickup"
                        : activeOrder.status === "completed"
                          ? "Order Picked Up & Completed"
                          : "Currently In Production"}
                    </h2>
                    <p className="text-xs opacity-80 leading-snug">
                      {activeOrder.status === "ready"
                        ? "Please show your Express receipt or Tracking Code to the cashier when picking up your bag."
                        : activeOrder.status === "completed"
                          ? "Thank you for ordering a custom bag with Ticket to the Moon."
                          : `Estimated Ready: ${formatDisplayDate(activeOrder.pickupDate)} (${activeOrder.pickupTime || "15:00"})`}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* TIMELINE STEPPER */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Production Progress
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="relative">
                    {steps.map((step, idx) => {
                      const isPassed = idx <= currentStepIndex;
                      const isCurrent = idx === currentStepIndex;
                      const Icon = step.icon;

                      // Timestamp calculation for each step
                      let stepIso: string | undefined;
                      if (step.id === "processing") {
                        stepIso = activeOrder.createdAt || String(activeOrder.printedTime || "").split("|")[0];
                      } else if (step.id === "ready" && isPassed) {
                        stepIso = activeOrder.readyAt;
                      } else if (step.id === "completed" && isPassed) {
                        stepIso = activeOrder.completedAt;
                      }

                      const { date: dateStr, time: timeStr } = formatSplitTimestamp(stepIso);

                      return (
                        <div key={step.id} className="relative flex items-start gap-3 sm:gap-4 min-h-[px] pb-2 last:pb-0">
                          {/* Left: Date & Time */}
                          <div className="w-[85px] sm:w-[95px] shrink-0 text-right space-y-0.5">
                            <div className={cn("text-xs font-semibold leading-tight", isPassed ? "text-foreground" : "text-muted-foreground/40")}>
                              {isPassed ? dateStr : "-"}
                            </div>
                            <div className="text-[11px] text-muted-foreground/60 font-mono leading-tight">
                              {isPassed ? timeStr : "-"}
                            </div>
                          </div>

                          {/* Center: Node Icon Wrapper with Equal Spacing & Connecting Line */}
                          <div className="relative flex items-center justify-center shrink-0 size-8 sm:size-9">
                            {/* Connecting Line - connects from icon center 1 to icon center 2 with equal distance */}
                            {idx < steps.length - 1 && (
                              <div
                                className={cn(
                                  "absolute top-4 sm:top-4.5 left-1/2 -translate-x-1/2 w-[2px] bottom-[-60px] z-0 transition-colors pointer-events-none",
                                  idx < currentStepIndex
                                    ? "bg-emerald-500"
                                    : "border-l-2 border-dashed border-muted-foreground/30 bg-transparent"
                                )}
                              />
                            )}

                            {isCurrent && (
                              <motion.span
                                animate={{ scale: [1, 1.35, 1], opacity: [0.25, 0.65, 0.25] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inset-0 rounded-full bg-orange-500/40"
                              />
                            )}
                            <div
                              className={cn(
                                "relative z-10 flex size-8 sm:size-9 items-center justify-center rounded-full text-xs font-bold transition-all shadow-xs shrink-0",
                                isCurrent
                                  ? "bg-orange-500 text-white shadow-orange-500/20"
                                  : isPassed
                                    ? "bg-emerald-500 text-white"
                                    : "bg-muted text-muted-foreground/40 border border-border/50"
                              )}
                            >
                              <Icon className="size-4" />
                            </div>
                          </div>

                          {/* Right: Step Info */}
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <h4
                              className={cn(
                                "text-xs sm:text-sm font-bold leading-snug",
                                isPassed ? "text-foreground" : "text-muted-foreground/60"
                              )}
                            >
                              {step.title}
                            </h4>
                            <p className="text-[11px] leading-relaxed text-muted-foreground">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* ORDER DETAILS CARD */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Order Details
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Order Information */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-muted-foreground">
                        Customer
                      </p>
                      <p className="text-xs font-semibold capitalize">
                        {activeOrder.customerName}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-[11px] text-muted-foreground">
                        Handled By
                      </p>
                      <p className="text-xs font-semibold capitalize">
                        {activeOrder.staffName}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-[11px] text-muted-foreground">
                        Pickup Schedule
                      </p>
                      <p className="text-xs font-semibold">
                        {formatDisplayDate(activeOrder.pickupDate)}{" "}
                        ({activeOrder.pickupTime})
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-[11px] text-muted-foreground">
                        Total Items
                      </p>
                      <p className="text-xs font-semibold">
                        {activeOrder.totalQty} PCS
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Custom Items (Nota / Receipt Style Layout) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      <span>Custom Items</span>
                      <span>TOTAL: {activeOrder.totalQty} PCS</span>
                    </div>

                    <div className="divide-y divide-border/60 rounded-lg border bg-muted/20 px-3.5 py-0.5 text-xs font-medium">
                      {activeOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2.5 gap-2">
                          <span className="font-semibold text-foreground">{item.name}</span>
                          <Badge variant="outline" className="text-xs font-bold shrink-0 bg-background px-2.5 py-0.5">
                            {item.qty} pcs
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* STORE CONTACT TEXT */}
              <div className="pt-2 text-center text-xs text-muted-foreground flex flex-wrap items-center justify-center gap-1 font-medium">
                <span>Have an issue with this order?</span>
                <a
                  href={`https://wa.me/6281519602752?text=${encodeURIComponent(
                    `Hello Ticket to the Moon, I would like to inquire about my custom express order #${activeOrder.expressNumber} (${activeOrder.trackingCode || ""}) under the name ${activeOrder.customerName}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 underline underline-offset-4 cursor-pointer transition-colors"
                >
                  WhatsApp
                </a>
                <span>or</span>
                <a
                  href={`mailto:tickettothemoonsunsetroad@gmail.com?subject=${encodeURIComponent(
                    `Custom Express Inquiry #${activeOrder.expressNumber} (${activeOrder.trackingCode || ""})`
                  )}&body=${encodeURIComponent(
                    `Hello Ticket to the Moon Store,\n\nI would like to inquire about my Custom Express order #${activeOrder.expressNumber} (${activeOrder.trackingCode || ""}) under the name ${activeOrder.customerName}.\n\nThank you.`
                  )}`}
                  className="font-semibold text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 underline underline-offset-4 cursor-pointer transition-colors"
                >
                  Email
                </a>
                <span>us</span>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div >
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xs text-muted-foreground">
          Loading tracking...
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
