"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { ThermalReceipt } from "@/components/thermal-receipt";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Printer,
  RotateCcw,
  Plus,
  Minus,
  ChevronDown,
  Check,
  ChevronsUpDown,
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
          className="w-full justify-between h-8 font-normal px-2.5 border-input bg-background text-foreground"
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
          className="w-full justify-between h-8 px-2.5 font-normal border-input bg-background text-foreground"
        >
          <span className="truncate">{selectedName || "Nama Staff"}</span>
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
            {query.trim() &&
              !staffList.some((s) => s.toLowerCase() === query.trim().toLowerCase()) && (
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
                      selectedName.toLowerCase() === name.toLowerCase()
                        ? "opacity-100"
                        : "opacity-0"
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

export default function NotaExpressPage() {
  const [quantities, setQuantities] = useState<Record<BagName, number>>({
    "Mini Backpack 15L": 0,
    "Backpack XS 6L": 0,
    "Eco Bag": 0,
    "Sling Bag": 0,
    Embroidery: 0,
  });

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("12:00");
  const [staffName, setStaffName] = useState("");
  const [notes, setNotes] = useState("");

  const [ticketId, setTicketId] = useState("");
  const [createdTime, setCreatedTime] = useState("");
  const [expressNumber, setExpressNumber] = useState<number>(1);
  const [savedStaffs, setSavedStaffs] = useState<string[]>([]);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    generateNewTicketId();
    const today = getLocalDateString();
    setPickupDate(today);

    // Fetch latest express number from Supabase
    const supabase = createClient();
    async function fetchLatestExpressNumber() {
      try {
        const [year, month, day] = today.split("-").map(Number);
        const startLocal = new Date(year, month - 1, day, 0, 0, 0, 0);
        const endLocal = new Date(year, month - 1, day, 23, 59, 59, 999);

        const { data } = await supabase
          .from("cmd_express_history")
          .select("express_number")
          .gte("created_at", startLocal.toISOString())
          .lte("created_at", endLocal.toISOString())
          .order("express_number", { ascending: false });

        if (data && data.length > 0) {
          const maxNum = Math.max(...data.map((row) => row.express_number));
          setExpressNumber(maxNum + 1);
        } else {
          setExpressNumber(1);
        }
      } catch (err) {
        console.warn("Error fetching latest express number:", err);
      }
    }
    fetchLatestExpressNumber();

    setSavedStaffs([
      "Angga", "Ari", "Avita", "Dek Run", "Evita", "Gus De", "Haga",
      "Ivanna", "Merry", "Nita", "Nyom", "Ocha", "Rama", "Siyut", "Yayuk"
    ]);
  }, []);

  function generateNewTicketId() {
    const now = new Date();
    setTicketId(generateTrackingCode());
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

  const activeItems = BAG_ITEMS.filter((name) => quantities[name] > 0).map((name) => ({
    name,
    qty: quantities[name],
  }));

  const totalQty = activeItems.reduce((sum, item) => sum + item.qty, 0);
  const isPrintDisabled = totalQty === 0 || !customerName.trim() || !staffName.trim();

  function resetForm() {
    generateNewTicketId();
    setQuantities({
      "Mini Backpack 15L": 0,
      "Backpack XS 6L": 0,
      "Eco Bag": 0,
      "Sling Bag": 0,
      Embroidery: 0,
    });
    setCustomerName("");
    setCustomerPhone("");
    setStaffName("");
    setPickupDate(getLocalDateString());
    setPickupTime("12:00");
    setNotes("");
  }

  function handleReset() {
    resetForm();
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

    const tCode = ticketId || generateTrackingCode();
    setTicketId(tCode);

    // Insert into Supabase
    const supabase = createClient();
    try {

      const { error } = await supabase.from("cmd_express_history").insert([
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
      ]);

      if (error) {
        // Fallback insert if column difference
        await supabase.from("cmd_express_history").insert([
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
        ]);
      }
    } catch (err: any) {
      console.error("Supabase insert exception:", err);
    }

    toast.success(`Mencetak Tiket EXPRESS#${currentExpress}...`, { position: "top-center" });

    setTimeout(() => {
      window.print();
      setExpressNumber(nextExpress);
      resetForm();
    }, 150);
  }

  return (
    <main className="flex-1 px-4 py-4 lg:pb-32 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      {/* Main Grid: Form Input + Live Thermal Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* FORM INPUT SECTION (lg:col-span-6) */}
        <Card className="lg:col-span-6 no-print">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
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
                    onClick={() => setExpressNumber(Math.max(1, expressNumber - 1))}
                    title="Kurangi No. Express"
                  >
                    <Minus className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setExpressNumber(expressNumber + 1)}
                    title="Tambah No. Express"
                  >
                    <Plus className="size-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 1. JUMLAH BARANG */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-muted-foreground">Item</label>
                <Badge variant={totalQty > 0 ? "default" : "outline"} className="text-[11px]">
                  QYT {totalQty} pcs
                </Badge>
              </div>

              <div className="space-y-1.5 md:space-y-2">
                {BAG_ITEMS.map((bag) => {
                  const qty = quantities[bag];
                  const isSelected = qty > 0;
                  return (
                    <div
                      key={bag}
                      className={`flex items-center  justify-between border p-2 rounded-xl transition-all ${isSelected
                        ? "bg-accent border"
                        : "hover:bg-muted/50 border border-transparent"
                        }`}
                    >
                      <span
                        className={`text-sm ${isSelected ? "font-medium text-foreground" : "text-muted-foreground"
                          }`}
                      >
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
                        <span
                          className={`w-6 text-center text-xs font-bold ${isSelected ? "text-primary" : "text-muted-foreground"
                            }`}
                        >
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
                Tanggal & Jam Diambil
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
                placeholder="Email customer, gosend, dll"
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
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* LIVE THERMAL PREVIEW PANEL (lg:col-span-6) */}
        <Card className="col-span-1 lg:col-span-6 lg:sticky lg:top-6">
          <CardHeader className="pb-3 flex flex-row items-center justify-between no-print">
            <CardTitle className="text-base flex items-center gap-2">Preview</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex justify-center items-start overflow-y-auto max-h-[calc(100vh-160px)] rounded-b-xl">
            <ThermalReceipt
              expressNumber={expressNumber}
              pickupDate={pickupDate}
              pickupTime={pickupTime}
              customerName={customerName}
              staffName={staffName}
              items={activeItems}
              totalQty={totalQty}
              notes={notes}
              trackingCode={ticketId}
              printedTime={createdTime}
              origin={origin}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
