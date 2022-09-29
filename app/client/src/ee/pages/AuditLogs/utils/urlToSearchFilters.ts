import { sanitiseSearchParamString } from "./sanitiseSearchParamString";
import { DropdownOption } from "design-system";
import { toDate, toEvent, toUserEmail } from "./toDropdownOption";

/**
 * urlToSearchFilters takes search params of an url to build searchFilters for AuditLogs
 * @param search {string} Search param string of an URL
 */
export function urlToSearchFilters(search: string) {
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

      const values = nonEmptyValues.map(
        (value: string): DropdownOption => {
          switch (key) {
            case "days":
              return toDate(value);
            case "emails":
              return toUserEmail(value);
            case "events":
              return toEvent(value);
            default:
              return {
                id: value,
                value: value,
                label: value,
              } as DropdownOption;
          }
        },
      );
      return { key, values };
    })
    .reduce(
      (
        a: Record<string, DropdownOption[]>,
        c: { key: string; values: DropdownOption[] },
      ) => {
        if (c.key.length > 0) {
          a[c.key] = c.values;
        }
        return a;
      },
      {},
    );
}
