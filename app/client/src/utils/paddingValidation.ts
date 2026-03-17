import type { ValidationResponse } from "constants/WidgetValidation";

/**
 * Shared validation for contentPadding-style properties.
 *
 * - Accepts 1–4 space-separated numbers (px), each >= 0
 * - Returns { isValid, parsed, messages? } in the shape expected by
 *   FUNCTION-type widget property validations.
 *
 * The default value is provided by the caller so different widgets
 * (e.g. JSON Form vs Container) can use different defaults.
 */
export function validatePaddingString(
  value: unknown,
  defaultValue: string,
): ValidationResponse {
  const raw =
    value == null ? "" : typeof value === "string" ? value : String(value);
  const trimmed = raw.trim();

  if (!trimmed) {
    return { isValid: true, parsed: defaultValue };
  }

  const tokens = trimmed.split(/\s+/).filter((t) => t.length > 0);

  if (tokens.length < 1 || tokens.length > 4) {
    return {
      isValid: false,
      parsed: defaultValue,
      messages: [
        {
          name: "ValidationError",
          message:
            "Enter 1 to 4 space-separated numbers (e.g. 10 or 10 20 10 20).",
        },
      ],
    };
  }

  for (const token of tokens) {
    const n = parseFloat(token);

    if (Number.isNaN(n) || n < 0) {
      return {
        isValid: false,
        parsed: defaultValue,
        messages: [
          {
            name: "ValidationError",
            message: "Each value must be a non-negative number.",
          },
        ],
      };
    }
  }

  return { isValid: true, parsed: trimmed };
}
