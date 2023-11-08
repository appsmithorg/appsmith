import { dbToLogs } from "./dbToLogs";
import { sampleLogsFromDB } from "./sampleLogs";

describe("audit-logs/utils/dbToLogs", function () {
  it("returns proper object as expected", () => {
    const actual = dbToLogs(sampleLogsFromDB);
    const expected: any[] = [
      {
        application: {},
        authentication: {},
        event: ".",
        id: -1,
        instanceSettings: [],
        invitedUsers: [],
        metadata: {},
        page: {},
        resource: {},
        environment: {},
        datasource: {},
        timestamp: "Invalid Date",
        user: {},
        userGroup: {},
        permissionGroup: {},
        userPermissions: [],
        workspace: {},
        license: {},
      },
      {
        application: {},
        authentication: {},
        event: "plain.wrong",
        id: -1,
        instanceSettings: [],
        invitedUsers: [],
        metadata: {},
        page: {},
        resource: {},
        environment: {},
        datasource: {},
        timestamp: "Invalid Date",
        user: {},
        userGroup: {},
        permissionGroup: {},
        userPermissions: [],
        workspace: {},
        license: {},
      },
    ];
    expect(actual).toEqual(expected);
  });
});
