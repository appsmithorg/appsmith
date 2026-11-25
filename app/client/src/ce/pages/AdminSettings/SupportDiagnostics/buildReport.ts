import { sha256 } from "js-sha256";
import { SECTION_FILE_NAMES, SECTION_IDS } from "./types";
import type { SectionId, SectionResult, SectionStatus } from "./types";

/** Size cap, in UTF-8 bytes, over every file in the report. */
export const MAX_REPORT_BYTES = 1_048_576;

const SCHEMA_VERSION = 1;
const UNKNOWN = "UNKNOWN";
const MANIFEST_FILE = "manifest.json";
const SUMMARY_FILE = "summary.json";

export interface ReportInput {
  sections: SectionResult[];
  selected: SectionId[];
  collectorVersion: string;
  /** The browser origin, for example `window.location.origin`. */
  origin: string;
  now: Date;
}

/** File name to file text. */
export type ReportFiles = Record<string, string>;

export class ReportTooLargeError extends Error {
  readonly totalBytes: number;

  constructor(totalBytes: number) {
    super(
      `The report is ${totalBytes} bytes, over the ${MAX_REPORT_BYTES}-byte limit.`,
    );
    this.name = "ReportTooLargeError";
    this.totalBytes = totalBytes;
  }
}

/**
 * Lowercase hex SHA-256 of the UTF-8 bytes of `text`. Uses `js-sha256`, not Web
 * Crypto, because `crypto.subtle` exists only in secure contexts and
 * self-hosted instances often run on plain `http://`.
 */
export async function sha256Hex(text: string): Promise<string> {
  return sha256(text);
}

/** Builds the ZIP file name from the UTC date of `now`. */
export function reportFileName(now: Date, encrypted: boolean): string {
  const year = String(now.getUTCFullYear()).padStart(4, "0");
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const prefix = encrypted
    ? "appsmith-support-diagnostics-encrypted"
    : "appsmith-support-diagnostics";

  return `${prefix}-${year}${month}${day}.zip`;
}

function parseHttpUrl(value: unknown): URL | null {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/**
 * The instance fields only the browser knows. `instanceUrl` is the origin the
 * admin is using. `publicUrlMismatch` compares that origin with the configured
 * public URL, and is `"UNKNOWN"` when either one is not an http(s) URL.
 */
export function instanceBrowserFields(
  data: Record<string, unknown> | null,
  origin: string,
): { instanceUrl: string; publicUrlMismatch: boolean | "UNKNOWN" } {
  const configured = parseHttpUrl(data?.configuredPublicUrl);
  const current = parseHttpUrl(origin);

  return {
    instanceUrl: origin,
    publicUrlMismatch:
      configured && current ? configured.origin !== current.origin : UNKNOWN,
  };
}

/** Reads a plain string, or the `value` of a `{ value, ... }` field. */
function textValue(value: unknown): string {
  if (typeof value === "string" && value !== "") return value;

  if (value !== null && typeof value === "object" && "value" in value) {
    const inner = (value as { value: unknown }).value;

    if (typeof inner === "string" && inner !== "") return inner;
  }

  return UNKNOWN;
}

function toJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function sectionFileBody(
  section: SectionResult,
  origin: string,
): Record<string, unknown> {
  if (section.status !== "OK") {
    return {
      sectionId: section.sectionId,
      status: section.status,
      errorCode: section.errorCode ?? null,
    };
  }

  const data =
    section.sectionId === "INSTANCE"
      ? { ...section.data, ...instanceBrowserFields(section.data, origin) }
      : section.data;

  return {
    sectionId: section.sectionId,
    status: section.status,
    collectedAt: section.collectedAt,
    data,
  };
}

/**
 * Turns the section results into the report's JSON files. Only the selected
 * sections appear: an unchecked section's data and status are left out of every
 * file. Rejects with `ReportTooLargeError` when the files together exceed
 * `MAX_REPORT_BYTES` UTF-8 bytes.
 */
export async function buildReport(
  input: ReportInput,
  hash: (text: string) => Promise<string> = sha256Hex,
): Promise<{ files: ReportFiles; totalBytes: number }> {
  const { collectorVersion, now, origin, sections, selected } = input;
  const selectedSet = new Set<SectionId>(selected);
  const selectedIds = SECTION_IDS.filter((id) => selectedSet.has(id));
  const excludedIds = SECTION_IDS.filter((id) => !selectedSet.has(id));

  const byId = new Map<SectionId, SectionResult>();

  for (const section of sections) byId.set(section.sectionId, section);

  const selectedSections: SectionResult[] = selectedIds.map(
    (sectionId) =>
      byId.get(sectionId) ?? {
        sectionId,
        status: "NOT_COLLECTED",
        collectedAt: null,
        data: null,
        errorCode: null,
      },
  );

  const sectionStatus: Partial<Record<SectionId, SectionStatus>> = {};

  for (const section of selectedSections) {
    sectionStatus[section.sectionId] = section.status;
  }

  const usableData = (sectionId: SectionId) => {
    const section = selectedSections.find((s) => s.sectionId === sectionId);

    return section?.status === "OK" ? section.data : null;
  };
  const instanceData = usableData("INSTANCE");
  const deploymentData = usableData("DEPLOYMENT");
  const edition = textValue(instanceData?.edition);
  const appVersion = textValue(instanceData?.version);

  const files: ReportFiles = {
    [SUMMARY_FILE]: toJson({
      edition,
      appVersion,
      deploymentTool: textValue(deploymentData?.tool),
      sectionStatus,
    }),
  };

  for (const section of selectedSections) {
    files[SECTION_FILE_NAMES[section.sectionId]] = toJson(
      sectionFileBody(section, origin),
    );
  }

  const hashes: Record<string, string> = {};

  for (const [name, text] of Object.entries(files)) {
    hashes[name] = await hash(text);
  }

  files[MANIFEST_FILE] = toJson({
    schemaVersion: SCHEMA_VERSION,
    generatedAt: now.toISOString(),
    edition,
    appVersion,
    collectorVersion,
    selectedSectionIds: selectedIds,
    excludedSectionIds: excludedIds,
    sectionStatus,
    sha256: hashes,
  });

  const encoder = new TextEncoder();
  const totalBytes = Object.values(files).reduce(
    (sum, text) => sum + encoder.encode(text).length,
    0,
  );

  if (totalBytes > MAX_REPORT_BYTES) throw new ReportTooLargeError(totalBytes);

  return { files, totalBytes };
}
