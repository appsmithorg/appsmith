import { objectKeys } from "@appsmith/utils";

export const ACRONYMS = [
  "ai",
  "mcp",
  "url",
  "id",
  "saml",
  "oidc",
  "scim",
  "jvm",
  "os",
  "cpu",
  "rts",
  "efs",
  "js",
  "sha",
  "llm",
  "ee",
  "ce",
];

export const LABEL_OVERRIDES: Record<string, string> = {
  osArch: "OS architecture",
  osName: "OS",
  javaVersion: "Java version",
};

/**
 * Map keys whose nested keys are identifiers (feature flag names, plugin types,
 * plugin package names, module types). Their nested keys show unchanged.
 */
export const RAW_KEY_MAPS = new Set<string>([
  "flags",
  "actionsByPluginType",
  "modulesByType",
  "datasourcesByPlugin",
  "referencedDatasourcesByPlugin",
  "aiDatasourcesByPlugin",
]);

const SENTINELS: Record<string, string> = {
  UNKNOWN: "Unknown",
  NOT_SUPPORTED: "Not supported",
  NOT_LICENSED: "Not licensed",
  NOT_APPLICABLE: "Not applicable",
  UNAVAILABLE: "Unavailable",
  other: "Other",
  UP: "Up",
  DOWN: "Down",
};

const SCREAMING_CASE = /^[A-Z0-9]+(_[A-Z0-9]+)*$/;

export function labelFor(key: string): string {
  if (Object.prototype.hasOwnProperty.call(LABEL_OVERRIDES, key)) {
    return LABEL_OVERRIDES[key];
  }

  if (SCREAMING_CASE.test(key)) return key;

  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());

  return words
    .map((word, index) => {
      if (ACRONYMS.includes(word)) return word.toUpperCase();

      return index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word;
    })
    .join(" ");
}

export type DisplayValue =
  | { kind: "text"; text: string }
  | { kind: "list"; entries: [string, DisplayValue][] };

function text(value: string): DisplayValue {
  return { kind: "text", text: value };
}

function isDeploymentField(
  value: Record<string, unknown>,
): value is Record<string, unknown> & { confidence: unknown } {
  return "value" in value && "source" in value && "confidence" in value;
}

export function formatValue(value: unknown, rawKeys = false): DisplayValue {
  if (value === null || value === undefined) return text(SENTINELS.UNKNOWN);

  if (typeof value === "boolean") return text(value ? "Yes" : "No");

  if (typeof value === "number") return text(value.toLocaleString("en-US"));

  if (typeof value === "string") {
    return text(
      Object.prototype.hasOwnProperty.call(SENTINELS, value)
        ? SENTINELS[value]
        : value,
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return text("None");

    return {
      kind: "list",
      entries: value.map((item, index): [string, DisplayValue] => [
        String(index + 1),
        formatValue(item),
      ]),
    };
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = objectKeys(record);

    if (keys.length === 0) return text("None");

    if (isDeploymentField(record)) {
      const shown = formatValue(record.value);
      const display = shown.kind === "text" ? shown.text : "";

      return text(`${display} (${String(record.confidence)})`);
    }

    return {
      kind: "list",
      entries: keys.map((key): [string, DisplayValue] => [
        rawKeys ? key : labelFor(key),
        formatValue(record[key], RAW_KEY_MAPS.has(key)),
      ]),
    };
  }

  return text(String(value));
}
