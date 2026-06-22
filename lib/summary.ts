export function calculateSummary(parsed: {
  out: Record<string, number>;
  refund: Record<string, number>;
  unknown: { name: string; qty: number }[];
}) {
  const salesSkuCount = Object.keys(parsed.out).length;

  const salesQty = Object.values(parsed.out).reduce((a, b) => a + b, 0);

  const refundSkuCount = Object.keys(parsed.refund).length;

  const refundQty = Object.values(parsed.refund).reduce((a, b) => a + b, 0);

  const unknownQty = parsed.unknown.reduce((sum, item) => sum + item.qty, 0);

  return {
    salesSkuCount,
    salesQty,
    refundSkuCount,
    refundQty,
    unknownQty,
  };
}
