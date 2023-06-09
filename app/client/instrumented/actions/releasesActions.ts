function cov_z5w2rask4() {
  var path = "/Users/apple/github/appsmith/app/client/src/actions/releasesActions.ts";
  var hash = "161ff0807d87484324636c9bbd592179e4536ffc";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/actions/releasesActions.ts",
    statementMap: {
      "0": {
        start: {
          line: 3,
          column: 34
        },
        end: {
          line: 5,
          column: 2
        }
      },
      "1": {
        start: {
          line: 3,
          column: 41
        },
        end: {
          line: 5,
          column: 1
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 3,
            column: 34
          },
          end: {
            line: 3,
            column: 35
          }
        },
        loc: {
          start: {
            line: 3,
            column: 41
          },
          end: {
            line: 5,
            column: 1
          }
        },
        line: 3
      }
    },
    branchMap: {},
    s: {
      "0": 0,
      "1": 0
    },
    f: {
      "0": 0
    },
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "161ff0807d87484324636c9bbd592179e4536ffc"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_z5w2rask4 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_z5w2rask4();
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
cov_z5w2rask4().s[0]++;
export const resetReleasesCount = () => {
  cov_z5w2rask4().f[0]++;
  cov_z5w2rask4().s[1]++;
  return {
    type: ReduxActionTypes.RESET_UNREAD_RELEASES_COUNT
  };
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfejV3MnJhc2s0IiwiYWN0dWFsQ292ZXJhZ2UiLCJSZWR1eEFjdGlvblR5cGVzIiwicyIsInJlc2V0UmVsZWFzZXNDb3VudCIsImYiLCJ0eXBlIiwiUkVTRVRfVU5SRUFEX1JFTEVBU0VTX0NPVU5UIl0sInNvdXJjZXMiOlsicmVsZWFzZXNBY3Rpb25zLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFJlZHV4QWN0aW9uVHlwZXMgfSBmcm9tIFwiQGFwcHNtaXRoL2NvbnN0YW50cy9SZWR1eEFjdGlvbkNvbnN0YW50c1wiO1xuXG5leHBvcnQgY29uc3QgcmVzZXRSZWxlYXNlc0NvdW50ID0gKCkgPT4gKHtcbiAgdHlwZTogUmVkdXhBY3Rpb25UeXBlcy5SRVNFVF9VTlJFQURfUkVMRUFTRVNfQ09VTlQsXG59KTtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGFBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGFBQUE7QUFmWixTQUFTRSxnQkFBZ0IsUUFBUSwwQ0FBMEM7QUFBQ0YsYUFBQSxHQUFBRyxDQUFBO0FBRTVFLE9BQU8sTUFBTUMsa0JBQWtCLEdBQUdBLENBQUEsS0FBTztFQUFBSixhQUFBLEdBQUFLLENBQUE7RUFBQUwsYUFBQSxHQUFBRyxDQUFBO0VBQUE7SUFDdkNHLElBQUksRUFBRUosZ0JBQWdCLENBQUNLO0VBQ3pCLENBQUM7QUFBRCxDQUFFIn0=