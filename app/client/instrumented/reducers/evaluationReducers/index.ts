function cov_26amtgdlq9() {
  var path = "/Users/apple/github/appsmith/app/client/src/reducers/evaluationReducers/index.ts";
  var hash = "102519fcce5590af4eaaf93841a78f380c53b515";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/reducers/evaluationReducers/index.ts",
    statementMap: {},
    fnMap: {},
    branchMap: {},
    s: {},
    f: {},
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "102519fcce5590af4eaaf93841a78f380c53b515"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_26amtgdlq9 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_26amtgdlq9();
import { combineReducers } from "redux";
import evaluatedTreeReducer from "./treeReducer";
import evaluationDependencyReducer from "./dependencyReducer";
import loadingEntitiesReducer from "./loadingEntitiesReducer";
import formEvaluationReducer from "./formEvaluationReducer";
import triggerReducer from "./triggerReducer";
export default combineReducers({
  tree: evaluatedTreeReducer,
  dependencies: evaluationDependencyReducer,
  loadingEntities: loadingEntitiesReducer,
  formEvaluation: formEvaluationReducer,
  triggers: triggerReducer
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMjZhbXRnZGxxOSIsImFjdHVhbENvdmVyYWdlIiwiY29tYmluZVJlZHVjZXJzIiwiZXZhbHVhdGVkVHJlZVJlZHVjZXIiLCJldmFsdWF0aW9uRGVwZW5kZW5jeVJlZHVjZXIiLCJsb2FkaW5nRW50aXRpZXNSZWR1Y2VyIiwiZm9ybUV2YWx1YXRpb25SZWR1Y2VyIiwidHJpZ2dlclJlZHVjZXIiLCJ0cmVlIiwiZGVwZW5kZW5jaWVzIiwibG9hZGluZ0VudGl0aWVzIiwiZm9ybUV2YWx1YXRpb24iLCJ0cmlnZ2VycyJdLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNvbWJpbmVSZWR1Y2VycyB9IGZyb20gXCJyZWR1eFwiO1xuaW1wb3J0IGV2YWx1YXRlZFRyZWVSZWR1Y2VyIGZyb20gXCIuL3RyZWVSZWR1Y2VyXCI7XG5pbXBvcnQgZXZhbHVhdGlvbkRlcGVuZGVuY3lSZWR1Y2VyIGZyb20gXCIuL2RlcGVuZGVuY3lSZWR1Y2VyXCI7XG5pbXBvcnQgbG9hZGluZ0VudGl0aWVzUmVkdWNlciBmcm9tIFwiLi9sb2FkaW5nRW50aXRpZXNSZWR1Y2VyXCI7XG5pbXBvcnQgZm9ybUV2YWx1YXRpb25SZWR1Y2VyIGZyb20gXCIuL2Zvcm1FdmFsdWF0aW9uUmVkdWNlclwiO1xuaW1wb3J0IHRyaWdnZXJSZWR1Y2VyIGZyb20gXCIuL3RyaWdnZXJSZWR1Y2VyXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNvbWJpbmVSZWR1Y2Vycyh7XG4gIHRyZWU6IGV2YWx1YXRlZFRyZWVSZWR1Y2VyLFxuICBkZXBlbmRlbmNpZXM6IGV2YWx1YXRpb25EZXBlbmRlbmN5UmVkdWNlcixcbiAgbG9hZGluZ0VudGl0aWVzOiBsb2FkaW5nRW50aXRpZXNSZWR1Y2VyLFxuICBmb3JtRXZhbHVhdGlvbjogZm9ybUV2YWx1YXRpb25SZWR1Y2VyLFxuICB0cmlnZ2VyczogdHJpZ2dlclJlZHVjZXIsXG59KTtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGNBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGNBQUE7QUFmWixTQUFTRSxlQUFlLFFBQVEsT0FBTztBQUN2QyxPQUFPQyxvQkFBb0IsTUFBTSxlQUFlO0FBQ2hELE9BQU9DLDJCQUEyQixNQUFNLHFCQUFxQjtBQUM3RCxPQUFPQyxzQkFBc0IsTUFBTSwwQkFBMEI7QUFDN0QsT0FBT0MscUJBQXFCLE1BQU0seUJBQXlCO0FBQzNELE9BQU9DLGNBQWMsTUFBTSxrQkFBa0I7QUFFN0MsZUFBZUwsZUFBZSxDQUFDO0VBQzdCTSxJQUFJLEVBQUVMLG9CQUFvQjtFQUMxQk0sWUFBWSxFQUFFTCwyQkFBMkI7RUFDekNNLGVBQWUsRUFBRUwsc0JBQXNCO0VBQ3ZDTSxjQUFjLEVBQUVMLHFCQUFxQjtFQUNyQ00sUUFBUSxFQUFFTDtBQUNaLENBQUMsQ0FBQyJ9