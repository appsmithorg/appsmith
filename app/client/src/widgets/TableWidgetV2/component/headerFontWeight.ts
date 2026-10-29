import type { ValidationResponse } from "constants/WidgetValidation";

export const HEADER_FONT_WEIGHT_DEFAULT = 700;

/**
 * Accepts a finite number from 1 to 1000, or the header weight keywords.
 * Anything else, including an unset value, resolves to 700 so existing
 * tables keep their bold headers.
 *
 * The body of this function is evaluated in the worker via toString(),
 * so every value it uses has to be declared inside the function.
 */
export function headerFontWeightValidation(value: unknown): ValidationResponse {
  const defaultWeight = 700;
  const keywords: Record<string, number> = {
    light: 300,
    normal: 400,
    regular: 400,
    medium: 500,
    semibold: 600,
    "semi-bold": 600,
    bold: 700,
  };
  const invalid = {
    isValid: false,
    parsed: defaultWeight,
    messages: [
      {
        name: "ValidationError",
        message:
          "Enter a number from 1 to 1000, or light, normal, regular, medium, semibold, semi-bold, or bold.",
      },
    ],
  };

  if (value === undefined || value === null) {
    return { isValid: true, parsed: defaultWeight, messages: [] };
  }

  if (typeof value === "number") {
    if (Number.isFinite(value) && value >= 1 && value <= 1000) {
      return { isValid: true, parsed: value, messages: [] };
    }

    return invalid;
  }

  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();

    if (trimmed === "") {
      return { isValid: true, parsed: defaultWeight, messages: [] };
    }

    if (Object.prototype.hasOwnProperty.call(keywords, trimmed)) {
      return { isValid: true, parsed: keywords[trimmed], messages: [] };
    }

    if (/^(?:\d+\.?\d*|\.\d+)$/.test(trimmed)) {
      const parsed = Number(trimmed);

      if (parsed >= 1 && parsed <= 1000) {
        return { isValid: true, parsed, messages: [] };
      }
    }
  }

  return invalid;
}

export function resolveHeaderFontWeight(value: unknown): number {
  const parsed = headerFontWeightValidation(value).parsed;

  return typeof parsed === "number" && Number.isFinite(parsed)
    ? parsed
    : HEADER_FONT_WEIGHT_DEFAULT;
}
