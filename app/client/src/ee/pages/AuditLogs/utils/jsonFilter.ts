import { AuditLogType } from "../types";
import { DropdownOption } from "design-system-old";

export const DATE_FILTER_OPTIONS: DropdownOption[] = [
  { label: "Select", value: "0", id: "no-value" },
  { label: "Today", value: "1", id: "today" },
  {
    label: "Yesterday",
    value: "2",
    id: "yesterday",
  },
  { label: "Last 7 days", value: "8", id: "last-7" },
  { label: "Last 30 days", value: "31", id: "last-30" },
];

export const JSON_FILTER_KEYS: (keyof AuditLogType | string)[] = [
  "event",
  "user.email",
  "resource.id",
];

export enum JSON_FILTER_KEYS_ENUM {
  email = "email",
  event = "event",
  "resource.id" = "resource.id",
}

export const JSON_FILTER_KEYS_MAP: Record<
  keyof AuditLogType | string,
  string
> = {
  "user.email": JSON_FILTER_KEYS_ENUM.email,
  event: JSON_FILTER_KEYS_ENUM.event,
  "resource.id": JSON_FILTER_KEYS_ENUM["resource.id"],
};

/**
 * getJsonFilterData takes a log and returns {key, value} pair.
 * @param log {AuditLogType}
 * @returns {{key: string, value: string}[]} array of values.
 * Falsy value records are filtered out.
 */
export function getJsonFilterData(
  log: AuditLogType,
): { key: string; value: string }[] {
  return JSON_FILTER_KEYS.map((k: string) => {
    return {
      k: k,
      v: k.includes(".")
        ? k.split(".").reduce((val: any, currentKey: string) => {
            return val ? val[currentKey] : "";
          }, log)
        : log[k as keyof AuditLogType],
    };
  })
    .map(({ k, v }: any) => {
      return {
        key: JSON_FILTER_KEYS_MAP[k],
        value: v,
      };
    })
    .filter(({ value }: { key: string; value: string }) => {
      return !!value;
    });
}
