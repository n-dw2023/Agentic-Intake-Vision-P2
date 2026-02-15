# Extraction and Citations Spec: Study Project V2

> Traceability: Story 1 (protocol ingestion and extraction). Referenced by technical-spec, database-schema, api-spec.

## Purpose

Define the shape of LLM extraction output and citation format. Code: Zod schemas and types in `shared` package (`extraction-schema.ts`). so the UI can display confidence, evidence, and "jump to evidence" consistently across PDF, DOCX, and text.

## Extraction Result Schema

Each extracted field is one **ExtractionResult**:

- **field_name** (string): One of `title`, `sponsor`, `interventional`, `cancer_related`, `participating_orgs`. For participating_orgs, value is array of strings.
- **value** (any): Scalar (string, boolean) or array of strings for participating_orgs.
- **confidence** (string): `low` | `medium` | `high`.
- **citations** (array of Citation): Zero or more citations supporting this value. Empty if inferred or user-provided.
- **provenance** (string): `extracted` | `inferred` | `user-provided`. Set by system; user edits set provenance to user-provided.

Validation: Reject extraction payload if required fields missing or confidence/citations/provenance invalid.

## Citation Schema

Each **Citation** has:

- **snippet** (string, required): Exact or approximate quote from the protocol text used as evidence. Shown in UI and used for fallback when jump-to not available (e.g. DOCX).
- **startOffset** (number, optional): Character offset in normalized protocol text where snippet starts. Used for jump-to in text view and for mapping to PDF page if page boundaries stored.
- **endOffset** (number, optional): Character offset where snippet ends in normalized text.
- **page** (number, optional): 1-based page number (for PDF). If present, viewer can scroll to page and optionally highlight region if startOffset/endOffset map to that page.

**Minimal viable:** At least `snippet`. For jump-to in prototype: implement resolution for (1) plain text: use startOffset/endOffset to scroll and highlight; (2) PDF: use page and optionally startOffset/endOffset within page to highlight. DOCX v1: show snippet in side panel without scroll-to.

## LLM Contract

- **Input to LLM:** Normalized protocol text (and optionally content_type or "PDF page N" hints if we chunk by page). Prompt must ask for structured JSON: one object per field, each with value, confidence, and array of citations; each citation with snippet and, if possible, startOffset and endOffset (or page for PDF). Instruct model to quote verbatim or near-verbatim for snippet; offsets can be approximate if exact match is costly.
- **Output validation:** Parse JSON; validate against schema; if offsets present, clamp to [0, text.length]. Reject or retry on invalid output.
- **Storing:** Save citations as-is in extraction_results.citations (jsonb). Viewer component receives protocol_asset (normalized_text, metadata.page_boundaries) and citation; resolves position for jump-to per format.

## Protocol Text and Offsets

- **Normalized text:** Single string, concatenation of all extracted text from PDF/DOCX or the pasted text. No embedded page breaks required; page_boundaries (for PDF) stored separately as array of { page, startOffset, endOffset } so viewer can map character offset to page.
- **PDF:** Parser produces normalized_text and page_boundaries. LLM receives full text; returned startOffset/endOffset refer to this string. Viewer: given citation.startOffset, find which page it falls in via page_boundaries; scroll to that page; optionally highlight range if within-page offsets stored or computed.
- **DOCX:** Normalized text may not have page boundaries; LLM returns snippet; jump-to can be "find snippet in text and scroll" or defer to snippet-only display in side panel.
- **Text:** startOffset/endOffset directly index normalized_text; viewer scrolls and highlights.

## UI Behavior Summary

- **Extraction Summary Card:** For each field, show value, confidence badge, and list of citations. Each citation: clickable snippet; on click, open protocol viewer (or focus it) and jump to position when supported (text/PDF); otherwise show snippet in side panel.
- **Protocol Evidence Viewer (in workspaces):** Same: receive citation, resolve to position, scroll/highlight or show snippet. Reuse single viewer component for Extraction Summary and for Document/Intake workspace evidence.
