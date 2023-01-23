import { DropdownOption } from "design-system-old";
import { splitJoin } from "./splitJoin";
import { titleCase } from "./titleCase";

/**
 * toDropdownOption Takes a value to generate minimal DropdownOption for our use-case.
 * @param {string} value
 * @returns {DropdownOption} The bare minimum data structure
 * that we need with value being only value for all keys.
 */
export function toDropdownOption(value: string): DropdownOption {
  if (value.length === 0) {
    return {};
  }
  return {
    id: value,
    value,
    label: value,
  };
}

export const toUserEmail = toDropdownOption;

/**
 * toEvent takes a single event type string and returns the readable, filter datum
 * @param value {string} the event type value
 * @returns {DropdownOption} The readable filter datum
 *
 * @example
 * user.logged_in => User logged in
 *
 * @example
 * application.updated => Application updated
 */
export function toEvent(value: string): DropdownOption {
  if (value.length === 0) {
    return {};
  }
  if (!value.includes(".")) {
    /* There are no events that don't have a dot in them */
    return toDropdownOption(value);
  }
  const [firstWord, ...rest] = value
    .split(".")
    .map((value) => splitJoin(value));
  const label = `${titleCase(firstWord)} ${rest.join(" ")}`;
  return {
    id: value,
    value,
    label,
  };
}

/**
 * toDate takes a number in string format and returns DropdownOption value for Date filter for audit-logs
 * @param {string} value A number in the form of string.
 * This is called when we are reading URL for populating search filters. OR
 * Whenever we want to make a date filter (DropdownOption) value from a string.
 * @returns {DropdownOption}
 */
export function toDate(value: string): DropdownOption {
  if (value.length === 0) {
    return {};
  }
  const defaultValue = { label: "Select", value: "0", id: "no-value" };
  switch (value) {
    case "0":
      return defaultValue;
    case "1":
      return { label: "Today", value, id: "today" };
    case "2":
      return { label: "Yesterday", value, id: "yesterday" };
    case "8":
      return { label: "Last 7 days", value, id: "last-7" };
    case "31":
      return { label: "Last 30 days", value, id: "last-30" };
    default:
      return defaultValue;
  }
}
