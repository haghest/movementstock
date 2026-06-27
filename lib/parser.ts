type UnknownItem = {
  name: string;
  qty: number;
};

function extractItems(section: string) {
  const results: Record<string, number> = {};

  const regex = /\[([^\]]+)\][\s\S]*?(\d+(?:\.\d+)?)\s*\nUnit\(s\)/g;

  let match;

  while ((match = regex.exec(section)) !== null) {
    const sku = match[1].trim();
    const qty = Number(match[2]);

    results[sku] = (results[sku] || 0) + qty;
  }

  return results;
}

function extractNonSkuItems(text: string): UnknownItem[] {
  const results: UnknownItem[] = [];

  /**
   * Tambahkan produk tanpa SKU di sini
   */
  const patterns = [
    "Product Reparation",
    "CMD Custom Embroidery",
    "Mini Backpack - Made in Sunset",
    "Sling Bag - Made in Sunset",
    "Eco Bag Medium - Made in Sunset",
    "Mini Backpack XS - Made In Sunset",
    "MICRO POUCHES (Micro, Unique",
    "IZIPIZI Junior",
    "IZIPIZI JUNIOR",
    "IZIPIZI SUN SPEED",
    "IZIPIZI SUN POLARIZED",
    "IZIPIZI SUN HORIZON",
    "IZIPIZI SUN JOURNEY",
    "IZIPIZI SUN",
    "MUNDAKA ISIS",
    "MUNDAKA WILD",
    "MUNDAKA ROCCA",
    "MUNDAKA SHAN",
    "MUNDAKA SKANDI",
    "MUNDAKA STACK",
    "MUNDAKA TEAVA",
    "MUNDAKA TRIBEKA",
    "MUNDAKA ROCCA",
    "MUNDAKA RAVEN",
    "MUNDAKA PUNCAK",
    "MUNDAKA POZZIC",
    "MUNDAKA POZZ",
    "MUNDAKA OSKA",
    "MUNDAKA OLIVE",
    "MUNDAKA OKTO",
    "MUNDAKA NIHI",
    "MUNDAKA MILLER",
    "MUNDAKA MENPHIS",
    "MUNDAKA LUA",
    "MUNDAKA LEELA",
    "MUNDAKA KOSMO",
    "MUNDAKA KJERAG",
    "MUNDAKA KINFOLK",
    "MUNDAKA KHARDUNG",
    "MUNDAKA KERAMAS",
    "MUNDAKA KAROO",
    "MUNDAKA karst",
    "MUNDAKA HECTOP",
    "MUNDAKA GRANITE",
    "MUNDAKA GLADIATOR",
    "MUNDAKA FOIL",
    "MUNDAKA FAME",
    "MUNDAKA ENDLESS",
    "MUNDAKA ELECTRA",
    "MUNDAKA DRUMLIN",
    "MUNDAKA DREAMLAND",
    "MUNDAKA DRAKAR",
    "MUNDAKA DITA",
    "MUNDAKA CLARK",
    "MUNDAKA CIERZO",
    "MUNDAKA CHINOOK",
    "MUNDAKA CANGGU",
    "MUNDAKA BLOODY",
    "MUNDAKA BIANCA",
    "MUNDAKA BELTZ",
    "MUNDAKA ANAKAO",
    "MUNDAKA ALAMO",
    "MUNDAKA AI1XS",
    "MUNDAKA AI1",
    "MUNDAKA ALA001PL",
    "MUNDAKA STACK",
    "MUNDAKA AKILA",
    "MUNDAKA KENSINGTON",
    "Petromax",
    "Keychain Kuksa Standard - One Shot ",
    "Neem Style Twilly",
  ];

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const matchedPattern = patterns.find((pattern) => line.includes(pattern));

    if (!matchedPattern) continue;

    const qtyMatch = line.match(/(\d+(?:\.\d+)?)$/);

    if (!qtyMatch) continue;

    const qty = Number(qtyMatch[1]);

    let name = line.replace(qtyMatch[1], "").trim();

    /**
     * Alias tampilan supaya lebih rapi
     */
    if (name.includes("MICRO POUCHES")) {
      name = "MICRO POUCHES (Micro, Unique 🌈)";
    }

    results.push({
      name,
      qty,
    });
  }

  const merged = new Map<string, number>();

  for (const item of results) {
    merged.set(item.name, (merged.get(item.name) || 0) + item.qty);
  }

  return Array.from(merged.entries()).map(([name, qty]) => ({
    name,
    qty,
  }));
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
  const unknown = extractNonSkuItems(text);

  return {
    out,
    refund,
    unknown,
  };
}
