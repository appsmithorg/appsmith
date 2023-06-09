function cov_aq4me1r6o() {
  var path = "/Users/apple/github/appsmith/app/client/src/actions/authActions.ts";
  var hash = "77df9813fc48def60e2876d71e0b124b6d922e09";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/actions/authActions.ts",
    statementMap: {
      "0": {
        start: {
          line: 3,
          column: 30
        },
        end: {
          line: 5,
          column: 2
        }
      },
      "1": {
        start: {
          line: 3,
          column: 37
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
            column: 30
          },
          end: {
            line: 3,
            column: 31
          }
        },
        loc: {
          start: {
            line: 3,
            column: 37
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
    hash: "77df9813fc48def60e2876d71e0b124b6d922e09"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_aq4me1r6o = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_aq4me1r6o();
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
cov_aq4me1r6o().s[0]++;
export const getCurrentUser = () => {
  cov_aq4me1r6o().f[0]++;
  cov_aq4me1r6o().s[1]++;
  return {
    type: ReduxActionTypes.FETCH_USER_INIT
  };
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfYXE0bWUxcjZvIiwiYWN0dWFsQ292ZXJhZ2UiLCJSZWR1eEFjdGlvblR5cGVzIiwicyIsImdldEN1cnJlbnRVc2VyIiwiZiIsInR5cGUiLCJGRVRDSF9VU0VSX0lOSVQiXSwic291cmNlcyI6WyJhdXRoQWN0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBSZWR1eEFjdGlvblR5cGVzIH0gZnJvbSBcIkBhcHBzbWl0aC9jb25zdGFudHMvUmVkdXhBY3Rpb25Db25zdGFudHNcIjtcblxuZXhwb3J0IGNvbnN0IGdldEN1cnJlbnRVc2VyID0gKCkgPT4gKHtcbiAgdHlwZTogUmVkdXhBY3Rpb25UeXBlcy5GRVRDSF9VU0VSX0lOSVQsXG59KTtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGFBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGFBQUE7QUFmWixTQUFTRSxnQkFBZ0IsUUFBUSwwQ0FBMEM7QUFBQ0YsYUFBQSxHQUFBRyxDQUFBO0FBRTVFLE9BQU8sTUFBTUMsY0FBYyxHQUFHQSxDQUFBLEtBQU87RUFBQUosYUFBQSxHQUFBSyxDQUFBO0VBQUFMLGFBQUEsR0FBQUcsQ0FBQTtFQUFBO0lBQ25DRyxJQUFJLEVBQUVKLGdCQUFnQixDQUFDSztFQUN6QixDQUFDO0FBQUQsQ0FBRSJ9