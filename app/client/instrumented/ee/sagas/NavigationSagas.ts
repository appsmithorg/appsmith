function cov_ast4up7z1() {
  var path = "/Users/apple/github/appsmith/app/client/src/ee/sagas/NavigationSagas.ts";
  var hash = "34cb3f80ba0a84faf55acfbcd781a2ef75cf8517";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/ee/sagas/NavigationSagas.ts",
    statementMap: {
      "0": {
        start: {
          line: 8,
          column: 2
        },
        end: {
          line: 11,
          column: 5
        }
      }
    },
    fnMap: {
      "0": {
        name: "rootSaga",
        decl: {
          start: {
            line: 7,
            column: 25
          },
          end: {
            line: 7,
            column: 33
          }
        },
        loc: {
          start: {
            line: 7,
            column: 36
          },
          end: {
            line: 12,
            column: 1
          }
        },
        line: 7
      }
    },
    branchMap: {},
    s: {
      "0": 0
    },
    f: {
      "0": 0
    },
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "34cb3f80ba0a84faf55acfbcd781a2ef75cf8517"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_ast4up7z1 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_ast4up7z1();
export * from "ce/sagas/NavigationSagas";
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { all, takeEvery } from "redux-saga/effects";
import { handleRouteChange } from "ce/sagas/NavigationSagas";
export default function* rootSaga() {
  cov_ast4up7z1().f[0]++;
  cov_ast4up7z1().s[0]++;
  yield all([takeEvery(ReduxActionTypes.ROUTE_CHANGED, handleRouteChange)
  // EE sagas called after this
  ]);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfYXN0NHVwN3oxIiwiYWN0dWFsQ292ZXJhZ2UiLCJSZWR1eEFjdGlvblR5cGVzIiwiYWxsIiwidGFrZUV2ZXJ5IiwiaGFuZGxlUm91dGVDaGFuZ2UiLCJyb290U2FnYSIsImYiLCJzIiwiUk9VVEVfQ0hBTkdFRCJdLCJzb3VyY2VzIjpbIk5hdmlnYXRpb25TYWdhcy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgKiBmcm9tIFwiY2Uvc2FnYXMvTmF2aWdhdGlvblNhZ2FzXCI7XG5cbmltcG9ydCB7IFJlZHV4QWN0aW9uVHlwZXMgfSBmcm9tIFwiY2UvY29uc3RhbnRzL1JlZHV4QWN0aW9uQ29uc3RhbnRzXCI7XG5pbXBvcnQgeyBhbGwsIHRha2VFdmVyeSB9IGZyb20gXCJyZWR1eC1zYWdhL2VmZmVjdHNcIjtcbmltcG9ydCB7IGhhbmRsZVJvdXRlQ2hhbmdlIH0gZnJvbSBcImNlL3NhZ2FzL05hdmlnYXRpb25TYWdhc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiogcm9vdFNhZ2EoKSB7XG4gIHlpZWxkIGFsbChbXG4gICAgdGFrZUV2ZXJ5KFJlZHV4QWN0aW9uVHlwZXMuUk9VVEVfQ0hBTkdFRCwgaGFuZGxlUm91dGVDaGFuZ2UpLFxuICAgIC8vIEVFIHNhZ2FzIGNhbGxlZCBhZnRlciB0aGlzXG4gIF0pO1xufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGFBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGFBQUE7QUFmWixjQUFjLDBCQUEwQjtBQUV4QyxTQUFTRSxnQkFBZ0IsUUFBUSxtQ0FBbUM7QUFDcEUsU0FBU0MsR0FBRyxFQUFFQyxTQUFTLFFBQVEsb0JBQW9CO0FBQ25ELFNBQVNDLGlCQUFpQixRQUFRLDBCQUEwQjtBQUU1RCxlQUFlLFVBQVVDLFFBQVFBLENBQUEsRUFBRztFQUFBTixhQUFBLEdBQUFPLENBQUE7RUFBQVAsYUFBQSxHQUFBUSxDQUFBO0VBQ2xDLE1BQU1MLEdBQUcsQ0FBQyxDQUNSQyxTQUFTLENBQUNGLGdCQUFnQixDQUFDTyxhQUFhLEVBQUVKLGlCQUFpQjtFQUMzRDtFQUFBLENBQ0QsQ0FBQztBQUNKIn0=