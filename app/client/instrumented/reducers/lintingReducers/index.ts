function cov_24p4b2gq7n() {
  var path = "/Users/apple/github/appsmith/app/client/src/reducers/lintingReducers/index.ts";
  var hash = "fe274ab4d39b64d25e8202fbec10e31d573ff568";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/reducers/lintingReducers/index.ts",
    statementMap: {},
    fnMap: {},
    branchMap: {},
    s: {},
    f: {},
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "fe274ab4d39b64d25e8202fbec10e31d573ff568"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_24p4b2gq7n = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_24p4b2gq7n();
import { combineReducers } from "redux";
import { lintErrorReducer } from "./lintErrorsReducers";
export default combineReducers({
  errors: lintErrorReducer
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMjRwNGIyZ3E3biIsImFjdHVhbENvdmVyYWdlIiwiY29tYmluZVJlZHVjZXJzIiwibGludEVycm9yUmVkdWNlciIsImVycm9ycyJdLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNvbWJpbmVSZWR1Y2VycyB9IGZyb20gXCJyZWR1eFwiO1xuaW1wb3J0IHsgbGludEVycm9yUmVkdWNlciB9IGZyb20gXCIuL2xpbnRFcnJvcnNSZWR1Y2Vyc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBjb21iaW5lUmVkdWNlcnMoe1xuICBlcnJvcnM6IGxpbnRFcnJvclJlZHVjZXIsXG59KTtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGNBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGNBQUE7QUFmWixTQUFTRSxlQUFlLFFBQVEsT0FBTztBQUN2QyxTQUFTQyxnQkFBZ0IsUUFBUSxzQkFBc0I7QUFFdkQsZUFBZUQsZUFBZSxDQUFDO0VBQzdCRSxNQUFNLEVBQUVEO0FBQ1YsQ0FBQyxDQUFDIn0=