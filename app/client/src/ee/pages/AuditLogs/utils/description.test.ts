import { sampleLogsFromRedux } from "./sampleLogs";
import type { IconisedDescription } from "./description";
import { iconisedDescription } from "./description";
import type { AuditLogType } from "../types";

describe("audit-logs/utils/description", function () {
  describe("iconisedDescription", () => {
    it("returns proper description with correct icons", function () {
      const logs = [...sampleLogsFromRedux] as AuditLogType[];
      const actual = logs.map((log) => iconisedDescription(log));
      const expected: IconisedDescription[] = [
        {
          description: {
            mainDescription: {
              resourceType: "",
              actionType: "",
            },
            subDescription: "",
          },
          hasDescriptiveIcon: false,
          icon: ["", ""],
        },
        {
          description: {
            mainDescription: {
              resourceType: "Plain",
              actionType: "wrong",
            },
            subDescription: "",
          },
          hasDescriptiveIcon: false,
          icon: ["", ""],
        },
        {
          description: {
            mainDescription: {
              resourceType: "🤓🤓🤓",
              actionType: "updated",
            },
            subDescription: "in 🤓🤓",
          },
          hasDescriptiveIcon: true,
          icon: ["edit-box-line", ""],
        },
        {
          description: {
            mainDescription: {
              resourceType: "myFun1",
              actionType: "updated",
            },
            subDescription: "in some page",
          },
          hasDescriptiveIcon: true,
          icon: ["edit-box-line", ""],
        },
        {
          description: {
            mainDescription: {
              resourceType: "myFun2",
              actionType: "deleted",
            },
            subDescription: "in (No page)",
          },
          hasDescriptiveIcon: true,
          icon: ["delete", "var(--ads-v2-color-fg-error)"],
        },
        {
          description: {
            mainDescription: {
              resourceType: "myFun1",
              actionType: "created",
            },
            subDescription: "in (No page)",
          },
          hasDescriptiveIcon: true,
          icon: ["add-box-line", ""],
        },
        {
          description: {
            mainDescription: {
              resourceType: "Duplicated (1) Copy",
              actionType: "cloned",
            },
            subDescription: "in Untitled workspace 5",
          },
          hasDescriptiveIcon: true,
          icon: ["duplicate", ""],
        },
        {
          description: {
            mainDescription: {
              resourceType: "Page4",
              actionType: "updated",
            },
            subDescription: "in Duplicated (1) Copy",
          },
          hasDescriptiveIcon: true,
          icon: ["edit-box-line", ""],
        },
        {
          description: {
            mainDescription: {
              resourceType: "Page8",
              actionType: "created",
            },
            subDescription: "in Duplicated (1) Copy",
          },
          hasDescriptiveIcon: true,
          icon: ["add-box-line", ""],
        },
        {
          description: {
            mainDescription: {
              resourceType: "Duplicated (1) Copy",
              actionType: "created",
            },
            subDescription: "in Untitled workspace 5",
          },
          hasDescriptiveIcon: true,
          icon: ["add-box-line", ""],
        },
        {
          description: {
            mainDescription: {
              resourceType: "Duplicated (1)",
              actionType: "forked",
            },
            subDescription: "from Untitled workspace 5 to DestinationWorkspace",
          },
          hasDescriptiveIcon: true,
          icon: ["fork-2", ""],
        },
        {
          description: {
            mainDescription: {
              resourceType: "Duplicated",
              actionType: "updated",
            },
            subDescription: "in Untitled workspace 5",
          },
          hasDescriptiveIcon: true,
          icon: ["edit-box-line", ""],
        },
        {
          description: {
            mainDescription: {
              resourceType: "Hacks (1)",
              actionType: "deleted",
            },
            subDescription: "in Untitled workspace 3",
          },
          hasDescriptiveIcon: true,
          icon: ["delete", "var(--ads-v2-color-fg-error)"],
        },
        {
          description: {
            mainDescription: {
              resourceType: "Page7",
              actionType: "deleted",
            },
            subDescription: "in RenamedApplication",
          },
          hasDescriptiveIcon: true,
          icon: ["delete", "var(--ads-v2-color-fg-error)"],
        },
        {
          description: {
            mainDescription: {
              resourceType: "Untitled workspace 6",
              actionType: "created",
            },
            subDescription: "",
          },
          hasDescriptiveIcon: true,
          icon: ["add-box-line", ""],
        },
        {
          description: {
            mainDescription: {
              resourceType: "a8@appsmith.com",
              actionType: "logged in",
            },
            subDescription: "",
          },
          hasDescriptiveIcon: true,
          icon: ["login", ""],
        },
        {
          description: {
            mainDescription: {
              resourceType: "tester@appsmith.com",
              actionType: "logged out",
            },
            subDescription: "",
          },
          hasDescriptiveIcon: true,
          icon: ["logout", ""],
        },
        {
          description: {
            mainDescription: {
              resourceType: "A Named App?",
              actionType: "imported",
            },
            subDescription: "to Untitled workspace 1",
          },
          hasDescriptiveIcon: true,
          icon: ["upload-line", ""],
        },
        {
          description: {
            mainDescription: {
              resourceType: "Users",
              actionType: "created",
            },
            subDescription: "in Untitled workspace 2",
          },
          hasDescriptiveIcon: true,
          icon: ["add-box-line", ""],
        },
        {
          description: {
            mainDescription: {
              resourceType: "(No resource)",
              actionType: "created",
            },
            subDescription: "in Untitled workspace 2",
          },
          hasDescriptiveIcon: true,
          icon: ["add-box-line", ""],
        },
        {
          description: {
            mainDescription: {
              resourceType: "Google authentication",
              actionType: "added",
            },
            subDescription: "",
          },
          hasDescriptiveIcon: true,
          icon: ["edit-box-line", ""],
        },
      ];
      expect(actual).toEqual(expected);
    });
  });
});
