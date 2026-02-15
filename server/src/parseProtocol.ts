/**
 * Parse protocol documents (PDF, DOCX, or plain text) to normalized text and optional page boundaries.
 * Story 1: protocol ingestion.
 */

import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export type ParseResult = {
  normalizedText: string;
  pageBoundaries?: Array<{ page: number; startOffset: number; endOffset: number }>;
};

/**
 * Extract text from a PDF buffer. Returns full text and per-page character offsets for citation jump-to.
 */
export async function parsePdf(buffer: Buffer): Promise<ParseResult> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const textResult = await parser.getText();
    const fullText = textResult.text ?? "";
    const pages = textResult.pages ?? [];
    let offset = 0;
    const pageBoundaries = pages.map((p) => {
      const start = offset;
      const pageText = p.text ?? "";
      offset += pageText.length;
      return { page: p.num, startOffset: start, endOffset: offset };
    });
    return { normalizedText: fullText, pageBoundaries };
  } finally {
    await parser.destroy();
  }
}

/**
 * Extract raw text from a DOCX buffer. No page boundaries (DOCX has no fixed pages).
 */
export async function parseDocx(buffer: Buffer): Promise<ParseResult> {
  const result = await mammoth.extractRawText({ buffer });
  const normalizedText = result.value ?? "";
  return { normalizedText };
}

/**
 * Parse buffer by content type. Returns normalized text and optional page boundaries (PDF only).
 */
export async function parseProtocolBuffer(
  buffer: Buffer,
  contentType: string
): Promise<ParseResult> {
  const ct = contentType.toLowerCase();
  if (ct.includes("pdf")) return parsePdf(buffer);
  if (
    ct.includes("wordprocessingml") ||
    ct.includes("docx") ||
    ct === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return parseDocx(buffer);
  }
  if (ct.includes("text/plain") || ct.includes("text/")) {
    return { normalizedText: buffer.toString("utf-8") };
  }
  throw new Error(`Unsupported content type for protocol: ${contentType}`);
}
