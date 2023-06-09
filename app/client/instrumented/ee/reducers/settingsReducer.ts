function cov_ws9a8pn9j() {
  var path = "/Users/apple/github/appsmith/app/client/src/ee/reducers/settingsReducer.ts";
  var hash = "5355d0d875807c81f074f7674cfd01593d7942a4";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/ee/reducers/settingsReducer.ts",
    statementMap: {},
    fnMap: {},
    branchMap: {},
    s: {},
    f: {},
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "5355d0d875807c81f074f7674cfd01593d7942a4"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_ws9a8pn9j = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_ws9a8pn9j();
export * from "ce/reducers/settingsReducer";
import { handlers, initialState } from "ce/reducers/settingsReducer";
import { createReducer } from "utils/ReducerUtils";
export default createReducer(initialState, handlers);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3Zfd3M5YThwbjlqIiwiYWN0dWFsQ292ZXJhZ2UiLCJoYW5kbGVycyIsImluaXRpYWxTdGF0ZSIsImNyZWF0ZVJlZHVjZXIiXSwic291cmNlcyI6WyJzZXR0aW5nc1JlZHVjZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0ICogZnJvbSBcImNlL3JlZHVjZXJzL3NldHRpbmdzUmVkdWNlclwiO1xuaW1wb3J0IHsgaGFuZGxlcnMsIGluaXRpYWxTdGF0ZSB9IGZyb20gXCJjZS9yZWR1Y2Vycy9zZXR0aW5nc1JlZHVjZXJcIjtcbmltcG9ydCB7IGNyZWF0ZVJlZHVjZXIgfSBmcm9tIFwidXRpbHMvUmVkdWNlclV0aWxzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVJlZHVjZXIoaW5pdGlhbFN0YXRlLCBoYW5kbGVycyk7XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxhQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxhQUFBO0FBZlosY0FBYyw2QkFBNkI7QUFDM0MsU0FBU0UsUUFBUSxFQUFFQyxZQUFZLFFBQVEsNkJBQTZCO0FBQ3BFLFNBQVNDLGFBQWEsUUFBUSxvQkFBb0I7QUFFbEQsZUFBZUEsYUFBYSxDQUFDRCxZQUFZLEVBQUVELFFBQVEsQ0FBQyJ9