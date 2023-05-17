import { reduxToUI } from "./reduxToUI";
import type { AuditLogType } from "../types";
import { sampleLogsFromRedux } from "./sampleLogs";

describe("audit-logs/utils/reduxToUI", () => {
  it("removes isOpen from the logs", () => {
    const logs = [...sampleLogsFromRedux];
    logs.forEach((log) => {
      const actualKeys = Object.keys(reduxToUI(log as unknown as AuditLogType));
      expect(actualKeys.includes("isOpen")).toBeFalsy();
    });
  });
  it("removes empty keys from the logs", () => {
    const logs = [...sampleLogsFromRedux];
    const expectedKeys: string[][] = [
      [],
      ["event"],
      [
        "event",
        "timestamp",
        "id",
        "application",
        "workspace",
        "user",
        "resource",
        "metadata",
      ],
      [
        "event",
        "timestamp",
        "id",
        "application",
        "workspace",
        "user",
        "resource",
        "metadata",
        "page",
      ],
      [
        "event",
        "timestamp",
        "id",
        "application",
        "workspace",
        "user",
        "resource",
        "metadata",
      ],
      [
        "event",
        "timestamp",
        "id",
        "application",
        "workspace",
        "user",
        "resource",
        "metadata",
      ],
      ["event", "timestamp", "id", "workspace", "user", "resource", "metadata"],
      [
        "event",
        "timestamp",
        "id",
        "application",
        "workspace",
        "user",
        "resource",
        "metadata",
      ],
      [
        "event",
        "timestamp",
        "id",
        "application",
        "workspace",
        "user",
        "resource",
        "metadata",
      ],
      ["event", "timestamp", "id", "workspace", "user", "resource", "metadata"],
      ["event", "timestamp", "id", "workspace", "user", "resource", "metadata"],
      ["event", "timestamp", "id", "workspace", "user", "resource", "metadata"],
      ["event", "timestamp", "id", "workspace", "user", "resource", "metadata"],
      [
        "event",
        "timestamp",
        "id",
        "application",
        "workspace",
        "user",
        "resource",
        "metadata",
      ],
      ["event", "timestamp", "id", "user", "resource", "metadata"],
      ["event", "timestamp", "id", "user", "metadata"],
      ["event", "timestamp", "id", "user", "metadata"],
      ["event", "timestamp", "id", "workspace", "user", "resource", "metadata"],
      ["event", "timestamp", "id", "workspace", "user", "resource", "metadata"],
      ["event", "timestamp", "id", "workspace"],
      ["authentication", "event", "id", "metadata", "timestamp", "user"],
    ];
    logs.forEach((log, index) => {
      const actualKeys = Object.keys(reduxToUI(log as unknown as AuditLogType));
      expect(actualKeys).toEqual(expectedKeys[index] || []);
    });
  });
});
