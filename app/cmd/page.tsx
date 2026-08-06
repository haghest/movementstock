"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
} from "lucide-react";

export const BAG_ITEMS = [
  "Mini Backpack 15L",
  "Backpack XS 6L",
  "Eco Bag",
  "Sling Bag",
  "Embroidery",
] as const;

export type BagName = (typeof BAG_ITEMS)[number];

export type CmdHistoryItem = {
  id: string;
  expressNumber: number;
  customerName: string;
  items: { name: BagName; qty: number }[];
  totalQty: number;
  pickupDate: string;
  pickupTime: string;
  staffName: string;
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
      month: "short",
      year: "numeric",
    })
    : "Pilih tanggal";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between px-2.5 border-input bg-background text-foreground"
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

function getLocalDateString(d: Date = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  const [paperSize, setPaperSize] = useState<"58mm" | "80mm">("58mm");
  const [ticketId, setTicketId] = useState("");
  const [createdTime, setCreatedTime] = useState("");
  const [expressNumber, setExpressNumber] = useState<number>(1);
  const [history, setHistory] = useState<CmdHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    generateNewTicketId();
    const today = getLocalDateString();
    setPickupDate(today);

    // Auto-reset Express counter & history per day via localStorage
    try {
      const savedDate = localStorage.getItem("cmd_express_date");
      const savedCount = localStorage.getItem("cmd_express_count");
      const savedHistory = localStorage.getItem("cmd_express_history");

      if (savedDate !== today) {
        localStorage.setItem("cmd_express_date", today);
        localStorage.setItem("cmd_express_count", "1");
        localStorage.removeItem("cmd_express_history");
        setExpressNumber(1);
        setHistory([]);
      } else {
        if (savedCount) {
          setExpressNumber(parseInt(savedCount, 10) || 1);
        }
        if (savedHistory) {
          setHistory(JSON.parse(savedHistory));
        }
      }
    } catch {
      // ignore
    }
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

  function handlePrint() {
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

    const printedTimeStr = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newItem: CmdHistoryItem = {
      id: Date.now().toString(),
      expressNumber: currentExpress,
      customerName: customerName.trim(),
      items: activeItems,
      totalQty,
      pickupDate,
      pickupTime,
      staffName: staffName.trim(),
      printedTime: printedTimeStr,
    };

    const newHistory = [newItem, ...history];
    setHistory(newHistory);

    try {
      const today = getLocalDateString();
      localStorage.setItem("cmd_express_date", today);
      localStorage.setItem("cmd_express_count", String(nextExpress));
      localStorage.setItem("cmd_express_history", JSON.stringify(newHistory));
    } catch {
      // ignore
    }

    toast.success(`Mencetak Tiket EXPRESS#${currentExpress}...`, { position: "top-center" });

    setTimeout(() => {
      window.print();
      setExpressNumber(nextExpress);
    }, 150);
  }

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const dateObj = new Date(dateStr);
      return dateObj.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
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
                <span className="font-semibold text-primary text-lg">#{expressNumber}</span>
                <div className="flex items-center gap-1 ml-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 w-6 p-0"
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
                    size="sm"
                    className="h-6 w-6 p-0"
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
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Item
                </label>
                <Badge variant={totalQty > 0 ? "default" : "outline"} className="text-[11px]">
                  QYT: {totalQty} pcs
                </Badge>
              </div>

              <div className="space-y-3 md:space-y-1.5">
                {BAG_ITEMS.map((bag) => {
                  const qty = quantities[bag];
                  const isSelected = qty > 0;
                  return (
                    <div
                      key={bag}
                      className={`flex items-center justify-between border p-2 rounded-md transition-all ${isSelected
                        ? "bg-background border border-primary/40"
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
                          size="sm"
                          className="h-7 w-7 p-0"
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
                          size="sm"
                          className="h-7 w-7 p-0"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <Input
                  type="text"
                  placeholder="Nama Staff"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* 3. PICKUP DATE & TIME */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Tanggal Pickup
              </label>
              <div className="grid grid-cols-2 gap-2">
                <DatePickerPopover
                  dateStr={pickupDate}
                  onSelectDate={(val) => setPickupDate(val)}
                />
                <Input
                  type="time"
                  id="time-picker-optional"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
              </div>
              <div className="flex gap-1 pt-0.5">
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

            {/* Paper Size Switcher */}
            <div className="flex items-center bg-muted p-0.5 rounded-md border border-border/80 text-[11px]">
              <button
                type="button"
                onClick={() => setPaperSize("58mm")}
                className={`px-2.5 py-0.5 rounded font-semibold transition-all ${paperSize === "58mm"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                58mm
              </button>
              <button
                type="button"
                onClick={() => setPaperSize("80mm")}
                className={`px-2.5 py-0.5 rounded font-semibold transition-all ${paperSize === "80mm"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                80mm
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex justify-center items-start bg-muted/20 overflow-y-auto max-h-[calc(100vh-160px)] rounded-b-xl">
            {/* Actual Thermal Receipt Layout */}
            <div
              id="thermal-receipt"
              style={{
                width: paperSize === "58mm" ? "210px" : "280px",
              }}
              className="bg-white text-black p-3.5 rounded shadow-md border border-neutral-300 text-xs leading-snug select-none"
            >
              {/* Header Logo */}
              <div className="text-center border-black border-dashed flex flex-col items-center">
                {/* <img
                  src="/tttm.jpg"
                  alt="Ticket to the Moon Logo"
                  className="h-10 w-auto mx-auto mb-1 object-contain mix-blend-multiply"
                /> */}
                <p className="font-semibold text-lg py-1 inline-block">
                  Express #{expressNumber}
                </p>
                {/* Timestamp */}
                <div className="py-1  border-black border-dashed text-center text-[10px] text-neutral-600">
                  <span>{createdTime || "TODAY"}</span>
                </div>
              </div>


              {/* PICKUP BADGE */}
              <div className="my-2 text-center border-t border-black border-dashed pt-2">
                <p className="text-[8px] uppercase font-bold text-neutral-600 tracking-wider">
                  Tanggal Pickup
                </p>
                <p className="text-xs font-extrabold uppercase mt-0.5 text-black">
                  {formatDisplayDate(pickupDate)}
                </p>
                <p className="text-[11px] font-bold text-neutral-900">
                  {pickupTime || "-"}
                </p>
              </div>

              {/* Customer Info */}
              <div className="py-1.5 border-b border-black border-dashed space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-neutral-600">CUSTOMER</span>
                  <span className="font-bold uppercase">{customerName || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">STAFF:</span>
                  <span className="font-bold uppercase">{staffName || "-"}</span>
                </div>
              </div>

              {/* ITEMS SPECS */}
              <div className="py-2 border-b border-black border-dashed">
                <div className="flex justify-between items-center mb-1 text-[10px] font-semibold text-neutral-600">
                  <span>ITEM</span>
                  <span>QYT: {totalQty} PCS</span>
                </div>

                <div className="space-y-1">
                  {activeItems.length > 0 ? (
                    activeItems.map((item) => (
                      <div
                        key={item.name}
                        className="flex justify-between items-center font-bold text-xs  "
                      >
                        <span>{item.name}</span>
                        <span className="text-[10px]">
                          x{item.qty}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] italic text-neutral-400 text-center py-1">
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
                  <p className="text-xs leading-snug whitespace-pre-wrap break-all max-w-full">
                    {notes}
                  </p>
                </div>
              )}
              {/* WhatsApp QR Code */}
              <div className="pt-2 pb-1 text-center flex flex-col items-center">
                <p className="font-bold">WhatsApp Us</p>
                <img
                  src="/qr.png"
                  alt="WhatsApp QR Code Toko"
                  className="w-full h-auto aspect-square object-contain mix-blend-multiply mx-auto"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TODAY'S EXPRESS HISTORY TABLE (NOTION STYLE - no-print) */}
      <section className="mt-8 no-print">
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
                  <tr className="border-y border-border/60 bg-muted/20 text-[11px] text-muted-foreground font-normal">
                    <th className="py-2.5 px-6 font-normal">Nama</th>
                    <th className="py-2.5 px-4 font-normal">No</th>
                    <th className="py-2.5 px-4 font-normal">Item Custom</th>
                    <th className="py-2.5 px-4 font-normal">Pickup</th>
                    <th className="py-2.5 px-4 font-normal">Staff</th>
                    <th className="py-2.5 px-6 font-normal text-right">Waktu Cetak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-6 font-semibold uppercase text-foreground">
                        {item.customerName}
                      </td>
                      <td className="py-3 px-4 font-bold text-primary font-mono text-xs">
                        EXPRESS#{item.expressNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {item.items.map((it, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[10px] font-medium bg-muted/60 text-foreground border-border/40">
                              {it.name} (x{it.qty})
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-foreground font-medium">
                        {formatDisplayDate(item.pickupDate)} {item.pickupTime && `(${item.pickupTime})`}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {item.staffName || "-"}
                      </td>
                      <td className="py-3 px-6 text-right text-muted-foreground font-mono text-[11px]">
                        {item.printedTime}
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
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
                      <td colSpan={6} className="py-10 text-center text-muted-foreground italic">
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
