export type SectionId =
  | "INSTANCE"
  | "DEPLOYMENT"
  | "FEATURE_FLAGS"
  | "APPLICATIONS"
  | "DATASOURCES"
  | "WORKFLOWS"
  | "IDENTITY"
  | "AI_MCP"
  | "HEALTH";

export type SectionStatus =
  | "OK"
  | "NOT_SUPPORTED"
  | "NOT_LICENSED"
  | "UNAVAILABLE"
  | "UNKNOWN"
  | "NOT_COLLECTED";

export interface SectionResult {
  sectionId: SectionId;
  status: SectionStatus;
  collectedAt: string | null;
  data: Record<string, unknown> | null;
  errorCode: string | null;
}

export interface SectionsResponse {
  collectorVersion: string;
  sections: SectionResult[];
}

/** Section ids in display order. */
export const SECTION_IDS: readonly SectionId[] = [
  "INSTANCE",
  "DEPLOYMENT",
  "FEATURE_FLAGS",
  "APPLICATIONS",
  "DATASOURCES",
  "WORKFLOWS",
  "IDENTITY",
  "AI_MCP",
  "HEALTH",
];

export const SECTION_FILE_NAMES: Record<SectionId, string> = {
  INSTANCE: "instance.json",
  DEPLOYMENT: "deployment.json",
  FEATURE_FLAGS: "feature-flags.json",
  APPLICATIONS: "applications.json",
  DATASOURCES: "datasources.json",
  WORKFLOWS: "workflows.json",
  IDENTITY: "identity.json",
  AI_MCP: "ai-mcp.json",
  HEALTH: "health.json",
};

/**
 * Turns a server `collectedAt` into an ISO string. The server writes `Instant`
 * as epoch seconds (a number with a fraction); a string is accepted when it
 * parses as a date. Anything else is `null`.
 */
function normalizeCollectedAt(value: unknown): string | null {
  let date: Date | null = null;

  if (typeof value === "number" && Number.isFinite(value)) {
    date = new Date(value * 1000);
  } else if (typeof value === "string" && value.trim() !== "") {
    date = new Date(value);
  }

  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Brings a section result from the server into the `SectionResult` shape.
 * The server leaves out null fields, so a missing `data` or `errorCode`
 * becomes `null`.
 */
export function normalizeSectionResult(raw: unknown): SectionResult {
  const record = isPlainObject(raw) ? raw : {};

  return {
    sectionId: record.sectionId as SectionId,
    status: record.status as SectionStatus,
    collectedAt: normalizeCollectedAt(record.collectedAt),
    data: isPlainObject(record.data) ? record.data : null,
    errorCode: typeof record.errorCode === "string" ? record.errorCode : null,
  };
}

interface ResponseLike {
  responseMeta?: { success?: boolean; status?: number };
}

/**
 * The Api client resolves error responses that carry a `responseMeta`, so a
 * failed call is a resolved response whose `responseMeta.success` is not true.
 */
export function isFailure(response?: ResponseLike | null): boolean {
  return response?.responseMeta?.success !== true;
}

export function responseStatus(
  response?: ResponseLike | null,
): number | undefined {
  return response?.responseMeta?.status;
}
