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

    // Validasi filetype di backend (harus PDF)
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "File must be a PDF document" },
        { status: 400 },
      );
    }

    // Validasi file size di backend (maksimal 2MB)
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 2MB limit" },
        { status: 400 },
      );
    }

    const buffer = new Uint8Array(await file.arrayBuffer());

    const result = await extractText(buffer);

    // unpdf mengembalikan array per halaman
    const text = Array.isArray(result.text)
      ? result.text.join("\n")
      : String(result.text ?? "");

    const parsed = parseDailySales(text);
    const summary = calculateSummary(parsed);
    const importData = generateImport(parsed.out, parsed.refund);

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
