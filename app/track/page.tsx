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

  async function handleSearch(searchVal: string) {
    const clean = searchVal.trim().replace("#", "");
    if (!clean) return;

    setLoading(true);
    setNotFound(false);

    try {
      let dataRow: any = null;
      const upperClean = clean.toUpperCase();

      // 1. Check if searching by tracking code (e.g. EX260807-01)
      if (upperClean.startsWith("EX")) {
        const { data: resiData } = await supabase
          .from("cmd_express_history")
          .select("*")
          .ilike("tracking_code", `%${clean}%`)
          .limit(1);

        if (resiData && resiData.length > 0) {
          dataRow = resiData[0];
        } else {
          // Smart fallback: extract express number from EX260807-01 -> 1
          const parts = clean.split("-");
          const lastNum = parts.length > 1 ? parseInt(parts[1], 10) : parseInt(clean.replace(/\D/g, ""), 10);
          if (!isNaN(lastNum)) {
            const { data: numData } = await supabase
              .from("cmd_express_history")
              .select("*")
              .eq("express_number", lastNum)
              .order("created_at", { ascending: false })
              .limit(1);
            if (numData && numData.length > 0) {
              dataRow = numData[0];
            }
          }
        }
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
      // 3. Check if searching by numeric express number (e.g. 1)
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
      // 4. Fallback search by customer name
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
          if (updated && updated.status) {
            setActiveOrder((prev) => (prev ? { ...prev, status: updated.status as OrderStatus } : null));
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
      desc: "The bag has been picked up & delivered to the customer.",
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
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0a0a0a] text-foreground flex flex-col items-center px-4 py-8 sm:px-6">
      {/* Header Brand */}
      <div className="w-full max-w-lg flex flex-col items-center mb-6 text-center space-y-2">
        <div className="flex items-center gap-2">
          <img src="/tttm.jpg" alt="TTTM Logo" className="h-9 w-auto " />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Custom Express Tracking</h1>
        <p className="text-xs text-muted-foreground">
          Track your custom bag order status in real-time.
        </p>
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
              placeholder="Enter Tracking Code (e.g. EX260807-01) or Name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 text-xs h-10 bg-background shadow-xs rounded-xl"
            />
          </div>
          <Button type="submit" size="default" className="h-10 px-4 text-xs font-semibold rounded-xl shrink-0">
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
                className={`rounded-2xl overflow-hidden transition-all shadow-xs ${activeOrder.status === "ready"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                  : activeOrder.status === "completed"
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-950 dark:text-blue-200"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
                  }`}
              >
                <CardContent className=" flex items-center gap-3">
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
                        ? "Your Custom Bag is Ready for Pickup! 🎉"
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
              <Card className="rounded-2xl shadow-xs">
                <CardHeader>
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Production Progress
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="relative space-y-6 before:absolute before:bottom-2 before:left-4 before:top-2 before:w-px before:bg-border">
                    {steps.map((step, idx) => {
                      const isPassed = idx <= currentStepIndex;
                      const isCurrent = idx === currentStepIndex;
                      const Icon = step.icon;

                      return (
                        <div
                          key={step.id}
                          className="relative z-10 flex items-start gap-4"
                        >
                          <div
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-xs transition-colors",
                              isCurrent &&
                              "bg-primary text-primary-foreground ring-4 ring-primary/20",
                              isPassed &&
                              !isCurrent &&
                              "bg-emerald-600 text-white",
                              !isPassed && "bg-muted text-muted-foreground"
                            )}
                          >
                            <Icon className="size-4" />
                          </div>

                          <div className="space-y-0.5">
                            <h4
                              className={cn(
                                "text-xs font-bold",
                                isPassed
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              )}
                            >
                              {step.title}
                            </h4>

                            <p className="text-[11px] leading-snug text-muted-foreground">
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
              <Card className="rounded-2xl shadow-xs">
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
                        {activeOrder.totalQty} Pcs
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Custom Items (Nota / Receipt Style Layout) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      <span>Custom Items</span>
                      <span className="font-mono font-bold">QTY: {activeOrder.totalQty} PCS</span>
                    </div>

                    <div className="divide-y divide-border/60 rounded-xl border bg-muted/20 px-3.5 py-0.5 text-xs font-medium">
                      {activeOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2.5 gap-2">
                          <span className="font-semibold text-foreground">{item.name}</span>
                          <Badge variant="outline" className="font-mono text-xs font-bold shrink-0 bg-background px-2.5 py-0.5">
                            x{item.qty}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* STORE CONTACT BUTTONS (SHADCN BUTTONS) */}
              <div className="pt-2 text-center flex flex-wrap items-center justify-center gap-2">
                <Button variant="outline" className="gap-2" asChild>
                  <a
                    href={`https://wa.me/6281519602752?text=${encodeURIComponent(
                      `Hello Ticket to the Moon, I would like to inquire about my custom express order #${activeOrder.expressNumber} (${activeOrder.trackingCode || ""}) under the name ${activeOrder.customerName}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="size-4 text-emerald-600 dark:text-emerald-400" /> WhatsApp Us
                  </a>
                </Button>
                <Button variant="outline" className="gap-2" asChild>
                  <a
                    href={`mailto:tickettothemoonsunsetroad@gmail.com?subject=${encodeURIComponent(
                      `Custom Express Inquiry #${activeOrder.expressNumber} (${activeOrder.trackingCode || ""})`
                    )}&body=${encodeURIComponent(
                      `Hello Ticket to the Moon Store,\n\nI would like to inquire about my Custom Express order #${activeOrder.expressNumber} (${activeOrder.trackingCode || ""}) under the name ${activeOrder.customerName}.\n\nThank you.`
                    )}`}
                  >
                    <Mail className="size-4 text-blue-600 dark:text-blue-400" /> Email Us
                  </a>
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
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
