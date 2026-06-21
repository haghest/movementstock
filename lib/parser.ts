function extractItems(section: string) {
  const results: Record<string, number> = {};

  // const regex =
  //   /\[([A-Z0-9]+)\][\s\S]*?(\d+(?:\.\d+)?)\s*\nUnit\(s\)/g;
  //
  const regex = /\[([^\]]+)\][\s\S]*?(\d+(?:\.\d+)?)\s*\nUnit\(s\)/g;

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
  const refundsStart = text.indexOf("Refunds");

  const salesSection =
    salesStart >= 0 && refundsStart >= 0
      ? text.slice(salesStart, refundsStart)
      : text;

  const refundSection = refundsStart >= 0 ? text.slice(refundsStart) : "";

  const out = extractItems(salesSection);
  const refund = extractItems(refundSection);

  return {
    out,
    refund,
  };
}
