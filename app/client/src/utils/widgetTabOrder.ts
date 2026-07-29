/**
 * Shared helpers for the platform-level `tabOrder` widget property.
 *
 * A valid explicit tab order is a positive integer (1 is the earliest
 * explicit order, consistent with the property pane stepper). Anything else —
 * null, undefined, blank, zero, negative numbers, decimals, NaN, Infinity,
 * non-numeric strings — means "Auto" and must be ignored at runtime.
 */

/**
 * DOM attribute used to propagate a sanitized explicit tab order from a
 * widget wrapper to the custom tabbing logic in useWidgetFocus. The attribute
 * is only rendered for valid explicit values.
 */
export const TAB_ORDER_ATTRIBUTE = "data-tab-order";

/**
 * Returns the explicit tab order as a positive integer, or undefined
 * when the value is absent or invalid (i.e. the widget uses automatic order).
 */
export function sanitizeTabOrder(value: unknown): number | undefined {
  let parsed: number;

  if (typeof value === "number") {
    parsed = value;
  } else if (typeof value === "string") {
    if (value.trim() === "") return undefined;

    parsed = Number(value);
  } else {
    return undefined;
  }

  // Number.isInteger is false for NaN, Infinity and decimals
  if (!Number.isInteger(parsed) || parsed < 1) return undefined;

  return parsed;
}
