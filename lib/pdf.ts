import * as pdfjsLib from "pdfjs-dist";

export async function extractText(buffer: Uint8Array) {
  const pdf = await pdfjsLib.getDocument({
    data: buffer,
  }).promise;

  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);

    const content = await page.getTextContent();

    text += content.items.map((item: any) => item.str).join(" ") + "\n";
  }

  return text;
}
