function extractItems(section: string) {
  const results: Record<string, number> = {};

  const regex = /\[([A-Z0-9]+)\][\s\S]*?\n(\d+(?:\.\d+)?)\nUnit\(s\)/g;

  let match;

  while ((match = regex.exec(section)) !== null) {
    const sku = match[1];
    const qty = Number(match[2]);

    results[sku] = (results[sku] || 0) + qty;
  }

  return results;
}

export function parseDailySales(text: string) {
  const salesStart = text.indexOf("Sales");
  const refundStart = text.indexOf("Refunds");

  console.log("========== DEBUG ==========");
  console.log("salesStart =", salesStart);
  console.log("refundStart =", refundStart);

  if (refundStart !== -1) {
    console.log("=== REFUND PREVIEW ===");
    console.log(
      text.substring(refundStart, Math.min(refundStart + 1000, text.length)),
    );
  } else {
    console.log("REFUNDS NOT FOUND");
  }

  const salesSection =
    refundStart > -1
      ? text.slice(salesStart, refundStart)
      : text.slice(salesStart);

  const refundSection = refundStart > -1 ? text.slice(refundStart) : "";

  const out = extractItems(salesSection);
  const refund = extractItems(refundSection);

  console.log("OUT SKU COUNT =", Object.keys(out).length);
  console.log("REFUND SKU COUNT =", Object.keys(refund).length);

  console.log("FIRST 10 OUT:");
  console.log(Object.entries(out).slice(0, 10));

  console.log("REFUND DATA:");
  console.log(refund);

  return {
    out,
    refund,
  };
}
