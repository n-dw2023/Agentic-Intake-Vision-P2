/**
 * Study Project V2: Protocol ingest and extraction (Story 1).
 */

import { Router, Request, Response } from "express";
import multer from "multer";
import {
  insertProtocolAsset,
  getProtocolAsset,
  insertExtractionResults,
  getExtractionResultsByProtocolAssetId,
  deleteExtractionResultsByProtocolAssetId,
} from "../supabase.js";
import { parseProtocolBuffer } from "../parseProtocol.js";
import { extractFromProtocol } from "../extractProtocol.js";
import { validateExtractionResults } from "shared";
import { DEMO_PROTOCOL_TEXT, DEMO_EXTRACTION_RESULTS } from "../demoData.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

function getUserId(req: Request): string | null {
  const id = req.headers["x-user-id"];
  if (typeof id === "string" && id.length > 0) return id;
  return null;
}

export const protocolsRouter = Router();

/**
 * POST /protocols/demo
 * Returns a demo protocol asset and hard-coded extraction results (no LLM). For demo bypass.
 */
protocolsRouter.post("/demo", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }
  try {
    const { id } = await insertProtocolAsset(
      userId,
      "text/plain",
      DEMO_PROTOCOL_TEXT,
      { demo: true },
      null
    );
    await insertExtractionResults(id, DEMO_EXTRACTION_RESULTS);
    res.status(200).json({
      protocolAssetId: id,
      contentType: "text/plain",
      normalizedTextLength: DEMO_PROTOCOL_TEXT.length,
      extractionResults: DEMO_EXTRACTION_RESULTS,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Demo failed";
    res.status(502).json({ error: message });
  }
});

/**
 * POST /protocols/ingest
 * Body: multipart form with "file" (PDF/DOCX) OR JSON { text: string } for paste.
 */
protocolsRouter.post(
  "/ingest",
  (req, res, next) => {
    const ct = req.headers["content-type"] ?? "";
    if (ct.includes("multipart/form-data")) return upload.single("file")(req, res, next);
    next();
  },
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Missing or invalid x-user-id header" });
      return;
    }

    try {
      if (req.file) {
        const buffer = req.file.buffer;
        const contentType = req.file.mimetype || "application/octet-stream";
        const { normalizedText, pageBoundaries } = await parseProtocolBuffer(buffer, contentType);
        const metadata: Record<string, unknown> = {
          original_filename: req.file.originalname,
          ...(pageBoundaries && pageBoundaries.length > 0 ? { page_boundaries: pageBoundaries } : {}),
        };
        const { id } = await insertProtocolAsset(
          userId,
          contentType,
          normalizedText,
          metadata,
          null
        );
        res.status(200).json({
          protocolAssetId: id,
          contentType,
          normalizedTextLength: normalizedText.length,
        });
        return;
      }

      if (req.body && typeof req.body.text === "string") {
        const text = req.body.text.trim();
        if (!text) {
          res.status(400).json({ error: "text cannot be empty" });
          return;
        }
        const { id } = await insertProtocolAsset(
          userId,
          "text/plain",
          text,
          {},
          null
        );
        res.status(200).json({
          protocolAssetId: id,
          contentType: "text/plain",
          normalizedTextLength: text.length,
        });
        return;
      }

      res.status(400).json({
        error: "Provide either a multipart file (field: file) or JSON body { text: string }",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Protocol ingest failed";
      res.status(502).json({ error: message, code: "INGEST_FAILED" });
    }
  }
);

/**
 * POST /protocols/:protocolAssetId/extract
 * Runs LLM extraction on the protocol asset; returns extraction results (and optionally persists them).
 */
