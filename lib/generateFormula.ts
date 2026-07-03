type QuantityMap = Record<string, number>;
type NameQuantityItem = { name: string; qty: number };

const PRODUCT_RANGE = "$B$6:$B$1358";
const FORMULA_WARNING_LIMIT = 45_000;

function escapeSheetString(value: string) {
  return value.replace(/"/g, '""');
}

function toVerticalStringArray(values: string[]) {
  return `{${values.map((value) => `"${escapeSheetString(value)}"`).join(";")}}`;
}

function toVerticalNumberArray(values: number[]) {
  return `{${values.join(";")}}`;
}

export function generateSkuArrayFormula(
  items: QuantityMap,
  options?: { negative?: boolean; nameItems?: NameQuantityItem[] },
) {
  const skuEntries = Object.entries(items)
    .filter(([, qty]) => qty !== 0)
    .sort(([a], [b]) => a.localeCompare(b));
  const nameEntries = (options?.nameItems ?? [])
    .filter((item) => item.qty !== 0)
    .map((item) => [item.name.toLowerCase().trim(), item.qty] as const)
    .sort(([a], [b]) => a.localeCompare(b));

  if (skuEntries.length === 0 && nameEntries.length === 0) {
    return "";
  }

  const skus = skuEntries.map(([sku]) => sku);
  const skuQuantities = skuEntries.map(([, qty]) =>
    options?.negative ? -qty : qty,
  );
  const names = nameEntries.map(([name]) => name);
  const nameQuantities = nameEntries.map(([, qty]) =>
    options?.negative ? -qty : qty,
  );

  const skuLookup =
    skuEntries.length > 0
      ? `IFERROR(XLOOKUP(sku,${toVerticalStringArray(skus)},${toVerticalNumberArray(skuQuantities)},""),"")`
      : `""`;
  const nameLookup =
    nameEntries.length > 0
      ? `IFERROR(XLOOKUP(LOWER(TRIM(product)),${toVerticalStringArray(names)},${toVerticalNumberArray(nameQuantities)},""),"")`
      : `""`;

  return `=MAP(${PRODUCT_RANGE},LAMBDA(product,LET(sku,IFERROR(REGEXEXTRACT(product,"\\[([^\\]]+)\\]"),""),bySku,${skuLookup},byName,${nameLookup},IF(product="","",IF(bySku<>"",bySku,byName)))))`;
}

export function getFormulaStats(formula: string, uniqueItems: number) {
  return {
    length: formula.length,
    uniqueItems,
    isNearLimit: formula.length >= FORMULA_WARNING_LIMIT,
  };
}
