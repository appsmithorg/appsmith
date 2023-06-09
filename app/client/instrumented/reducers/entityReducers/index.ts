function cov_f585vto52() {
  var path = "/Users/apple/github/appsmith/app/client/src/reducers/entityReducers/index.ts";
  var hash = "b70d4d3dbc30c8f9f017b6be74d72e26685c640f";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/reducers/entityReducers/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 17,
          column: 22
        },
        end: {
          line: 32,
          column: 2
        }
      }
    },
    fnMap: {},
    branchMap: {},
    s: {
      "0": 0
    },
    f: {},
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "b70d4d3dbc30c8f9f017b6be74d72e26685c640f"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_f585vto52 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_f585vto52();
import { combineReducers } from "redux";
import actionsReducer from "./actionsReducer";
import appReducer from "./appReducer";
import canvasWidgetsReducer from "./canvasWidgetsReducer";
import canvasWidgetsStructureReducer from "./canvasWidgetsStructureReducer";
import metaWidgetsReducer from "./metaWidgetsReducer";
import datasourceReducer from "./datasourceReducer";
import jsActionsReducer from "./jsActionsReducer";
import jsExecutionsReducer from "./jsExecutionsReducer";
import metaReducer from "./metaReducer";
import pageListReducer from "./pageListReducer";
import pluginsReducer from "reducers/entityReducers/pluginsReducer";
import widgetConfigReducer from "./widgetConfigReducer";
import autoHeightLayoutTreeReducer from "./autoHeightReducers/autoHeightLayoutTreeReducer";
import canvasLevelsReducer from "./autoHeightReducers/canvasLevelsReducer";
const entityReducer = (cov_f585vto52().s[0]++, combineReducers({
  canvasWidgets: canvasWidgetsReducer,
  canvasWidgetsStructure: canvasWidgetsStructureReducer,
  metaWidgets: metaWidgetsReducer,
  widgetConfig: widgetConfigReducer,
  actions: actionsReducer,
  datasources: datasourceReducer,
  pageList: pageListReducer,
  jsExecutions: jsExecutionsReducer,
  plugins: pluginsReducer,
  meta: metaReducer,
  app: appReducer,
  jsActions: jsActionsReducer,
  autoHeightLayoutTree: autoHeightLayoutTreeReducer,
  canvasLevels: canvasLevelsReducer
}));
export default entityReducer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfZjU4NXZ0bzUyIiwiYWN0dWFsQ292ZXJhZ2UiLCJjb21iaW5lUmVkdWNlcnMiLCJhY3Rpb25zUmVkdWNlciIsImFwcFJlZHVjZXIiLCJjYW52YXNXaWRnZXRzUmVkdWNlciIsImNhbnZhc1dpZGdldHNTdHJ1Y3R1cmVSZWR1Y2VyIiwibWV0YVdpZGdldHNSZWR1Y2VyIiwiZGF0YXNvdXJjZVJlZHVjZXIiLCJqc0FjdGlvbnNSZWR1Y2VyIiwianNFeGVjdXRpb25zUmVkdWNlciIsIm1ldGFSZWR1Y2VyIiwicGFnZUxpc3RSZWR1Y2VyIiwicGx1Z2luc1JlZHVjZXIiLCJ3aWRnZXRDb25maWdSZWR1Y2VyIiwiYXV0b0hlaWdodExheW91dFRyZWVSZWR1Y2VyIiwiY2FudmFzTGV2ZWxzUmVkdWNlciIsImVudGl0eVJlZHVjZXIiLCJzIiwiY2FudmFzV2lkZ2V0cyIsImNhbnZhc1dpZGdldHNTdHJ1Y3R1cmUiLCJtZXRhV2lkZ2V0cyIsIndpZGdldENvbmZpZyIsImFjdGlvbnMiLCJkYXRhc291cmNlcyIsInBhZ2VMaXN0IiwianNFeGVjdXRpb25zIiwicGx1Z2lucyIsIm1ldGEiLCJhcHAiLCJqc0FjdGlvbnMiLCJhdXRvSGVpZ2h0TGF5b3V0VHJlZSIsImNhbnZhc0xldmVscyJdLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNvbWJpbmVSZWR1Y2VycyB9IGZyb20gXCJyZWR1eFwiO1xuaW1wb3J0IGFjdGlvbnNSZWR1Y2VyIGZyb20gXCIuL2FjdGlvbnNSZWR1Y2VyXCI7XG5pbXBvcnQgYXBwUmVkdWNlciBmcm9tIFwiLi9hcHBSZWR1Y2VyXCI7XG5pbXBvcnQgY2FudmFzV2lkZ2V0c1JlZHVjZXIgZnJvbSBcIi4vY2FudmFzV2lkZ2V0c1JlZHVjZXJcIjtcbmltcG9ydCBjYW52YXNXaWRnZXRzU3RydWN0dXJlUmVkdWNlciBmcm9tIFwiLi9jYW52YXNXaWRnZXRzU3RydWN0dXJlUmVkdWNlclwiO1xuaW1wb3J0IG1ldGFXaWRnZXRzUmVkdWNlciBmcm9tIFwiLi9tZXRhV2lkZ2V0c1JlZHVjZXJcIjtcbmltcG9ydCBkYXRhc291cmNlUmVkdWNlciBmcm9tIFwiLi9kYXRhc291cmNlUmVkdWNlclwiO1xuaW1wb3J0IGpzQWN0aW9uc1JlZHVjZXIgZnJvbSBcIi4vanNBY3Rpb25zUmVkdWNlclwiO1xuaW1wb3J0IGpzRXhlY3V0aW9uc1JlZHVjZXIgZnJvbSBcIi4vanNFeGVjdXRpb25zUmVkdWNlclwiO1xuaW1wb3J0IG1ldGFSZWR1Y2VyIGZyb20gXCIuL21ldGFSZWR1Y2VyXCI7XG5pbXBvcnQgcGFnZUxpc3RSZWR1Y2VyIGZyb20gXCIuL3BhZ2VMaXN0UmVkdWNlclwiO1xuaW1wb3J0IHBsdWdpbnNSZWR1Y2VyIGZyb20gXCJyZWR1Y2Vycy9lbnRpdHlSZWR1Y2Vycy9wbHVnaW5zUmVkdWNlclwiO1xuaW1wb3J0IHdpZGdldENvbmZpZ1JlZHVjZXIgZnJvbSBcIi4vd2lkZ2V0Q29uZmlnUmVkdWNlclwiO1xuaW1wb3J0IGF1dG9IZWlnaHRMYXlvdXRUcmVlUmVkdWNlciBmcm9tIFwiLi9hdXRvSGVpZ2h0UmVkdWNlcnMvYXV0b0hlaWdodExheW91dFRyZWVSZWR1Y2VyXCI7XG5pbXBvcnQgY2FudmFzTGV2ZWxzUmVkdWNlciBmcm9tIFwiLi9hdXRvSGVpZ2h0UmVkdWNlcnMvY2FudmFzTGV2ZWxzUmVkdWNlclwiO1xuXG5jb25zdCBlbnRpdHlSZWR1Y2VyID0gY29tYmluZVJlZHVjZXJzKHtcbiAgY2FudmFzV2lkZ2V0czogY2FudmFzV2lkZ2V0c1JlZHVjZXIsXG4gIGNhbnZhc1dpZGdldHNTdHJ1Y3R1cmU6IGNhbnZhc1dpZGdldHNTdHJ1Y3R1cmVSZWR1Y2VyLFxuICBtZXRhV2lkZ2V0czogbWV0YVdpZGdldHNSZWR1Y2VyLFxuICB3aWRnZXRDb25maWc6IHdpZGdldENvbmZpZ1JlZHVjZXIsXG4gIGFjdGlvbnM6IGFjdGlvbnNSZWR1Y2VyLFxuICBkYXRhc291cmNlczogZGF0YXNvdXJjZVJlZHVjZXIsXG4gIHBhZ2VMaXN0OiBwYWdlTGlzdFJlZHVjZXIsXG4gIGpzRXhlY3V0aW9uczoganNFeGVjdXRpb25zUmVkdWNlcixcbiAgcGx1Z2luczogcGx1Z2luc1JlZHVjZXIsXG4gIG1ldGE6IG1ldGFSZWR1Y2VyLFxuICBhcHA6IGFwcFJlZHVjZXIsXG4gIGpzQWN0aW9uczoganNBY3Rpb25zUmVkdWNlcixcbiAgYXV0b0hlaWdodExheW91dFRyZWU6IGF1dG9IZWlnaHRMYXlvdXRUcmVlUmVkdWNlcixcbiAgY2FudmFzTGV2ZWxzOiBjYW52YXNMZXZlbHNSZWR1Y2VyLFxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IGVudGl0eVJlZHVjZXI7XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsYUFBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsYUFBQTtBQWZaLFNBQVNFLGVBQWUsUUFBUSxPQUFPO0FBQ3ZDLE9BQU9DLGNBQWMsTUFBTSxrQkFBa0I7QUFDN0MsT0FBT0MsVUFBVSxNQUFNLGNBQWM7QUFDckMsT0FBT0Msb0JBQW9CLE1BQU0sd0JBQXdCO0FBQ3pELE9BQU9DLDZCQUE2QixNQUFNLGlDQUFpQztBQUMzRSxPQUFPQyxrQkFBa0IsTUFBTSxzQkFBc0I7QUFDckQsT0FBT0MsaUJBQWlCLE1BQU0scUJBQXFCO0FBQ25ELE9BQU9DLGdCQUFnQixNQUFNLG9CQUFvQjtBQUNqRCxPQUFPQyxtQkFBbUIsTUFBTSx1QkFBdUI7QUFDdkQsT0FBT0MsV0FBVyxNQUFNLGVBQWU7QUFDdkMsT0FBT0MsZUFBZSxNQUFNLG1CQUFtQjtBQUMvQyxPQUFPQyxjQUFjLE1BQU0sd0NBQXdDO0FBQ25FLE9BQU9DLG1CQUFtQixNQUFNLHVCQUF1QjtBQUN2RCxPQUFPQywyQkFBMkIsTUFBTSxrREFBa0Q7QUFDMUYsT0FBT0MsbUJBQW1CLE1BQU0sMENBQTBDO0FBRTFFLE1BQU1DLGFBQWEsSUFBQWpCLGFBQUEsR0FBQWtCLENBQUEsT0FBR2hCLGVBQWUsQ0FBQztFQUNwQ2lCLGFBQWEsRUFBRWQsb0JBQW9CO0VBQ25DZSxzQkFBc0IsRUFBRWQsNkJBQTZCO0VBQ3JEZSxXQUFXLEVBQUVkLGtCQUFrQjtFQUMvQmUsWUFBWSxFQUFFUixtQkFBbUI7RUFDakNTLE9BQU8sRUFBRXBCLGNBQWM7RUFDdkJxQixXQUFXLEVBQUVoQixpQkFBaUI7RUFDOUJpQixRQUFRLEVBQUViLGVBQWU7RUFDekJjLFlBQVksRUFBRWhCLG1CQUFtQjtFQUNqQ2lCLE9BQU8sRUFBRWQsY0FBYztFQUN2QmUsSUFBSSxFQUFFakIsV0FBVztFQUNqQmtCLEdBQUcsRUFBRXpCLFVBQVU7RUFDZjBCLFNBQVMsRUFBRXJCLGdCQUFnQjtFQUMzQnNCLG9CQUFvQixFQUFFaEIsMkJBQTJCO0VBQ2pEaUIsWUFBWSxFQUFFaEI7QUFDaEIsQ0FBQyxDQUFDO0FBRUYsZUFBZUMsYUFBYSJ9