protocolsRouter.post("/:protocolAssetId/extract", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }
  const protocolAssetId = typeof req.params.protocolAssetId === "string" ? req.params.protocolAssetId : req.params.protocolAssetId?.[0] ?? "";
  if (!protocolAssetId) {
    res.status(400).json({ error: "protocolAssetId required" });
    return;
  }

  try {
    const asset = await getProtocolAsset(protocolAssetId, userId);
    if (!asset) {
      res.status(404).json({ error: "Protocol asset not found" });
      return;
    }

    const rawResults = await extractFromProtocol(asset.normalized_text, asset.content_type);
    const validated = validateExtractionResults(rawResults, asset.normalized_text.length);
    if (!validated.success) {
      res.status(502).json({ error: "Extraction validation failed", errors: validated.errors });
      return;
    }

    await deleteExtractionResultsByProtocolAssetId(protocolAssetId);
    await insertExtractionResults(protocolAssetId, validated.data);

    res.status(200).json({
      extractionResults: validated.data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction failed";
    res.status(502).json({ error: message, code: "EXTRACT_FAILED" });
  }
});

/**
 * GET /protocols/:protocolAssetId
 * Returns protocol asset (normalized text, metadata) for viewer and citation jump-to.
 */
protocolsRouter.get("/:protocolAssetId", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }
  const protocolAssetId = typeof req.params.protocolAssetId === "string" ? req.params.protocolAssetId : req.params.protocolAssetId?.[0] ?? "";
  if (!protocolAssetId) {
    res.status(400).json({ error: "protocolAssetId required" });
    return;
  }

  try {
    const asset = await getProtocolAsset(protocolAssetId, userId);
    if (!asset) {
      res.status(404).json({ error: "Protocol asset not found" });
      return;
    }
    res.status(200).json({
      id: asset.id,
      contentType: asset.content_type,
      normalizedText: asset.normalized_text,
      metadata: asset.metadata,
      createdAt: asset.created_at,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get protocol asset";
    res.status(502).json({ error: message });
  }
});

/**
 * POST /protocols/:protocolAssetId/extraction/confirm
 * Persist user-edited extraction results (overwrites existing). Used when user confirms or edits before creating project.
 */
protocolsRouter.post("/:protocolAssetId/extraction/confirm", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }
  const protocolAssetId = typeof req.params.protocolAssetId === "string" ? req.params.protocolAssetId : req.params.protocolAssetId?.[0] ?? "";
  if (!protocolAssetId) {
    res.status(400).json({ error: "protocolAssetId required" });
    return;
  }
  const body = req.body as { extractionResults?: unknown };
  if (!body || !Array.isArray(body.extractionResults)) {
    res.status(400).json({ error: "Body must be { extractionResults: array }" });
    return;
  }
  try {
    const asset = await getProtocolAsset(protocolAssetId, userId);
    if (!asset) {
      res.status(404).json({ error: "Protocol asset not found" });
      return;
    }
    const validated = validateExtractionResults(body.extractionResults, asset.normalized_text.length);
    if (!validated.success) {
      res.status(400).json({ error: "Validation failed", errors: validated.errors });
      return;
    }
    await deleteExtractionResultsByProtocolAssetId(protocolAssetId);
    await insertExtractionResults(protocolAssetId, validated.data);
    res.status(200).json({ extractionResults: validated.data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Confirm failed";
    res.status(502).json({ error: message });
  }
});

/**
 * GET /protocols/:protocolAssetId/extraction
 * Returns persisted extraction results for this protocol asset.
 */
protocolsRouter.get("/:protocolAssetId/extraction", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Missing or invalid x-user-id header" });
    return;
  }
  const protocolAssetId = typeof req.params.protocolAssetId === "string" ? req.params.protocolAssetId : req.params.protocolAssetId?.[0] ?? "";
  if (!protocolAssetId) {
    res.status(400).json({ error: "protocolAssetId required" });
    return;
  }

  try {
    const asset = await getProtocolAsset(protocolAssetId, userId);
    if (!asset) {
      res.status(404).json({ error: "Protocol asset not found" });
      return;
    }
    const rows = await getExtractionResultsByProtocolAssetId(protocolAssetId);
    const extractionResults = rows.map((r) => ({
      field_name: r.field_name,
      value: r.value,
      confidence: r.confidence,
      citations: r.citations,
      provenance: r.provenance,
    }));
    res.status(200).json({ extractionResults });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get extraction";
    res.status(502).json({ error: message });
  }
});
