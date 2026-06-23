function extractItems(section: string) {
  const results: Record<string, number> = {};

  const regex = /\[([^\]]+)\][\s\S]*?(\d+(?:\.\d+)?)\s*\nUnit\(s\)/g;

  let match;

  while ((match = regex.exec(section)) !== null) {
    const sku = match[1];
    const qty = Number(match[2]);

    results[sku] = (results[sku] || 0) + qty;
  }

  return results;
}

// function extractKnownNoSkuItems(text: string): UnknownItem[] {
//   const results: UnknownItem[] = [];

//   const knownItems = [
//     "Mini Backpack XS - Made In Sunset",
//     "Mini Backpack - Made in Sunset",
//     "Product Reparation",
//     "MICRO POUCHES (Micro, Unique",
//     "CMD Custom Embroidery",
//     "Sling Bag - Made in Sunset",
//   ];

//   for (const itemName of knownItems) {
//     const escaped = itemName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

//     const regex = new RegExp(
//       `${escaped}\\s+(\\d+(?:\\.\\d+)?)\\s+Unit\\(s\\)`,
//       "gi",
//     );

//     let match;

//     while ((match = regex.exec(text)) !== null) {
//       results.push({
//         name: itemName,
//         qty: Number(match[1]),
//       });
//     }
//   }

//   return results;
// }

function extractKnownNoSkuItems(text: string): UnknownItem[] {
  const results: UnknownItem[] = [];

  const knownItems = [
    "Mini Backpack XS - Made In Sunset",
    "Mini Backpack - Made in Sunset",
    "Product Reparation",
    "MICRO POUCHES (Micro, Unique",
    "CMD Custom Embroidery",
    "Sling Bag - Made in Sunset",
  ];

  const lines = text.split("\n");

  for (const line of lines) {
    for (const itemName of knownItems) {
      if (line.includes(itemName)) {
        const qtyMatch = line.match(/(\d+(?:\.\d+)?)$/);

        if (qtyMatch) {
          results.push({
            name: itemName,
            qty: Number(qtyMatch[1]),
          });
        }
      }
    }
  }

  return results;
}

type UnknownItem = {
  name: string;
  qty: number;
};

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
    unknown: extractKnownNoSkuItems(text),
  };
}
