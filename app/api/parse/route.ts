import { NextResponse } from "next/server";
import { extractText } from "unpdf";
import { parseDailySales } from "@/lib/parser";
import { generateImport } from "@/lib/generateImport";
import { calculateSummary } from "@/lib/summary";
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("pdf") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = new Uint8Array(await file.arrayBuffer());

    const result = await extractText(buffer);

    // unpdf mengembalikan array per halaman
    const text = Array.isArray(result.text)
      ? result.text.join("\n")
      : String(result.text ?? "");
    // debug micropouch
    console.log("HAS MICRO POUCHES:", text.includes("MICRO POUCHES"));
    const microLines = text
      .split("\n")
      .filter((line) => line.includes("MICRO"));

    console.log("MICRO LINES:");
    console.log(microLines);

    const parsed = parseDailySales(text);
    console.log("UNKNOWN ITEMS:");
    console.log(parsed.unknown);
    const summary = calculateSummary(parsed);
    const importData = generateImport(parsed.out, parsed.refund);
    // const outColumn = generateColumn(parsed.out);
    // const refundColumn = generateColumn(parsed.refund);
    // const outImport = generateImport(parsed.out, true);
    // const refundImport = generateImport(parsed.refund, false);
    console.log("========== RESULT ==========");
    console.log("OUT:", parsed.out);
    console.log("REFUND:", parsed.refund);

    return NextResponse.json({
      success: true,
      parsed,
      summary,
      importData,
    });
  } catch (error) {
    console.error("PARSE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      },
    );
  }
}
