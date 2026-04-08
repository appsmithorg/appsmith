// Defined here (not imported from constants/WidgetConstants) to keep this file import-free and avoid circular dependencies.
export const DEFAULT_CONTENT_PADDING = "0";
const DEFAULT_PADDING_PX = 0;

/**
 * Parse a padding string (1–4 space-separated numbers, CSS shorthand) into [top, right, bottom, left] in px.
 * 1 value → all sides; 2 → vertical, horizontal; 3 → top, left-right, bottom; 4 → top, right, bottom, left.
 * Invalid or empty input returns fallback or [4,4,4,4].
 */
export function parseContentPadding(
  paddingStr: string | number | undefined | null,
  fallback?: [number, number, number, number],
): [number, number, number, number] {
  const raw =
    paddingStr != null && typeof paddingStr === "string"
      ? paddingStr
      : paddingStr != null
        ? String(paddingStr)
        : "";
  const str = raw.trim();

  if (!str) {
    return (
      fallback ?? [
        DEFAULT_PADDING_PX,
        DEFAULT_PADDING_PX,
        DEFAULT_PADDING_PX,
        DEFAULT_PADDING_PX,
      ]
    );
  }

  const tokens = str.split(/\s+/).map((t) => parseFloat(t));
  const valid = tokens.every((n) => !Number.isNaN(n) && n >= 0);

  if (!valid || tokens.length < 1 || tokens.length > 4) {
    return (
      fallback ?? [
        DEFAULT_PADDING_PX,
        DEFAULT_PADDING_PX,
        DEFAULT_PADDING_PX,
        DEFAULT_PADDING_PX,
      ]
    );
  }

  const [a, b, c, d] = tokens;

  switch (tokens.length) {
    case 1:
      return [a, a, a, a];
    case 2:
      return [a, b, a, b];
    case 3:
      return [a, b, c, b];
    case 4:
      return [a, b, c, d];
    default:
      return (
        fallback ?? [
          DEFAULT_PADDING_PX,
          DEFAULT_PADDING_PX,
          DEFAULT_PADDING_PX,
          DEFAULT_PADDING_PX,
        ]
      );
  }
}

/**
 * Validation for contentPadding property: 1–4 space-separated numbers (px), each >= 0.
 * Rejects empty tokens, non-numeric, negative, or wrong token count.
 * Used by Container and Form (and other container-like widgets) in property pane.
 */
export function contentPaddingValidation(
  value: unknown,
  _props?: Record<string, unknown>,
  _lodash?: unknown,
  _moment?: unknown,
  _propertyPath?: string,
  config?: { params?: { default?: string } },
): {
  isValid: boolean;
  parsed: string;
  messages?: Array<{ name: string; message: string }>;
} {
  const defaultPadding = config?.params?.default ?? "0";
  const str =
    value == null ? "" : typeof value === "string" ? value : String(value);
  const trimmed = str.trim();

  if (trimmed === "") {
    return { isValid: true, parsed: defaultPadding };
  }

  const tokens = trimmed.split(/\s+/).filter((t) => t.length > 0);

  if (tokens.length < 1 || tokens.length > 4) {
    return {
      isValid: false,
      parsed: defaultPadding,
      messages: [
        {
          name: "ValidationError",
          message:
            "Enter 1 to 4 space-separated numbers (e.g. 10 or 10 20 10 20)",
        },
      ],
    };
  }

  for (let i = 0; i < tokens.length; i++) {
    const n = parseFloat(tokens[i]);

    if (Number.isNaN(n) || n < 0) {
      return {
        isValid: false,
        parsed: defaultPadding,
        messages: [
          {
            name: "ValidationError",
            message: "Each value must be a non-negative number",
          },
        ],
      };
    }
  }

  return { isValid: true, parsed: trimmed };
}
