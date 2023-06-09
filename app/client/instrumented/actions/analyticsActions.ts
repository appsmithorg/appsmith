function cov_1t6yb5at3t() {
  var path = "/Users/apple/github/appsmith/app/client/src/actions/analyticsActions.ts";
  var hash = "9a4a6e0fe27636d4a8fa7a5bdd20017e18776c1d";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/actions/analyticsActions.ts",
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
      },
      "2": {
        start: {
          line: 7,
          column: 36
        },
        end: {
          line: 9,
          column: 2
        }
      },
      "3": {
        start: {
          line: 7,
          column: 43
        },
        end: {
          line: 9,
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
      },
      "1": {
        name: "(anonymous_1)",
        decl: {
          start: {
            line: 7,
            column: 36
          },
          end: {
            line: 7,
            column: 37
          }
        },
        loc: {
          start: {
            line: 7,
            column: 43
          },
          end: {
            line: 9,
            column: 1
          }
        },
        line: 7
      }
    },
    branchMap: {},
    s: {
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 0
    },
    f: {
      "0": 0,
      "1": 0
    },
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "9a4a6e0fe27636d4a8fa7a5bdd20017e18776c1d"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1t6yb5at3t = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1t6yb5at3t();
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
cov_1t6yb5at3t().s[0]++;
export const segmentInitSuccess = () => {
  cov_1t6yb5at3t().f[0]++;
  cov_1t6yb5at3t().s[1]++;
  return {
    type: ReduxActionTypes.SEGMENT_INITIALIZED
  };
};
cov_1t6yb5at3t().s[2]++;
export const segmentInitUncertain = () => {
  cov_1t6yb5at3t().f[1]++;
  cov_1t6yb5at3t().s[3]++;
  return {
    type: ReduxActionTypes.SEGMENT_INIT_UNCERTAIN
  };
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMXQ2eWI1YXQzdCIsImFjdHVhbENvdmVyYWdlIiwiUmVkdXhBY3Rpb25UeXBlcyIsInMiLCJzZWdtZW50SW5pdFN1Y2Nlc3MiLCJmIiwidHlwZSIsIlNFR01FTlRfSU5JVElBTElaRUQiLCJzZWdtZW50SW5pdFVuY2VydGFpbiIsIlNFR01FTlRfSU5JVF9VTkNFUlRBSU4iXSwic291cmNlcyI6WyJhbmFseXRpY3NBY3Rpb25zLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFJlZHV4QWN0aW9uVHlwZXMgfSBmcm9tIFwiQGFwcHNtaXRoL2NvbnN0YW50cy9SZWR1eEFjdGlvbkNvbnN0YW50c1wiO1xuXG5leHBvcnQgY29uc3Qgc2VnbWVudEluaXRTdWNjZXNzID0gKCkgPT4gKHtcbiAgdHlwZTogUmVkdXhBY3Rpb25UeXBlcy5TRUdNRU5UX0lOSVRJQUxJWkVELFxufSk7XG5cbmV4cG9ydCBjb25zdCBzZWdtZW50SW5pdFVuY2VydGFpbiA9ICgpID0+ICh7XG4gIHR5cGU6IFJlZHV4QWN0aW9uVHlwZXMuU0VHTUVOVF9JTklUX1VOQ0VSVEFJTixcbn0pO1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxjQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxjQUFBO0FBZlosU0FBU0UsZ0JBQWdCLFFBQVEsMENBQTBDO0FBQUNGLGNBQUEsR0FBQUcsQ0FBQTtBQUU1RSxPQUFPLE1BQU1DLGtCQUFrQixHQUFHQSxDQUFBLEtBQU87RUFBQUosY0FBQSxHQUFBSyxDQUFBO0VBQUFMLGNBQUEsR0FBQUcsQ0FBQTtFQUFBO0lBQ3ZDRyxJQUFJLEVBQUVKLGdCQUFnQixDQUFDSztFQUN6QixDQUFDO0FBQUQsQ0FBRTtBQUFDUCxjQUFBLEdBQUFHLENBQUE7QUFFSCxPQUFPLE1BQU1LLG9CQUFvQixHQUFHQSxDQUFBLEtBQU87RUFBQVIsY0FBQSxHQUFBSyxDQUFBO0VBQUFMLGNBQUEsR0FBQUcsQ0FBQTtFQUFBO0lBQ3pDRyxJQUFJLEVBQUVKLGdCQUFnQixDQUFDTztFQUN6QixDQUFDO0FBQUQsQ0FBRSJ9