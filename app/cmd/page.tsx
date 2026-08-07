"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Printer,
  RotateCcw,
  ArrowLeft,
  ShoppingBag,
  Clock,
  User,
  UserCheck,
  FileText,
  Trash2,
  HelpCircle,
  Plus,
  Minus,
  Search,
  ArrowUpDown,
  SlidersHorizontal,
  ChevronDown,
  Check,
  ChevronsUpDown,
  Copy,
} from "lucide-react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
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

export type CmdTicket = {
  id: string;
  customerName: string;
  customerPhone?: string;
  items: { name: BagName; qty: number }[];
  totalQty: number;
  pickupDate: string;
  pickupTime: string;
  staffName: string;
  notes: string;
  createdAt: string;
};

const PRESET_TIMES = ["12:00", "15:00", "17:00", "19:00", "21:00"];

function DatePickerPopover({
  dateStr,
  onSelectDate,
}: {
  dateStr: string;
  onSelectDate: (dateStr: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = dateStr ? new Date(dateStr + "T00:00:00") : undefined;

  const displayDateText = selectedDate
    ? selectedDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    : "Pilih tanggal";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between h-8 text-xs px-2.5 border-input bg-background text-foreground"
        >
          <span className="truncate">{displayDateText}</span>
          <ChevronDown className="size-3.5 text-muted-foreground shrink-0 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate}
          onSelect={(d) => {
            if (d) {
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, "0");
              const dd = String(d.getDate()).padStart(2, "0");
              onSelectDate(`${yyyy}-${mm}-${dd}`);
            }
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function StaffCombobox({
  value,
  onChange,
  staffList,
}: {
  value: string;
  onChange: (val: string) => void;
  staffList: string[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedName = value.trim();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-8  px-2.5 font-normal border-input bg-background text-foreground"
        >
          <span className="truncate">
            {selectedName || "Nama Staff"}
          </span>
          <ChevronsUpDown className="ml-1 size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Cari atau ketik staff..."
            value={query}
            onValueChange={(val) => {
              setQuery(val);
              onChange(val);
            }}
            className="h-8 text-xs"
          />
          <CommandList className="max-h-52 overflow-y-auto">
            {query.trim() && !staffList.some((s) => s.toLowerCase() === query.trim().toLowerCase()) && (
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => {
                    onChange(query.trim());
                    setOpen(false);
                  }}
                  className="w-full text-left px-2 py-1.5 hover:bg-muted rounded-sm text-xs text-primary font-semibold flex items-center justify-between"
                >
                  <span>Gunakan "{query.trim()}"</span>
                  <Plus className="size-3" />
                </button>
              </div>
            )}
            <CommandEmpty className="py-2 text-center text-xs text-muted-foreground">
              {query.trim() ? "Tekan tombol untuk memilih" : "Belum ada nama staff"}
            </CommandEmpty>
            <CommandGroup>
              {staffList.map((name) => (
                <CommandItem
                  key={name}
                  value={name}
                  onSelect={() => {
                    onChange(name);
                    setOpen(false);
                  }}
                  className="text-xs py-1.5 flex items-center justify-between cursor-pointer"
                >
                  <span>{name}</span>
                  <Check
                    className={cn(
                      "size-3.5",
                      selectedName.toLowerCase() === name.toLowerCase() ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

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
  // Quantities for each of the 4 bags
  const [quantities, setQuantities] = useState<Record<BagName, number>>({
    "Mini Backpack 15L": 0,
    "Backpack XS 6L": 0,
    "Eco Bag": 0,
    "Sling Bag": 0,
    "Embroidery": 0,
  });

  // Basic Info States
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("12:00");
  const [staffName, setStaffName] = useState("");
  const [notes, setNotes] = useState("");

  // UI / Print States
  const [ticketId, setTicketId] = useState("");
  const [createdTime, setCreatedTime] = useState("");
  const [expressNumber, setExpressNumber] = useState<number>(1);
  const [history, setHistory] = useState<CmdHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [savedStaffs, setSavedStaffs] = useState<string[]>([]);
  const [copiedPos, setCopiedPos] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    generateNewTicketId();
    const today = getLocalDateString();
    setPickupDate(today);

    const supabase = createClient();

    async function loadHistory() {
      try {
        const { data, error } = await supabase
          .from("cmd_express_history")
          .select("*")
          .gte("created_at", `${today}T00:00:00.000Z`)
          .order("express_number", { ascending: false });

        if (!error && data && data.length > 0) {
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
            trackingCode: row.tracking_code || generateTrackingCode(row.express_number, new Date(row.created_at || Date.now())),
            createdAt: row.created_at,
            printedTime: formatTimestamp(row.created_at || row.printed_time),
          }));
          setHistory(mapped);
          const maxNum = Math.max(...mapped.map((m) => m.expressNumber));
          setExpressNumber(maxNum + 1);
        } else {
          setHistory([]);
          setExpressNumber(1);
        }
      } catch (err) {
        console.warn("Supabase fetch error:", err);
        setHistory([]);
        setExpressNumber(1);
      }
    }

    loadHistory();

    // Supabase Realtime Subscription
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel("cmd_express_changes")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "cmd_express_history" },
          (payload) => {
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
              trackingCode: row.tracking_code || generateTrackingCode(row.express_number, new Date(row.created_at || Date.now())),
              createdAt: row.created_at,
              printedTime: formatTimestamp(row.created_at || row.printed_time),
            };
            setHistory((prev) => {
              if (prev.some((h) => h.id === mappedItem.id)) return prev;
              return [mappedItem, ...prev];
            });
            setExpressNumber((prev) => Math.max(prev, row.express_number + 1));
          }
        )
        .subscribe();
    } catch {
      // ignore
    }

    setSavedStaffs([
      "Angga", "Ari", "Avita", "Dek Run", "Evita", "Gus De", "Haga",
      "Ivanna", "Merry", "Nita", "Nyom", "Ocha", "Rama", "Siyut", "Yayuk"
    ]);

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  function generateNewTicketId() {
    const now = new Date();
    const dateStr = getLocalDateString(now).replace(/-/g, "");
    const randomNum = Math.floor(100 + Math.random() * 900);
    setTicketId(`CMD-${dateStr}-${randomNum}`);
    setCreatedTime(
      now.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }



  function updateQty(bagName: BagName, delta: number) {
    setQuantities((prev) => ({
      ...prev,
      [bagName]: Math.max(0, (prev[bagName] || 0) + delta),
    }));
  }

  // Active items (qty > 0)
  const activeItems = BAG_ITEMS.filter((name) => quantities[name] > 0).map((name) => ({
    name,
    qty: quantities[name],
  }));

  const totalQty = activeItems.reduce((sum, item) => sum + item.qty, 0);

  const isPrintDisabled = totalQty === 0 || !customerName.trim() || !staffName.trim();

  function handleReset() {
    generateNewTicketId();
    setQuantities({
      "Mini Backpack 15L": 0,
      "Backpack XS 6L": 0,
      "Eco Bag": 0,
      "Sling Bag": 0,
      "Embroidery": 0,
    });
    setCustomerName("");
    setCustomerPhone("");
    setNotes("");
    toast.success("Form di-reset", { position: "top-center" });
  }

  async function handlePrint() {

    if (totalQty === 0) {
      toast.error("Mohon atur jumlah barang minimal 1 pcs", { position: "top-center" });
      return;
    }
    if (!customerName.trim()) {
      toast.error("Mohon isi Nama Customer", { position: "top-center" });
      return;
    }
    if (!staffName.trim()) {
      toast.error("Mohon isi Staff yang Handle", { position: "top-center" });
      return;
    }

    const currentExpress = expressNumber;
    const nextExpress = currentExpress + 1;

    const nowIso = new Date().toISOString();
    const printedTimeStr = formatTimestamp(nowIso);
    setCreatedTime(printedTimeStr);

    const tCode = generateTrackingCode(currentExpress);
    setTicketId(tCode);

    const newItem: CmdHistoryItem = {
      id: Date.now().toString(),
      expressNumber: currentExpress,
      customerName: customerName.trim(),
      items: activeItems,
      totalQty,
      pickupDate,
      pickupTime,
      staffName: staffName.trim(),
      notes: notes.trim() || undefined,
      status: "processing",
      trackingCode: tCode,
      createdAt: nowIso,
      printedTime: printedTimeStr,
    };

    const newHistory = [newItem, ...history];
    setHistory(newHistory);

    // Insert into Supabase
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("cmd_express_history")
        .insert([
          {
            express_number: currentExpress,
            customer_name: customerName.trim(),
            customer_phone: customerPhone.trim() || null,
            staff_name: staffName.trim(),
            items: activeItems,
            total_qty: totalQty,
            pickup_date: pickupDate,
            pickup_time: pickupTime,
            notes: notes.trim() || null,
            status: "processing",
            tracking_code: tCode,
            printed_time: printedTimeStr,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
        // Fallback insert if new columns don't exist yet on user's Supabase DB schema
        const { data: fbData, error: fbError } = await supabase
          .from("cmd_express_history")
          .insert([
            {
              express_number: currentExpress,
              customer_name: customerName.trim(),
              customer_phone: customerPhone.trim() || null,
              staff_name: staffName.trim(),
              items: activeItems,
              total_qty: totalQty,
              pickup_date: pickupDate,
              pickup_time: pickupTime,
              notes: notes.trim() || null,
              printed_time: printedTimeStr,
            },
          ])
          .select()
          .single();

        if (fbError) {
          toast.error(`Gagal ke Supabase: ${fbError.message}`);
        } else if (fbData) {
          newItem.id = fbData.id;
        }
      } else if (data) {
        newItem.id = data.id;
        if (data.created_at) {
          newItem.createdAt = data.created_at;
          newItem.printedTime = formatTimestamp(data.created_at);
        }
      }
    } catch (err: any) {
      console.error("Supabase insert exception:", err);
      toast.error(`Error menyimpan ke database: ${err?.message || err}`);
    }

    // Save staff name to suggestions list
    const trimmedStaff = staffName.trim();
    if (trimmedStaff && !savedStaffs.some((s) => s.toLowerCase() === trimmedStaff.toLowerCase())) {
      setSavedStaffs([trimmedStaff, ...savedStaffs]);
    }

    toast.success(`Mencetak Tiket EXPRESS#${currentExpress}...`, { position: "top-center" });

    setTimeout(() => {
      window.print();
      setExpressNumber(nextExpress);
    }, 150);
  }

  function handleReprint(item: CmdHistoryItem) {
    const tCode = item.trackingCode || (item.createdAt ? generateTrackingCode(item.expressNumber, new Date(item.createdAt)) : generateTrackingCode(item.expressNumber));
    setTicketId(tCode);
    setExpressNumber(item.expressNumber);
    setCustomerName(item.customerName);
    setStaffName(item.staffName);
    setPickupDate(item.pickupDate);
    setPickupTime(item.pickupTime);
    setNotes(item.notes || "");
    const formattedTimestamp = formatTimestamp(item.createdAt || item.printedTime);
    setCreatedTime(formattedTimestamp);

    const newQuantities: Record<BagName, number> = {
      "Mini Backpack 15L": 0,
      "Backpack XS 6L": 0,
      "Eco Bag": 0,
      "Sling Bag": 0,
      "Embroidery": 0,
    };
    item.items.forEach((it) => {
      newQuantities[it.name] = it.qty;
    });
    setQuantities(newQuantities);

    toast.success(`Mencetak ulang Tiket EXPRESS#${item.expressNumber}...`, { position: "top-center" });
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
        `Status Express #${item.expressNumber} diubah ke ${nextStatus === "ready"
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

  const pickupFormatted = pickupDate
    ? `${formatDisplayDate(pickupDate)}${pickupTime ? ` ${pickupTime}` : ""}`
    : "";

  const posFormatString = `Express#${expressNumber} by ${staffName.trim() || "Staff"} - ${customerName.trim() || "Customer"}${pickupFormatted ? ` - Pickup ${pickupFormatted}` : ""}`;

  const handleCopyPosFormat = (str?: string) => {
    const textToCopy = str || posFormatString;
    navigator.clipboard.writeText(textToCopy);
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
    <main className="flex-1 px-4 py-4 lg:pb-32 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      {/* Page Title */}


      {/* Main Grid: Simple Form + Thermal Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* FORM INPUT SECTION (lg:col-span-6) */}
        <Card className="lg:col-span-6 no-print">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                Input Pesanan
              </CardTitle>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-medium text-muted-foreground">EXPRESS</span>
                <span className="font-semibold text-primary">#{expressNumber}</span>
                <div className="flex items-center gap-1 ml-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"

                    onClick={() => {
                      const newNum = Math.max(1, expressNumber - 1);
                      setExpressNumber(newNum);
                      const today = getLocalDateString();
                      localStorage.setItem("cmd_express_date", today);
                      localStorage.setItem("cmd_express_count", String(newNum));
                    }}
                    title="Kurangi No. Express"
                  >
                    <Minus className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => {
                      const newNum = expressNumber + 1;
                      setExpressNumber(newNum);
                      const today = getLocalDateString();
                      localStorage.setItem("cmd_express_date", today);
                      localStorage.setItem("cmd_express_count", String(newNum));
                    }}
                    title="Tambah No. Express"
                  >
                    <Plus className="size-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 1. JUMLAH BARANG (SIMPLE COUNTER ROWS) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold   text-muted-foreground">
                  Item
                </label>
                <Badge variant={totalQty > 0 ? "default" : "outline"} className="text-[11px]">
                  QYT {totalQty} pcs
                </Badge>
              </div>

              <div className="space-y-3 md:space-y-2">
                {BAG_ITEMS.map((bag) => {
                  const qty = quantities[bag];
                  const isSelected = qty > 0;
                  return (
                    <div
                      key={bag}
                      className={`flex items-center  font-medium justify-between border p-2 rounded-lg transition-all ${isSelected
                        ? "bg-accent border "
                        : "hover:bg-muted/50 border border-transparent"
                        }`}
                    >
                      <span className={`text-sm ${isSelected ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                        {bag}
                      </span>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => updateQty(bag, -1)}
                          disabled={qty === 0}
                        >
                          <Minus className="size-3" />
                        </Button>
                        <span className={`w-6 text-center text-xs font-bold ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                          {qty}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => updateQty(bag, 1)}
                        >
                          <Plus className="size-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. CUSTOMER & STAFF */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Nama Customer *
                </label>
                <Input
                  type="text"
                  placeholder="Nama customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Nama Staff *
                </label>
                <StaffCombobox
                  value={staffName}
                  onChange={setStaffName}
                  staffList={savedStaffs}
                />
              </div>
            </div>

            {/* 3. PICKUP DATE & TIME */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Tanggal Pickup
              </label>
              <div className="grid grid-cols-2 gap-4">
                <DatePickerPopover
                  dateStr={pickupDate}
                  onSelectDate={(val) => setPickupDate(val)}
                />
                <Input
                  type="time"
                  id="time-picker-optional"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none text-xs"
                />
              </div>
              <div className="flex gap-1 pt-1">
                {PRESET_TIMES.map((time) => (
                  <Badge
                    key={time}
                    variant={pickupTime === time ? "default" : "outline"}
                    onClick={() => setPickupTime(time)}
                    className="cursor-pointer text-xs"
                  >
                    {time}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 4. CATATAN */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Catatan Detail (Opsional)
              </label>
              <Textarea
                rows={2}
                placeholder="Catatan warna, bordir, delivery, etc"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs min-h-[60px]"
              />
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                size="lg"
                onClick={handlePrint}
                disabled={isPrintDisabled}
                className="flex-1"
              >
                <Printer className="size-4 mr-1.5" /> Print
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={handleReset}>
                <RotateCcw className="size-3.5 mr-1" /> Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* LIVE THERMAL PREVIEW PANEL (lg:col-span-6) */}
        <Card className="hidden lg:block lg:col-span-6 lg:sticky lg:top-6">
          <CardHeader className="pb-3 flex flex-row items-center justify-between no-print">
            <CardTitle className="text-base flex items-center gap-2">
              Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex justify-center items-start  overflow-y-auto max-h-[calc(100vh-160px)] rounded-b-xl">
            {/* Actual Thermal Receipt Layout */}
            <div
              id="thermal-receipt"
              style={{
                width: "210px",
              }}
              className="bg-white text-black p-3.5  shadow-lg border border-neutral-300 text-xs leading-snug select-none"
            >
              {/* Header Logo */}
              <div className="text-center border-black border-dashed flex flex-col items-center">
                <img
                  src="/tttm.jpg"
                  alt="Ticket to the Moon Logo"
                  className="h-auto w-full mx-auto mb-1 object-contain mix-blend-multiply"
                />
                <p className="font-semibold text-lg py-1 inline-block font-mono">
                  Express #{expressNumber}
                </p>

              </div>


              {/* PICKUP BADGE */}
              <div className=" text-center border-t border-black border-dashed pt-2">
                <p className="text-[10px] uppercase font-bold text-neutral-600 tracking-wider">
                  Tanggal Pickup
                </p>
                <p className="text-xs font-bold mt-0.5 text-black">
                  {formatDisplayDate(pickupDate)}
                </p>
                <p className="text-[11px] font-bold text-neutral-900">
                  {pickupTime || "-"}
                </p>
              </div>

              {/* Customer Info */}
              <div className="py-1.5 border-b border-black border-dashed space-y-1 text-[11px]">
                <div className="flex justify-between gap-3 font-mono">
                  <span className="text-neutral-600 shrink-0">CUSTOMER:</span>
                  <span className="font-semibold uppercase text-right break-words">{customerName || "-"}</span>
                </div>
                <div className="flex justify-between gap-3 font-mono">
                  <span className="text-neutral-600 shrink-0">STAFF:</span>
                  <span className="font-semibold uppercase text-right break-words">{staffName || "-"}</span>
                </div>
              </div>

              {/* ITEMS SPECS */}
              <div className="py-2 border-b border-black border-dashed">
                <div className="flex justify-between items-center mb-1 text-[10px] font-semibold text-neutral-600">
                  <span>ITEM</span>
                  <span>QYT: {totalQty} PCS</span>
                </div>

                <div className="space-y-1.5">
                  {activeItems.length > 0 ? (
                    activeItems.map((item) => (
                      <div
                        key={item.name}
                        className="flex justify-between items-center font-medium text-xs gap-2"
                      >
                        <span>{item.name}</span>
                        <span className="font-mono shrink-0">
                          x{item.qty}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs italic text-neutral-400 text-center py-1">
                      (Belum ada barang dipilih)
                    </p>
                  )}
                </div>
              </div>

              {/* Notes Section */}
              {notes && (
                <div className="py-1.5 border-b border-black border-dashed overflow-hidden">
                  <p className="text-[9px] font-bold text-neutral-600 uppercase mb-0.5">
                    NOTES:
                  </p>
                  <p className="text-xs leading-snug whitespace-pre-wrap break-words max-w-full">
                    {notes}
                  </p>
                </div>
              )}
              {/* Tracking QR Code */}
              <div className="pt-2 pb-1 text-center flex flex-col items-center space-y-0.5">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                    origin
                      ? `${origin}/track?id=${ticketId || generateTrackingCode(expressNumber)}`
                      : `https://moon-stock-parser.vercel.app/track?id=${ticketId || generateTrackingCode(expressNumber)}`
                  )}`}
                  alt="Scan untuk tracking pesanan"
                  className="w-24 h-24 aspect-square object-contain mix-blend-multiply mx-auto"
                />
                <p className="text-[9px] font-mono text-neutral-900 font-bold uppercase tracking-tight pt-0.5">
                  Tracking Code: {ticketId || generateTrackingCode(expressNumber)}
                </p>
                <p className="text-[8px] font-mono text-neutral-600 font-semibold uppercase tracking-tight">
                  Scan to Track Bag Status
                </p>
              </div>
              {/* Timestamp */}
              <div className="py-1 text-center text-[10px] text-neutral-600">
                <span>{createdTime || "TODAY"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TODAY'S EXPRESS HISTORY TABLE (NOTION STYLE - no-print) */}
      <section className="mt-6 no-print">
        <Card className=" overflow-hidden bg-background">
          <CardHeader>
            {/* Title Row */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground tracking-tight">
                Express Hari Ini
              </h3>
              {history.length > 0 && (
                <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {history.length} Total
                </Badge>
              )}
            </div>

            {/* Sub-bar Notion Style: Filter | Sort (Left) & Search (Right) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1.5 hover:bg-muted/40 font-normal"
                >
                  <ArrowUpDown className="size-3.5" />
                  <span>
                    Sort <span className="text-[11px] text-muted-foreground/70 font-normal">({sortOrder === "newest" ? "Terbaru" : "Terlama"})</span>
                  </span>
                </Button>
              </div>

              <div className="relative min-w-[200px] sm:w-72">
                <Input
                  type="text"
                  placeholder="Search..."
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
                            <Badge key={idx} variant="secondary" className="text-xs font-medium bg-muted/60 text-foreground border-border/40 whitespace-nowrap">
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
                            className=" text-[11px] font-medium text-foreground hover:bg-muted gap-1"
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
                              handleCopyPosFormat(`Express#${item.expressNumber} by ${item.staffName || "Staff"} - ${item.customerName}${pStr}`);
                            }}
                            className=" text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted gap-1"
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
                          <p className="text-sm font-semibold text-foreground">Belum ada pesanan terdaftar</p>
                          <p className="text-xs text-muted-foreground">Pesanan yang dicetak hari ini akan muncul secara otomatis di sini.</p>
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
    </main>
  );
}
