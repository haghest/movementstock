type UnknownItem = { name: string; qty: number };

export function calculateSummary(parsed: {
  out: Record<string, number>;
  refund: Record<string, number>;
  unknown: UnknownItem[];
  unknownOut?: UnknownItem[];
  unknownRefund?: UnknownItem[];
}) {
  const salesSkuCount = Object.keys(parsed.out).length;

  const salesQty = Object.values(parsed.out).reduce((a, b) => a + b, 0);

  const refundSkuCount = Object.keys(parsed.refund).length;

  const refundQty = Object.values(parsed.refund).reduce((a, b) => a + b, 0);

  const unknownOutQty = (parsed.unknownOut ?? []).reduce(
    (sum, item) => sum + item.qty,
    0,
  );
  const unknownRefundQty = (parsed.unknownRefund ?? []).reduce(
    (sum, item) => sum + item.qty,
    0,
  );
  const unknownQty = unknownOutQty + unknownRefundQty;

  return {
    salesSkuCount,
    salesQty,
    refundSkuCount,
    refundQty,
    unknownQty,
    unknownOutQty,
    unknownRefundQty,
  };
}
