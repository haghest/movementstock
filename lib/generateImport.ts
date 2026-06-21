export function generateImport(
  out: Record<string, number>,
  refund: Record<string, number>,
) {
  const allSkus = new Set([...Object.keys(out), ...Object.keys(refund)]);

  return Array.from(allSkus)
    .sort()
    .map((sku) => {
      const refundQty = refund[sku] ?? "";
      const outQty = out[sku] ? -out[sku] : "";

      return `${sku}\t\t${refundQty}\t${outQty}`;
    })
    .join("\n");
}
