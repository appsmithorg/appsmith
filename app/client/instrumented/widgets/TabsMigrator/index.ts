function cov_1q5dakzizf() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/TabsMigrator/index.ts";
  var hash = "cfb5d2df22699a5944dbf10c8e1eff1ff83e7d99";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/TabsMigrator/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 3,
          column: 22
        },
        end: {
          line: 23,
          column: 1
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
    hash: "cfb5d2df22699a5944dbf10c8e1eff1ff83e7d99"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1q5dakzizf = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1q5dakzizf();
import Widget from "./widget";
export const CONFIG = (cov_1q5dakzizf().s[0]++, {
  type: Widget.getWidgetType(),
  name: "TabsMigrator",
  needsMeta: true,
  defaults: {
    isLoading: true,
    rows: 1,
    columns: 1,
    widgetName: "Skeleton",
    version: 1,
    animateLoading: true
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    autocompleteDefinitions: Widget.getAutocompleteDefinitions()
  }
});
export default Widget;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMXE1ZGFreml6ZiIsImFjdHVhbENvdmVyYWdlIiwiV2lkZ2V0IiwiQ09ORklHIiwicyIsInR5cGUiLCJnZXRXaWRnZXRUeXBlIiwibmFtZSIsIm5lZWRzTWV0YSIsImRlZmF1bHRzIiwiaXNMb2FkaW5nIiwicm93cyIsImNvbHVtbnMiLCJ3aWRnZXROYW1lIiwidmVyc2lvbiIsImFuaW1hdGVMb2FkaW5nIiwicHJvcGVydGllcyIsImRlcml2ZWQiLCJnZXREZXJpdmVkUHJvcGVydGllc01hcCIsImRlZmF1bHQiLCJnZXREZWZhdWx0UHJvcGVydGllc01hcCIsIm1ldGEiLCJnZXRNZXRhUHJvcGVydGllc01hcCIsImNvbmZpZyIsImdldFByb3BlcnR5UGFuZUNvbmZpZyIsImF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiXSwic291cmNlcyI6WyJpbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgV2lkZ2V0IGZyb20gXCIuL3dpZGdldFwiO1xuXG5leHBvcnQgY29uc3QgQ09ORklHID0ge1xuICB0eXBlOiBXaWRnZXQuZ2V0V2lkZ2V0VHlwZSgpLFxuICBuYW1lOiBcIlRhYnNNaWdyYXRvclwiLFxuICBuZWVkc01ldGE6IHRydWUsXG5cbiAgZGVmYXVsdHM6IHtcbiAgICBpc0xvYWRpbmc6IHRydWUsXG4gICAgcm93czogMSxcbiAgICBjb2x1bW5zOiAxLFxuICAgIHdpZGdldE5hbWU6IFwiU2tlbGV0b25cIixcbiAgICB2ZXJzaW9uOiAxLFxuICAgIGFuaW1hdGVMb2FkaW5nOiB0cnVlLFxuICB9LFxuICBwcm9wZXJ0aWVzOiB7XG4gICAgZGVyaXZlZDogV2lkZ2V0LmdldERlcml2ZWRQcm9wZXJ0aWVzTWFwKCksXG4gICAgZGVmYXVsdDogV2lkZ2V0LmdldERlZmF1bHRQcm9wZXJ0aWVzTWFwKCksXG4gICAgbWV0YTogV2lkZ2V0LmdldE1ldGFQcm9wZXJ0aWVzTWFwKCksXG4gICAgY29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lQ29uZmlnKCksXG4gICAgYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnM6IFdpZGdldC5nZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucygpLFxuICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgV2lkZ2V0O1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGNBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGNBQUE7QUFmWixPQUFPRSxNQUFNLE1BQU0sVUFBVTtBQUU3QixPQUFPLE1BQU1DLE1BQU0sSUFBQUgsY0FBQSxHQUFBSSxDQUFBLE9BQUc7RUFDcEJDLElBQUksRUFBRUgsTUFBTSxDQUFDSSxhQUFhLENBQUMsQ0FBQztFQUM1QkMsSUFBSSxFQUFFLGNBQWM7RUFDcEJDLFNBQVMsRUFBRSxJQUFJO0VBRWZDLFFBQVEsRUFBRTtJQUNSQyxTQUFTLEVBQUUsSUFBSTtJQUNmQyxJQUFJLEVBQUUsQ0FBQztJQUNQQyxPQUFPLEVBQUUsQ0FBQztJQUNWQyxVQUFVLEVBQUUsVUFBVTtJQUN0QkMsT0FBTyxFQUFFLENBQUM7SUFDVkMsY0FBYyxFQUFFO0VBQ2xCLENBQUM7RUFDREMsVUFBVSxFQUFFO0lBQ1ZDLE9BQU8sRUFBRWYsTUFBTSxDQUFDZ0IsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsT0FBTyxFQUFFakIsTUFBTSxDQUFDa0IsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsSUFBSSxFQUFFbkIsTUFBTSxDQUFDb0Isb0JBQW9CLENBQUMsQ0FBQztJQUNuQ0MsTUFBTSxFQUFFckIsTUFBTSxDQUFDc0IscUJBQXFCLENBQUMsQ0FBQztJQUN0Q0MsdUJBQXVCLEVBQUV2QixNQUFNLENBQUN3QiwwQkFBMEIsQ0FBQztFQUM3RDtBQUNGLENBQUM7QUFFRCxlQUFleEIsTUFBTSJ9