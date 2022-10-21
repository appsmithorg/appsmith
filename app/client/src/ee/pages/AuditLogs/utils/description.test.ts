import { sampleLogsFromRedux } from "./sampleLogs";
import { IconisedDescription, iconisedDescription } from "./description";
import { AuditLogType } from "../types";

describe("audit-logs/utils/description", function() {
  describe("iconisedDescription", () => {
    it("returns proper description with correct icons", function() {
      const logs = [...sampleLogsFromRedux] as AuditLogType[];
      const actual = logs.map((log) => iconisedDescription(log));
      const expected: IconisedDescription[] = [
        {
          description: " ",
          hasDescriptiveIcon: false,
          icon: ["", ""],
        },
        {
          description: "Plain wrong",
          hasDescriptiveIcon: false,
          icon: ["", ""],
        },
        {
          description: "🤓🤓🤓 updated in 🤓🤓",
          hasDescriptiveIcon: true,
          icon: ["edit-box-line", ""],
        },
        {
          description: "myFun1 updated in some page",
          hasDescriptiveIcon: true,
          icon: ["edit-box-line", ""],
        },
        {
          description: "myFun2 deleted in (No page)",
          hasDescriptiveIcon: true,
          icon: ["delete", "#E32525"],
        },
        {
          description: "myFun1 created in (No page)",
          hasDescriptiveIcon: true,
          icon: ["add-box-line", ""],
        },
        {
          description: "Duplicated (1) Copy cloned in Untitled workspace 5",
          hasDescriptiveIcon: true,
          icon: ["duplicate", ""],
        },
        {
          description: "Page4 updated in Duplicated (1) Copy",
          hasDescriptiveIcon: true,
          icon: ["edit-box-line", ""],
        },
        {
          description: "Page8 created in Duplicated (1) Copy",
          hasDescriptiveIcon: true,
          icon: ["add-box-line", ""],
        },
        {
          description: "Duplicated (1) Copy created in Untitled workspace 5",
          hasDescriptiveIcon: true,
          icon: ["add-box-line", ""],
        },
        {
          description:
            "Duplicated (1) forked from Untitled workspace 5 to DestinationWorkspace",
          hasDescriptiveIcon: true,
          icon: ["fork-2", ""],
        },
        {
          description: "Duplicated updated in Untitled workspace 5",
          hasDescriptiveIcon: true,
          icon: ["edit-box-line", ""],
        },
        {
          description: "Hacks (1) deleted in Untitled workspace 3",
          hasDescriptiveIcon: true,
          icon: ["delete", "#E32525"],
        },
        {
          description: "Page7 deleted in RenamedApplication",
          hasDescriptiveIcon: true,
          icon: ["delete", "#E32525"],
        },
        {
          description: "Untitled workspace 6 created",
          hasDescriptiveIcon: true,
          icon: ["add-box-line", ""],
        },
        {
          description: "a8@appsmith.com logged in",
          hasDescriptiveIcon: true,
          icon: ["login", ""],
        },
        {
          description: "tester@appsmith.com logged out",
          hasDescriptiveIcon: true,
          icon: ["logout", ""],
        },
        {
          description: "A Named App? imported to Untitled workspace 1",
          hasDescriptiveIcon: true,
          icon: ["upload-line", ""],
        },
        {
          description: "Users created in Untitled workspace 2",
          hasDescriptiveIcon: true,
          icon: ["add-box-line", ""],
        },
        {
          description: "(No resource) created in Untitled workspace 2",
          hasDescriptiveIcon: true,
          icon: ["add-box-line", ""],
        },
        {
          description: "Google authentication added",
          hasDescriptiveIcon: true,
          icon: ["edit-box-line", ""],
        },
      ];
      expect(actual).toEqual(expected);
    });
  });
});
