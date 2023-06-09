function cov_lrhojiq8l() {
  var path = "/Users/apple/github/appsmith/app/client/src/utils/editor/EditorUtils.ts";
  var hash = "9b1387108aeeb21c99f679305559062a7cefb9db";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/utils/editor/EditorUtils.ts",
    statementMap: {
      "0": {
        start: {
          line: 4,
          column: 33
        },
        end: {
          line: 10,
          column: 1
        }
      },
      "1": {
        start: {
          line: 5,
          column: 2
        },
        end: {
          line: 5,
          column: 20
        }
      },
      "2": {
        start: {
          line: 6,
          column: 2
        },
        end: {
          line: 6,
          column: 60
        }
      },
      "3": {
        start: {
          line: 8,
          column: 30
        },
        end: {
          line: 8,
          column: 61
        }
      },
      "4": {
        start: {
          line: 9,
          column: 2
        },
        end: {
          line: 9,
          column: 42
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 4,
            column: 33
          },
          end: {
            line: 4,
            column: 34
          }
        },
        loc: {
          start: {
            line: 4,
            column: 45
          },
          end: {
            line: 10,
            column: 1
          }
        },
        line: 4
      }
    },
    branchMap: {},
    s: {
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0
    },
    f: {
      "0": 0
    },
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "9b1387108aeeb21c99f679305559062a7cefb9db"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_lrhojiq8l = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_lrhojiq8l();
import { registerWidgets } from "../WidgetRegistry";
import PropertyControlRegistry from "../PropertyControlRegistry";
cov_lrhojiq8l().s[0]++;
export const editorInitializer = async () => {
  cov_lrhojiq8l().f[0]++;
  cov_lrhojiq8l().s[1]++;
  registerWidgets();
  cov_lrhojiq8l().s[2]++;
  PropertyControlRegistry.registerPropertyControlBuilders();
  const {
    default: moment
  } = (cov_lrhojiq8l().s[3]++, await import("moment-timezone"));
  cov_lrhojiq8l().s[4]++;
  moment.tz.setDefault(moment.tz.guess());
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfbHJob2ppcThsIiwiYWN0dWFsQ292ZXJhZ2UiLCJyZWdpc3RlcldpZGdldHMiLCJQcm9wZXJ0eUNvbnRyb2xSZWdpc3RyeSIsInMiLCJlZGl0b3JJbml0aWFsaXplciIsImYiLCJyZWdpc3RlclByb3BlcnR5Q29udHJvbEJ1aWxkZXJzIiwiZGVmYXVsdCIsIm1vbWVudCIsInR6Iiwic2V0RGVmYXVsdCIsImd1ZXNzIl0sInNvdXJjZXMiOlsiRWRpdG9yVXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVnaXN0ZXJXaWRnZXRzIH0gZnJvbSBcIi4uL1dpZGdldFJlZ2lzdHJ5XCI7XG5pbXBvcnQgUHJvcGVydHlDb250cm9sUmVnaXN0cnkgZnJvbSBcIi4uL1Byb3BlcnR5Q29udHJvbFJlZ2lzdHJ5XCI7XG5cbmV4cG9ydCBjb25zdCBlZGl0b3JJbml0aWFsaXplciA9IGFzeW5jICgpID0+IHtcbiAgcmVnaXN0ZXJXaWRnZXRzKCk7XG4gIFByb3BlcnR5Q29udHJvbFJlZ2lzdHJ5LnJlZ2lzdGVyUHJvcGVydHlDb250cm9sQnVpbGRlcnMoKTtcblxuICBjb25zdCB7IGRlZmF1bHQ6IG1vbWVudCB9ID0gYXdhaXQgaW1wb3J0KFwibW9tZW50LXRpbWV6b25lXCIpO1xuICBtb21lbnQudHouc2V0RGVmYXVsdChtb21lbnQudHouZ3Vlc3MoKSk7XG59O1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsYUFBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsYUFBQTtBQWZaLFNBQVNFLGVBQWUsUUFBUSxtQkFBbUI7QUFDbkQsT0FBT0MsdUJBQXVCLE1BQU0sNEJBQTRCO0FBQUNILGFBQUEsR0FBQUksQ0FBQTtBQUVqRSxPQUFPLE1BQU1DLGlCQUFpQixHQUFHLE1BQUFBLENBQUEsS0FBWTtFQUFBTCxhQUFBLEdBQUFNLENBQUE7RUFBQU4sYUFBQSxHQUFBSSxDQUFBO0VBQzNDRixlQUFlLENBQUMsQ0FBQztFQUFDRixhQUFBLEdBQUFJLENBQUE7RUFDbEJELHVCQUF1QixDQUFDSSwrQkFBK0IsQ0FBQyxDQUFDO0VBRXpELE1BQU07SUFBRUMsT0FBTyxFQUFFQztFQUFPLENBQUMsSUFBQVQsYUFBQSxHQUFBSSxDQUFBLE9BQUcsTUFBTSxNQUFNLENBQUMsaUJBQWlCLENBQUM7RUFBQ0osYUFBQSxHQUFBSSxDQUFBO0VBQzVESyxNQUFNLENBQUNDLEVBQUUsQ0FBQ0MsVUFBVSxDQUFDRixNQUFNLENBQUNDLEVBQUUsQ0FBQ0UsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUN6QyxDQUFDIn0=