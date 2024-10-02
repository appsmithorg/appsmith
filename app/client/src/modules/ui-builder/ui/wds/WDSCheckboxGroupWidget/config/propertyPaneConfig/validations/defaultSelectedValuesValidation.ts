import type { ValidationResponse } from "constants/WidgetValidation";

export function defaultSelectedValuesValidation(
  value: unknown,
): ValidationResponse {
  let values: string[] = [];

  if (typeof value === "string") {
    try {
      values = JSON.parse(value);

      if (!Array.isArray(values)) {
        throw new Error();
      }
    } catch {
      values = value.length ? value.split(",") : [];

      if (values.length > 0) {
        values = values.map((_v: string) => _v.trim());
      }
    }
  }

  if (Array.isArray(value)) {
    values = Array.from(new Set(value));
  }

  return {
    isValid: true,
    parsed: values,
  };
}
