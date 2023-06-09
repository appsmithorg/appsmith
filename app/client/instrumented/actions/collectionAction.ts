function cov_1n6ulbihj3() {
  var path = "/Users/apple/github/appsmith/app/client/src/actions/collectionAction.ts";
  var hash = "46fdf7ce948a8b6b16bccb99d1f5742541199349";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/actions/collectionAction.ts",
    statementMap: {
      "0": {
        start: {
          line: 3,
          column: 40
        },
        end: {
          line: 7,
          column: 1
        }
      },
      "1": {
        start: {
          line: 4,
          column: 2
        },
        end: {
          line: 6,
          column: 4
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 3,
            column: 40
          },
          end: {
            line: 3,
            column: 41
          }
        },
        loc: {
          start: {
            line: 3,
            column: 46
          },
          end: {
            line: 7,
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
    hash: "46fdf7ce948a8b6b16bccb99d1f5742541199349"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1n6ulbihj3 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1n6ulbihj3();
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
cov_1n6ulbihj3().s[0]++;
export const fetchImportedCollections = () => {
  cov_1n6ulbihj3().f[0]++;
  cov_1n6ulbihj3().s[1]++;
  return {
    type: ReduxActionTypes.FETCH_IMPORTED_COLLECTIONS_INIT
  };
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMW42dWxiaWhqMyIsImFjdHVhbENvdmVyYWdlIiwiUmVkdXhBY3Rpb25UeXBlcyIsInMiLCJmZXRjaEltcG9ydGVkQ29sbGVjdGlvbnMiLCJmIiwidHlwZSIsIkZFVENIX0lNUE9SVEVEX0NPTExFQ1RJT05TX0lOSVQiXSwic291cmNlcyI6WyJjb2xsZWN0aW9uQWN0aW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFJlZHV4QWN0aW9uVHlwZXMgfSBmcm9tIFwiQGFwcHNtaXRoL2NvbnN0YW50cy9SZWR1eEFjdGlvbkNvbnN0YW50c1wiO1xuXG5leHBvcnQgY29uc3QgZmV0Y2hJbXBvcnRlZENvbGxlY3Rpb25zID0gKCkgPT4ge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFJlZHV4QWN0aW9uVHlwZXMuRkVUQ0hfSU1QT1JURURfQ09MTEVDVElPTlNfSU5JVCxcbiAgfTtcbn07XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxjQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxjQUFBO0FBZlosU0FBU0UsZ0JBQWdCLFFBQVEsMENBQTBDO0FBQUNGLGNBQUEsR0FBQUcsQ0FBQTtBQUU1RSxPQUFPLE1BQU1DLHdCQUF3QixHQUFHQSxDQUFBLEtBQU07RUFBQUosY0FBQSxHQUFBSyxDQUFBO0VBQUFMLGNBQUEsR0FBQUcsQ0FBQTtFQUM1QyxPQUFPO0lBQ0xHLElBQUksRUFBRUosZ0JBQWdCLENBQUNLO0VBQ3pCLENBQUM7QUFDSCxDQUFDIn0=