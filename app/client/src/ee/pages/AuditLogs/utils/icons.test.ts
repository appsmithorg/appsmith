import { EVENT_ICON_MAP } from "./icons";

describe("audit-logs/utils/icons", () => {
  it("EVENT_ICON_MAP has 16, known keys", () => {
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
    ];
    expect(actualKeys).toEqual(expectedKeys);
    expect(actualKeys.length).toEqual(16);
  });
});
