function cov_2ex3ipkzfx() {
  var path = "/Users/apple/github/appsmith/app/client/src/ee/reducers/uiReducers/workspaceReducer.tsx";
  var hash = "11c1eb16f29a98c8099974438bc24f1e7fb66087";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/ee/reducers/uiReducers/workspaceReducer.tsx",
    statementMap: {
      "0": {
        start: {
          line: 8,
          column: 17
        },
        end: {
          line: 10,
          column: 1
        }
      },
      "1": {
        start: {
          line: 12,
          column: 25
        },
        end: {
          line: 12,
          column: 67
        }
      }
    },
    fnMap: {},
    branchMap: {},
    s: {
      "0": 0,
      "1": 0
    },
    f: {},
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "11c1eb16f29a98c8099974438bc24f1e7fb66087"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_2ex3ipkzfx = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_2ex3ipkzfx();
export * from "ce/reducers/uiReducers/workspaceReducer";
import { handlers as CE_handlers, initialState } from "ce/reducers/uiReducers/workspaceReducer";
import { createImmerReducer } from "utils/ReducerUtils";
const handlers = (cov_2ex3ipkzfx().s[0]++, {
  ...CE_handlers
});
const workspaceReducer = (cov_2ex3ipkzfx().s[1]++, createImmerReducer(initialState, handlers));
export default workspaceReducer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMmV4M2lwa3pmeCIsImFjdHVhbENvdmVyYWdlIiwiaGFuZGxlcnMiLCJDRV9oYW5kbGVycyIsImluaXRpYWxTdGF0ZSIsImNyZWF0ZUltbWVyUmVkdWNlciIsInMiLCJ3b3Jrc3BhY2VSZWR1Y2VyIl0sInNvdXJjZXMiOlsid29ya3NwYWNlUmVkdWNlci50c3giXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0ICogZnJvbSBcImNlL3JlZHVjZXJzL3VpUmVkdWNlcnMvd29ya3NwYWNlUmVkdWNlclwiO1xuaW1wb3J0IHtcbiAgaGFuZGxlcnMgYXMgQ0VfaGFuZGxlcnMsXG4gIGluaXRpYWxTdGF0ZSxcbn0gZnJvbSBcImNlL3JlZHVjZXJzL3VpUmVkdWNlcnMvd29ya3NwYWNlUmVkdWNlclwiO1xuaW1wb3J0IHsgY3JlYXRlSW1tZXJSZWR1Y2VyIH0gZnJvbSBcInV0aWxzL1JlZHVjZXJVdGlsc1wiO1xuXG5jb25zdCBoYW5kbGVycyA9IHtcbiAgLi4uQ0VfaGFuZGxlcnMsXG59O1xuXG5jb25zdCB3b3Jrc3BhY2VSZWR1Y2VyID0gY3JlYXRlSW1tZXJSZWR1Y2VyKGluaXRpYWxTdGF0ZSwgaGFuZGxlcnMpO1xuXG5leHBvcnQgZGVmYXVsdCB3b3Jrc3BhY2VSZWR1Y2VyO1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsY0FBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsY0FBQTtBQWZaLGNBQWMseUNBQXlDO0FBQ3ZELFNBQ0VFLFFBQVEsSUFBSUMsV0FBVyxFQUN2QkMsWUFBWSxRQUNQLHlDQUF5QztBQUNoRCxTQUFTQyxrQkFBa0IsUUFBUSxvQkFBb0I7QUFFdkQsTUFBTUgsUUFBUSxJQUFBRixjQUFBLEdBQUFNLENBQUEsT0FBRztFQUNmLEdBQUdIO0FBQ0wsQ0FBQztBQUVELE1BQU1JLGdCQUFnQixJQUFBUCxjQUFBLEdBQUFNLENBQUEsT0FBR0Qsa0JBQWtCLENBQUNELFlBQVksRUFBRUYsUUFBUSxDQUFDO0FBRW5FLGVBQWVLLGdCQUFnQiJ9