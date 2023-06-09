function cov_2m2wvl3x19() {
  var path = "/Users/apple/github/appsmith/app/client/src/components/editorComponents/CodeEditor/utils/cursorLeftMovement.ts";
  var hash = "ae59c03fce2ca4b4bb74486054225e89e343b8c9";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/components/editorComponents/CodeEditor/utils/cursorLeftMovement.ts",
    statementMap: {
      "0": {
        start: {
          line: 4,
          column: 36
        },
        end: {
          line: 7,
          column: 1
        }
      },
      "1": {
        start: {
          line: 5,
          column: 21
        },
        end: {
          line: 5,
          column: 49
        }
      },
      "2": {
        start: {
          line: 6,
          column: 2
        },
        end: {
          line: 6,
          column: 71
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 4,
            column: 36
          },
          end: {
            line: 4,
            column: 37
          }
        },
        loc: {
          start: {
            line: 4,
            column: 42
          },
          end: {
            line: 7,
            column: 1
          }
        },
        line: 4
      }
    },
    branchMap: {
      "0": {
        loc: {
          start: {
            line: 5,
            column: 21
          },
          end: {
            line: 5,
            column: 49
          }
        },
        type: "binary-expr",
        locations: [{
          start: {
            line: 5,
            column: 21
          },
          end: {
            line: 5,
            column: 36
          }
        }, {
          start: {
            line: 5,
            column: 40
          },
          end: {
            line: 5,
            column: 49
          }
        }],
        line: 5
      }
    },
    s: {
      "0": 0,
      "1": 0,
      "2": 0
    },
    f: {
      "0": 0
    },
    b: {
      "0": [0, 0]
    },
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "ae59c03fce2ca4b4bb74486054225e89e343b8c9"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_2m2wvl3x19 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_2m2wvl3x19();
import { getPlatformOS } from "utils/helpers";
import { KEYBOARD_SHORTCUTS_BY_PLATFORM } from "./keyboardShortcutConstants";
cov_2m2wvl3x19().s[0]++;
export const getMoveCursorLeftKey = () => {
  cov_2m2wvl3x19().f[0]++;
  const platformOS = (cov_2m2wvl3x19().s[1]++, (cov_2m2wvl3x19().b[0][0]++, getPlatformOS()) || (cov_2m2wvl3x19().b[0][1]++, "default"));
  cov_2m2wvl3x19().s[2]++;
  return KEYBOARD_SHORTCUTS_BY_PLATFORM[platformOS].cursorLeftMovement;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMm0yd3ZsM3gxOSIsImFjdHVhbENvdmVyYWdlIiwiZ2V0UGxhdGZvcm1PUyIsIktFWUJPQVJEX1NIT1JUQ1VUU19CWV9QTEFURk9STSIsInMiLCJnZXRNb3ZlQ3Vyc29yTGVmdEtleSIsImYiLCJwbGF0Zm9ybU9TIiwiYiIsImN1cnNvckxlZnRNb3ZlbWVudCJdLCJzb3VyY2VzIjpbImN1cnNvckxlZnRNb3ZlbWVudC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBnZXRQbGF0Zm9ybU9TIH0gZnJvbSBcInV0aWxzL2hlbHBlcnNcIjtcbmltcG9ydCB7IEtFWUJPQVJEX1NIT1JUQ1VUU19CWV9QTEFURk9STSB9IGZyb20gXCIuL2tleWJvYXJkU2hvcnRjdXRDb25zdGFudHNcIjtcblxuZXhwb3J0IGNvbnN0IGdldE1vdmVDdXJzb3JMZWZ0S2V5ID0gKCkgPT4ge1xuICBjb25zdCBwbGF0Zm9ybU9TID0gZ2V0UGxhdGZvcm1PUygpIHx8IFwiZGVmYXVsdFwiO1xuICByZXR1cm4gS0VZQk9BUkRfU0hPUlRDVVRTX0JZX1BMQVRGT1JNW3BsYXRmb3JtT1NdLmN1cnNvckxlZnRNb3ZlbWVudDtcbn07XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGNBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGNBQUE7QUFmWixTQUFTRSxhQUFhLFFBQVEsZUFBZTtBQUM3QyxTQUFTQyw4QkFBOEIsUUFBUSw2QkFBNkI7QUFBQ0gsY0FBQSxHQUFBSSxDQUFBO0FBRTdFLE9BQU8sTUFBTUMsb0JBQW9CLEdBQUdBLENBQUEsS0FBTTtFQUFBTCxjQUFBLEdBQUFNLENBQUE7RUFDeEMsTUFBTUMsVUFBVSxJQUFBUCxjQUFBLEdBQUFJLENBQUEsT0FBRyxDQUFBSixjQUFBLEdBQUFRLENBQUEsVUFBQU4sYUFBYSxDQUFDLENBQUMsTUFBQUYsY0FBQSxHQUFBUSxDQUFBLFVBQUksU0FBUztFQUFDUixjQUFBLEdBQUFJLENBQUE7RUFDaEQsT0FBT0QsOEJBQThCLENBQUNJLFVBQVUsQ0FBQyxDQUFDRSxrQkFBa0I7QUFDdEUsQ0FBQyJ9