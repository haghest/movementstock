const XLSX = require("xlsx");
const fs = require("fs");

const workbook = XLSX.readFile(
  "./Copy of Movement Stock Sunset Road 2026.xlsx",
);

const sheet = workbook.Sheets[workbook.SheetNames[0]];

const rows = XLSX.utils.sheet_to_json(sheet, {
  header: 1,
});

const skuOrder = [];

for (const row of rows) {
  const product = row[1];

  if (!product) continue;

  const match = String(product).match(/\[([^\]]+)\]/);

  if (match) {
    skuOrder.push(match[1]);
  }
}

fs.writeFileSync(
  "./src/data/sku-order.json",
  JSON.stringify(skuOrder, null, 2),
);

console.log(`Generated ${skuOrder.length} SKUs`);
