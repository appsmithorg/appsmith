function cov_aohzxmoy9() {
  var path = "/Users/apple/github/appsmith/app/client/src/workers/Evaluation/SetupDOM.ts";
  var hash = "47fa5606d6f04110a7272cfe38732bc70d74f2af";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/workers/Evaluation/SetupDOM.ts",
    statementMap: {
      "0": {
        start: {
          line: 5,
          column: 2
        },
        end: {
          line: 8,
          column: 3
        }
      },
      "1": {
        start: {
          line: 7,
          column: 4
        },
        end: {
          line: 7,
          column: 22
        }
      },
      "2": {
        start: {
          line: 9,
          column: 14
        },
        end: {
          line: 9,
          column: 68
        }
      },
      "3": {
        start: {
          line: 10,
          column: 2
        },
        end: {
          line: 10,
          column: 27
        }
      },
      "4": {
        start: {
          line: 11,
          column: 2
        },
        end: {
          line: 11,
          column: 38
        }
      },
      "5": {
        start: {
          line: 12,
          column: 2
        },
        end: {
          line: 12,
          column: 21
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 4,
            column: 15
          },
          end: {
            line: 4,
            column: 16
          }
        },
        loc: {
          start: {
            line: 4,
            column: 27
          },
          end: {
            line: 13,
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
      "4": 0,
      "5": 0
    },
    f: {
      "0": 0
    },
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "47fa5606d6f04110a7272cfe38732bc70d74f2af"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_aohzxmoy9 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_aohzxmoy9();
//@ts-expect-error no types.
import * as documentMock from "linkedom/worker";
export default function () {
  cov_aohzxmoy9().f[0]++;
  cov_aohzxmoy9().s[0]++;
  for (const [key, value] of Object.entries(documentMock)) {
    cov_aohzxmoy9().s[1]++;
    //@ts-expect-error no types
    self[key] = value;
  }
  const dom = (cov_aohzxmoy9().s[2]++, documentMock.parseHTML(`<!DOCTYPE html><body></body>`));
  cov_aohzxmoy9().s[3]++;
  self.window = dom.window;
  cov_aohzxmoy9().s[4]++;
  self.document = dom.window.document;
  cov_aohzxmoy9().s[5]++;
  self.window = self;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfYW9oenhtb3k5IiwiYWN0dWFsQ292ZXJhZ2UiLCJkb2N1bWVudE1vY2siLCJmIiwicyIsImtleSIsInZhbHVlIiwiT2JqZWN0IiwiZW50cmllcyIsInNlbGYiLCJkb20iLCJwYXJzZUhUTUwiLCJ3aW5kb3ciLCJkb2N1bWVudCJdLCJzb3VyY2VzIjpbIlNldHVwRE9NLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vQHRzLWV4cGVjdC1lcnJvciBubyB0eXBlcy5cbmltcG9ydCAqIGFzIGRvY3VtZW50TW9jayBmcm9tIFwibGlua2Vkb20vd29ya2VyXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uICgpIHtcbiAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoZG9jdW1lbnRNb2NrKSkge1xuICAgIC8vQHRzLWV4cGVjdC1lcnJvciBubyB0eXBlc1xuICAgIHNlbGZba2V5XSA9IHZhbHVlO1xuICB9XG4gIGNvbnN0IGRvbSA9IGRvY3VtZW50TW9jay5wYXJzZUhUTUwoYDwhRE9DVFlQRSBodG1sPjxib2R5PjwvYm9keT5gKTtcbiAgc2VsZi53aW5kb3cgPSBkb20ud2luZG93O1xuICBzZWxmLmRvY3VtZW50ID0gZG9tLndpbmRvdy5kb2N1bWVudDtcbiAgc2VsZi53aW5kb3cgPSBzZWxmO1xufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxhQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxhQUFBO0FBZlo7QUFDQSxPQUFPLEtBQUtFLFlBQVksTUFBTSxpQkFBaUI7QUFFL0MsZUFBZSxZQUFZO0VBQUFGLGFBQUEsR0FBQUcsQ0FBQTtFQUFBSCxhQUFBLEdBQUFJLENBQUE7RUFDekIsS0FBSyxNQUFNLENBQUNDLEdBQUcsRUFBRUMsS0FBSyxDQUFDLElBQUlDLE1BQU0sQ0FBQ0MsT0FBTyxDQUFDTixZQUFZLENBQUMsRUFBRTtJQUFBRixhQUFBLEdBQUFJLENBQUE7SUFDdkQ7SUFDQUssSUFBSSxDQUFDSixHQUFHLENBQUMsR0FBR0MsS0FBSztFQUNuQjtFQUNBLE1BQU1JLEdBQUcsSUFBQVYsYUFBQSxHQUFBSSxDQUFBLE9BQUdGLFlBQVksQ0FBQ1MsU0FBUyxDQUFFLDhCQUE2QixDQUFDO0VBQUNYLGFBQUEsR0FBQUksQ0FBQTtFQUNuRUssSUFBSSxDQUFDRyxNQUFNLEdBQUdGLEdBQUcsQ0FBQ0UsTUFBTTtFQUFDWixhQUFBLEdBQUFJLENBQUE7RUFDekJLLElBQUksQ0FBQ0ksUUFBUSxHQUFHSCxHQUFHLENBQUNFLE1BQU0sQ0FBQ0MsUUFBUTtFQUFDYixhQUFBLEdBQUFJLENBQUE7RUFDcENLLElBQUksQ0FBQ0csTUFBTSxHQUFHSCxJQUFJO0FBQ3BCIn0=