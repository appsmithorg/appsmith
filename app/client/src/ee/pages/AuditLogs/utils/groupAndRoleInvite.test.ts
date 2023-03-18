import type { MultilineDescription } from "./description";
import { getGroupandRoleActionDescription } from "./groupAndRoleInvite";

const getDescriptionFromDescObject = (obj: MultilineDescription) =>
  `${obj.mainDescription.resourceType} ${obj.mainDescription.actionType} ${obj.subDescription}`;

// Same as app/client/src/ee/pages/AuditLogs/utils/invited.test.ts for most part except this uses getGroupandRoleActionDescription
describe("audit-logs/utils/groupAndRoleInvite.ts", function () {
  it("returns empty string when no user was invited/removed", () => {
    const users: string[] = [];
    const descObj = getGroupandRoleActionDescription(
      { action: "invited", preposition: "to" },
      users,
      "group",
    );
    const actual = getDescriptionFromDescObject(descObj);
    const expected = `(No one was invited.) `;
    expect(actual).toEqual(expected);
  });
  it("returns proper description when length is 0", () => {
    const users: string[] = [];
    const descObj = getGroupandRoleActionDescription(
      { action: "invited", preposition: "to" },
      users,
      "group",
    );
    const actual = getDescriptionFromDescObject(descObj);
    const expected = `(No one was invited.) `;
    expect(actual).toEqual(expected);
  });
  it("returns proper description when length is 1", () => {
    const users: string[] = ["user@example.com"];
    const descObj = getGroupandRoleActionDescription(
      { action: "invited", preposition: "to" },
      users,
      "group",
    );
    const actual = getDescriptionFromDescObject(descObj);
    const expected = "user@example.com invited to group";
    expect(actual).toEqual(expected);
  });
  it("returns proper description when length is 2 (a sub case)", () => {
    const users: string[] = ["user@example.com", "other_user@example.com"];
    const descObj = getGroupandRoleActionDescription(
      { action: "invited", preposition: "to" },
      users,
      "group",
    );
    const actual = getDescriptionFromDescObject(descObj);
    const expected = "user@example.com and 1 more user invited to group";
    expect(actual).toEqual(expected);
  });
  it("returns proper description when length is more than 2 (a sub case)", () => {
    const users: string[] = [
      "user@example.com",
      "other_user@example.com",
      "yet_another@example.com",
    ];
    const descObj = getGroupandRoleActionDescription(
      { action: "associated", preposition: "to" },
      users,
      "role",
    );
    const actual = getDescriptionFromDescObject(descObj);
    const expected = "user@example.com and 2 more users associated to role";
    expect(actual).toEqual(expected);
  });
  it("returns proper description when a user/group removed from group/role", () => {
    const users: string[] = ["user@example.com"];
    const descObj = getGroupandRoleActionDescription(
      { action: "removed", preposition: "from" },
      users,
      "group",
    );
    const actual = getDescriptionFromDescObject(descObj);
    const expected = "user@example.com removed from group";
    expect(actual).toEqual(expected);
  });
});
