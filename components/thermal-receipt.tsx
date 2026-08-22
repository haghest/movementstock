"use client";

import { QRCodeSVG } from "qrcode.react";

export interface ThermalReceiptItem {
  name: string;
  qty: number;
}

export interface ThermalReceiptProps {
  expressNumber?: number;
  pickupDate?: string;
  pickupTime?: string;
  customerName?: string;
  staffName?: string;
  items: ThermalReceiptItem[];
  totalQty?: number;
  notes?: string | null;
  trackingCode?: string;
  printedTime?: string;
  origin?: string;
  showLogo?: boolean;
  showQRCode?: boolean;
}

function formatFullDisplayDate(dateStr?: string) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  } catch {
    return dateStr;
  }
}

export function ThermalReceipt({
  expressNumber,
  pickupDate,
  pickupTime,
  customerName,
  staffName,
  items = [],
  totalQty,
  notes,
  trackingCode,
  printedTime,
  origin,
  showLogo = true,
  showQRCode = true,
}: ThermalReceiptProps) {
  const activeItems = items.filter((item) => item.qty > 0);
  const calculatedTotalQty =
    totalQty !== undefined
      ? totalQty
      : activeItems.reduce((sum, item) => sum + item.qty, 0);

  const trackingUrl = trackingCode
    ? origin
      ? `${origin}/track?id=${trackingCode}`
      : `https://tttm.haga.my.id/track?id=${trackingCode}`
    : null;

  return (
    <div
      id="thermal-receipt"
      style={{ width: "210px" }}
      className="bg-white text-black p-3.5 shadow-lg border border-neutral-300 text-xs leading-snug select-none mx-auto print:border-none print:shadow-none"
    >
      {/* Header Logo */}
      {showLogo && (
        <div className="text-center  border-black  pb-2 flex flex-col items-center">
          {/* <img
            src="/tttm.jpg"
            alt="Ticket to the Moon Logo"
            className="h-auto w-full mx-auto mb-1 object-contain mix-blend-multiply"
          /> */}
          {expressNumber !== undefined && (
            <p className="font-bold text-2xl inline-block ">
              Express #{expressNumber}
            </p>
          )}
        </div>
      )}

      {/* PICKUP BADGE */}
      <div className="text-center border-black border-dashed">
        <p className="text-[12px] uppercase font-extrabold tracking-wider">
          DIAMBIL PADA
        </p>
        <p className="text-sm font-bold mt-0.5 text-black">
          {formatFullDisplayDate(pickupDate)}
        </p>
        <p className="text-sm font-bold text-neutral-900">
          {pickupTime || "-"}
        </p>
      </div>

      {/* Customer Info */}
      <div className="pb-1.5 border-b border-black border-dashed space-y-1 text-sm font-medium mt-2">
        <div className="flex justify-between gap-3 font-mono">
          <span className="shrink-0">CUST:</span>
          <span className="font-semibold uppercase text-right break-words">
            {customerName || "-"}
          </span>
        </div>
        <div className="flex justify-between gap-3 font-mono">
          <span className="shrink-0">STAFF:</span>
          <span className="font-semibold uppercase text-right break-words">
            {staffName || "-"}
          </span>
        </div>
      </div>

      {/* ITEMS SPECS */}
      <div className="py-2 border-b border-black border-dashed">
        <div className="flex justify-between items-center mb-1 text-[10px] font-semibold font-mono">
          <div className="flex gap-2.5">
            <span>QTY</span>
            <span>ITEM</span>
          </div>

          <span>TOTAL: {calculatedTotalQty} PCS</span>
        </div>

        <div className="space-y-0.5">
          {activeItems.length > 0 ? (
            activeItems.map((item) => (
              <div
                key={item.name}
                className="flex items-start font-medium text-sm gap-5"
              >
                <span className="font-mono shrink-0 font-bold">{item.qty}</span>
                <span className="tracking-tight">{item.name}</span>
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
          <p className="text-[10px] font-bold  uppercase mb-0.5 font-mono">
            INTERNAL NOTES
          </p>
          <p className="text-sm leading-snug whitespace-pre-wrap break-words max-w-full ">
            {notes}
          </p>
        </div>
      )}

      {/* Tracking QR Code */}
      {/* {showQRCode && trackingUrl && trackingCode && (
        <div className="pt-2 pb-1 text-center flex flex-col items-center space-y-0.5 border-b border-black border-dashed">
          <QRCodeSVG
            value={trackingUrl}
            size={130}
            level="M"
            className="mx-auto my-1"
          />
          <p className="text-[9px] font-mono text-neutral-900 font-bold uppercase tracking-tight pt-0.5">
            Tracking Code: {trackingCode}
          </p>

        </div>
      )} */}
      <div> <p className="text-[10px] font-mono font-bold text-center uppercase tracking-tight pt-1.5">
        WHATSAPP
      </p><img src="/qr.png" alt="Whatsapp" className="w-2/3 h-auto mx-auto object-contain mix-blend-multiply" /></div>


      {/* Timestamp */}
      <div className=" text-center text-[10px] pt-2">
        <span>Diprint {printedTime || "TODAY"}</span>
        {trackingCode && !showQRCode && (
          <p className="text-sm font-mono font-bold uppercase tracking-tight">
            {trackingCode}
          </p>
        )}
      </div>
    </div>
  );
}
