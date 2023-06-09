function cov_gh15x1vt9() {
  var path = "/Users/apple/github/appsmith/app/client/src/mocks/browser.ts";
  var hash = "9d94c064ae92c65f58f2501895365fcc8b444297";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/mocks/browser.ts",
    statementMap: {
      "0": {
        start: {
          line: 4,
          column: 22
        },
        end: {
          line: 4,
          column: 46
        }
      }
    },
    fnMap: {},
    branchMap: {},
    s: {
      "0": 0
    },
    f: {},
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "9d94c064ae92c65f58f2501895365fcc8b444297"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_gh15x1vt9 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_gh15x1vt9();
import { setupWorker } from "msw";
import { handlers } from "@appsmith/mocks/handlers";
export const worker = (cov_gh15x1vt9().s[0]++, setupWorker(...handlers));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfZ2gxNXgxdnQ5IiwiYWN0dWFsQ292ZXJhZ2UiLCJzZXR1cFdvcmtlciIsImhhbmRsZXJzIiwid29ya2VyIiwicyJdLCJzb3VyY2VzIjpbImJyb3dzZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgc2V0dXBXb3JrZXIgfSBmcm9tIFwibXN3XCI7XG5pbXBvcnQgeyBoYW5kbGVycyB9IGZyb20gXCJAYXBwc21pdGgvbW9ja3MvaGFuZGxlcnNcIjtcblxuZXhwb3J0IGNvbnN0IHdvcmtlciA9IHNldHVwV29ya2VyKC4uLmhhbmRsZXJzKTtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxhQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxhQUFBO0FBZlosU0FBU0UsV0FBVyxRQUFRLEtBQUs7QUFDakMsU0FBU0MsUUFBUSxRQUFRLDBCQUEwQjtBQUVuRCxPQUFPLE1BQU1DLE1BQU0sSUFBQUosYUFBQSxHQUFBSyxDQUFBLE9BQUdILFdBQVcsQ0FBQyxHQUFHQyxRQUFRLENBQUMifQ==