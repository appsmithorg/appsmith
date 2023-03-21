import { initialAuditLogsFilterState } from "../../../reducers/auditLogsReducer";
import { payloadToQueryParams } from "./payloadToQueryParams";

describe("audit-logs/utils/payloadToQueryParams", function () {
  it("returns empty object as expected", () => {
    const payload = { ...initialAuditLogsFilterState, cursor: "" };
    const actual = payloadToQueryParams(payload);
    const expected = {};
    expect(actual).toEqual(expected);
  });
  it("returns complete object on proper payload", () => {
    const payload: any = { ...initialAuditLogsFilterState, cursor: "" };
    payload.cursor = "whatever";
    payload.dateSortOrder = 1;
    payload.selectedEmails = [
      { value: "a@example.com" },
      { value: "b@example.com" },
    ];
    payload.selectedEvents = [
      { value: "some.events" },
      { value: "other.events" },
    ];
    payload.days = { value: "8" };
    payload.resourceId = "whatever";
    const actual = payloadToQueryParams(payload);
    const expected = {
      cursor: "whatever",
      emails: ["a@example.com", "b@example.com"],
      events: ["some.events", "other.events"],
      resourceId: "whatever",
      sortOrder: 1,
    };
    expect(actual).toStrictEqual(expected);
  });
});
