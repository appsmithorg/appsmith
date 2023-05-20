import type { DropdownOptionProps } from "../types";
import { splitJoin } from "./splitJoin";
import { titleCase } from "./titleCase";

/**
 * toDropdownOption Takes a value to generate minimal DropdownOptionProps for our use-case.
 * @param {string} value
 * @returns {DropdownOptionProps} The bare minimum data structure
 * that we need with value being only value for all keys.
 */
export function toDropdownOption(value: string): DropdownOptionProps {
  if (value.length === 0) {
    return {};
  }
  return {
    key: value,
    value,
    label: value,
  };
}

export const toUserEmail = toDropdownOption;

/**
 * toEvent takes a single event type string and returns the readable, filter datum
 * @param value {string} the event type value
 * @returns {DropdownOptionProps} The readable filter datum
 *
 * @example
 * user.logged_in => User logged in
 *
 * @example
 * application.updated => Application updated
 */
export function toEvent(value: string): DropdownOptionProps {
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
    key: value,
    value,
    label,
  };
}

/**
 * toDate takes a number in string format and returns DropdownOptionProps value for Date filter for audit-logs
 * @param {string} value A number in the form of string.
 * This is called when we are reading URL for populating search filters. OR
 * Whenever we want to make a date filter (DropdownOptionProps) value from a string.
 * @returns {DropdownOptionProps}
 */
export function toDate(value: string): DropdownOptionProps {
  if (value.length === 0) {
    return {};
  }
  const defaultValue = { label: "Select", value: "0", key: "no-value" };
  switch (value) {
    case "0":
      return defaultValue;
    case "1":
      return { label: "Today", value, key: "today" };
    case "2":
      return { label: "Yesterday", value, key: "yesterday" };
    case "8":
      return { label: "Last 7 days", value, key: "last-7" };
    case "31":
      return { label: "Last 30 days", value, key: "last-30" };
    default:
      return defaultValue;
  }
}
