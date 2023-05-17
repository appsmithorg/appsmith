import { sanitiseSearchParamString } from "./sanitiseSearchParamString";
import type { DATE_SORT_ORDER } from "@appsmith/reducers/auditLogsReducer";

export type SearchFilters = {
  emails?: string[];
  events?: string[];
  resourceId?: string[];
  sort?: DATE_SORT_ORDER[];
  startDate?: number[];
  endDate?: number[];
};

/**
 * urlToSearchFilters takes search params of an url to build searchFilters for AuditLogs
 * @param search {string} Search param string of an URL
 */
export function urlToSearchFilters(search: string): SearchFilters {
  if (!search || search.length === 0) {
    return {};
  }
  const sanitisedSearch = sanitiseSearchParamString(search);
  return sanitisedSearch
    .split("&")
    .filter((x) => x.includes("="))
    .map((each: string) => each.split("="))
    .map(([key, maybeValues]) => {
      const listedValues = maybeValues.includes(",")
        ? maybeValues.split(",")
        : [maybeValues];

      const nonEmptyValues = listedValues.filter((x) => x.length > 0);

      const values = nonEmptyValues.map((value: string): string | number => {
        switch (key) {
          case "startDate":
            return parseInt(value, 10);
          case "endDate":
            return parseInt(value, 10);
          default:
            return value;
        }
      });
      return { key, values };
    })
    .reduce(
      (
        a: Record<string, (string | number)[]>,
        c: { key: string; values: (string | number)[] },
      ) => {
        if (c.key.length > 0) {
          a[c.key] = c.values;
        }
        return a;
      },
      {},
    );
}
