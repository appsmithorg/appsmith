import { searchFiltersToUrl } from "./searchFiltersToUrl";
import type { AuditLogsFiltersReduxState } from "../../../reducers/auditLogsReducer";
import { DATE_SORT_ORDER } from "../../../reducers/auditLogsReducer";

describe("audit-logs/utils/searchFiltersToUrl", () => {
  it("returns empty url", () => {
    const searchFilters = {} as AuditLogsFiltersReduxState;
    const actual = searchFiltersToUrl(searchFilters);
    const expected = "";
    expect(actual).toEqual(expected);
  });
  it("returns proper url from complete searchFilters Object", () => {
    const searchFilters = {
      selectedEmails: [
        {
          id: "user@appsmith.com",
          label: "user@appsmith.com",
          value: "user@appsmith.com",
        },
      ],
      selectedEvents: [
        {
          id: "page.created",
          label: "Page created",
          value: "page.created",
        },
        {
          id: "group.created",
          label: "Group created",
          value: "group.created",
        },
      ],
      startDate: 12345,
      endDate: 56789,
      dateSortOrder: DATE_SORT_ORDER.DESC,
      resourceId: "631f13d6a9521f0a85fe8c32",
    };
    const actual = searchFiltersToUrl(searchFilters);
    const expected =
      "?emails=user@appsmith.com&events=page.created,group.created&resourceId=631f13d6a9521f0a85fe8c32&sort=DESC&startDate=12345&endDate=56789";
    expect(actual).toEqual(expected);
  });
  it("returns proper url from incomplete (non email, non days) searchFilters Object", () => {
    const searchFilters = {
      selectedEmails: [],
      selectedEvents: [
        {
          id: "page.created",
          label: "Page created",
          value: "page.created",
        },
        {
          id: "group.created",
          label: "Group created",
          value: "group.created",
        },
      ],
      startDate: 0,
      endDate: 0,
      dateSortOrder: DATE_SORT_ORDER.DESC,
      resourceId: "631f13d6a9521f0a85fe8c32",
    };
    const actual = searchFiltersToUrl(searchFilters);
    const expected =
      "?events=page.created,group.created&resourceId=631f13d6a9521f0a85fe8c32&sort=DESC";
    expect(actual).toEqual(expected);
  });

  it("returns proper url only from dateSortOrder", () => {
    const searchFilters = {
      selectedEmails: [],
      selectedEvents: [],
      startDate: 0,
      endDate: 0,
      dateSortOrder: DATE_SORT_ORDER.DESC,
      resourceId: "",
    };
    const actual = searchFiltersToUrl(searchFilters);
    const expected = "?sort=DESC";
    expect(actual).toEqual(expected);
  });
});
