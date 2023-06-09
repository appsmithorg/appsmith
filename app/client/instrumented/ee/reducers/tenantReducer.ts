function cov_1ssd9r6d8k() {
  var path = "/Users/apple/github/appsmith/app/client/src/ee/reducers/tenantReducer.ts";
  var hash = "b27ed626886396e080b09344e49b3686de458c3c";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/ee/reducers/tenantReducer.ts",
    statementMap: {},
    fnMap: {},
    branchMap: {},
    s: {},
    f: {},
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "b27ed626886396e080b09344e49b3686de458c3c"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1ssd9r6d8k = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1ssd9r6d8k();
export * from "ce/reducers/tenantReducer";
import { handlers, initialState } from "ce/reducers/tenantReducer";
import { createReducer } from "utils/ReducerUtils";
export default createReducer(initialState, handlers);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMXNzZDlyNmQ4ayIsImFjdHVhbENvdmVyYWdlIiwiaGFuZGxlcnMiLCJpbml0aWFsU3RhdGUiLCJjcmVhdGVSZWR1Y2VyIl0sInNvdXJjZXMiOlsidGVuYW50UmVkdWNlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgKiBmcm9tIFwiY2UvcmVkdWNlcnMvdGVuYW50UmVkdWNlclwiO1xuaW1wb3J0IHsgaGFuZGxlcnMsIGluaXRpYWxTdGF0ZSB9IGZyb20gXCJjZS9yZWR1Y2Vycy90ZW5hbnRSZWR1Y2VyXCI7XG5pbXBvcnQgeyBjcmVhdGVSZWR1Y2VyIH0gZnJvbSBcInV0aWxzL1JlZHVjZXJVdGlsc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVSZWR1Y2VyKGluaXRpYWxTdGF0ZSwgaGFuZGxlcnMpO1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsY0FBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsY0FBQTtBQWZaLGNBQWMsMkJBQTJCO0FBQ3pDLFNBQVNFLFFBQVEsRUFBRUMsWUFBWSxRQUFRLDJCQUEyQjtBQUNsRSxTQUFTQyxhQUFhLFFBQVEsb0JBQW9CO0FBRWxELGVBQWVBLGFBQWEsQ0FBQ0QsWUFBWSxFQUFFRCxRQUFRLENBQUMifQ==