import skuOrder from "@/src/data/sku-order.json";

export function generateColumn(movement: Record<string, number>) {
  return skuOrder
    .map((sku) => {
      const qty = movement[sku];

      return qty ? -qty : "";
    })
    .join("\n");
}
