import { EVENT_ICON_MAP } from "./icons";

describe("audit-logs/utils/icons", () => {
  it("EVENT_ICON_MAP has 22, known keys", () => {
    const actualKeys = Object.keys(EVENT_ICON_MAP);
    const expectedKeys = [
      "cloned",
      "copied",
      "created",
      "deleted",
      "deployed",
      "duplicated",
      "executed",
      "exported",
      "forked",
      "imported",
      "invited",
      "logged_in",
      "logged_out",
      "signed_up",
      "updated",
      "viewed",
      "invite_users",
      "remove_users",
      "assigned_users",
      "unassigned_users",
      "assigned_groups",
      "unassigned_groups",
    ];
    expect(actualKeys).toEqual(expectedKeys);
    expect(actualKeys.length).toEqual(22);
  });
});
