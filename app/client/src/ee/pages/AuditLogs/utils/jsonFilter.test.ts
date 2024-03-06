import { getJsonFilterData } from "./jsonFilter";
import type { AuditLogType } from "../types";

describe("audit-logs/utils/jsonFilter", function () {
  describe("getJsonFilterData", () => {
    it("returns three json filters", function () {
      const input = {
        event: "application.imported",
        timestamp: "01/09/2022, 16:29:59",
        id: "631090af90dbd1242bbecf20",
        application: {},
        workspace: {
          id: "630855514b5d6a0c34890dbe",
          name: "Untitled workspace 1",
        },
        user: {
          id: "630853ba4b5d6a0c34890d61",
          email: "tester@appsmith.com",
          name: "tester@appsmith.com",
        },
        resource: {
          id: "631090af90dbd1242bbecf0a",
          type: "application",
          name: "A Named App?",
        },
        metadata: {
          appsmithVersion: "UNKNOWN",
        },
      };
      const actual = getJsonFilterData(input as unknown as AuditLogType);
      const expected = [
        { key: "event", value: "application.imported" },
        {
          key: "email",
          value: "tester@appsmith.com",
        },
        { key: "resource.id", value: "631090af90dbd1242bbecf0a" },
      ];
      expect(actual).toEqual(expected);
    });

    it("returns only email and event json filters", function () {
      const input = {
        event: "application.imported",
        timestamp: "01/09/2022, 16:29:59",
        id: "631090af90dbd1242bbecf20",
        application: {},
        user: {
          id: "630853ba4b5d6a0c34890d61",
          email: "tester@appsmith.com",
          name: "tester@appsmith.com",
        },
      };
      const actual = getJsonFilterData(input as unknown as AuditLogType);
      const expected = [
        { key: "event", value: "application.imported" },
        {
          key: "email",
          value: "tester@appsmith.com",
        },
      ];
      expect(actual).toEqual(expected);
    });
    it("doesn't return empty value objects", () => {
      const input = {
        event: "",
        timestamp: "01/09/2022, 16:29:59",
        id: "631090af90dbd1242bbecf20",
        application: {},
        user: {
          id: "630853ba4b5d6a0c34890d61",
          email: "",
          name: "tester@appsmith.com",
        },
      };
      const actual = getJsonFilterData(input as unknown as AuditLogType);
      const expected: any[] = [];
      expect(actual).toEqual(expected);
    });
    it("returns no json filters", function () {
      const input = {};
      const actual = getJsonFilterData(input as unknown as AuditLogType);
      const expected: { key: string; value: string }[] = [];
      expect(actual).toEqual(expected);
    });
  });
});
