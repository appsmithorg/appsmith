import { NON_DIGIT_REGEX } from "./constants";

/**
 * Normalizes a measurement unit by removing non-digit characters and converting it to a number.
 */
export function normalizeMeasurement(unit: string) {
  return Number(unit.replace(NON_DIGIT_REGEX, ""));
}
