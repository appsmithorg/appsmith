function cov_1i452ei70m() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/CircularProgressWidget/index.ts";
  var hash = "e15993a49ffc6ab15e4b586fd3dd3b3faa15b742";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/CircularProgressWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 5,
          column: 22
        },
        end: {
          line: 35,
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
    hash: "e15993a49ffc6ab15e4b586fd3dd3b3faa15b742"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1i452ei70m = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1i452ei70m();
import { Colors } from "constants/Colors";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_1i452ei70m().s[0]++, {
  type: Widget.getWidgetType(),
  name: "Circular Progress",
  hideCard: true,
  isDeprecated: true,
  replacement: "PROGRESS_WIDGET",
  iconSVG: IconSVG,
  defaults: {
    counterClockWise: false,
    fillColor: Colors.GREEN,
    isVisible: true,
    progress: 65,
    showResult: true,
    rows: 17,
    columns: 16,
    widgetName: "CircularProgress",
    shouldScroll: false,
    shouldTruncate: false,
    version: 1,
    animateLoading: true
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    stylesheetConfig: Widget.getStylesheetConfig(),
    autocompleteDefinitions: Widget.getAutocompleteDefinitions()
  }
});
export default Widget;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMWk0NTJlaTcwbSIsImFjdHVhbENvdmVyYWdlIiwiQ29sb3JzIiwiSWNvblNWRyIsIldpZGdldCIsIkNPTkZJRyIsInMiLCJ0eXBlIiwiZ2V0V2lkZ2V0VHlwZSIsIm5hbWUiLCJoaWRlQ2FyZCIsImlzRGVwcmVjYXRlZCIsInJlcGxhY2VtZW50IiwiaWNvblNWRyIsImRlZmF1bHRzIiwiY291bnRlckNsb2NrV2lzZSIsImZpbGxDb2xvciIsIkdSRUVOIiwiaXNWaXNpYmxlIiwicHJvZ3Jlc3MiLCJzaG93UmVzdWx0Iiwicm93cyIsImNvbHVtbnMiLCJ3aWRnZXROYW1lIiwic2hvdWxkU2Nyb2xsIiwic2hvdWxkVHJ1bmNhdGUiLCJ2ZXJzaW9uIiwiYW5pbWF0ZUxvYWRpbmciLCJwcm9wZXJ0aWVzIiwiZGVyaXZlZCIsImdldERlcml2ZWRQcm9wZXJ0aWVzTWFwIiwiZGVmYXVsdCIsImdldERlZmF1bHRQcm9wZXJ0aWVzTWFwIiwibWV0YSIsImdldE1ldGFQcm9wZXJ0aWVzTWFwIiwiY29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lQ29uZmlnIiwic3R5bGVzaGVldENvbmZpZyIsImdldFN0eWxlc2hlZXRDb25maWciLCJhdXRvY29tcGxldGVEZWZpbml0aW9ucyIsImdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zIl0sInNvdXJjZXMiOlsiaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29sb3JzIH0gZnJvbSBcImNvbnN0YW50cy9Db2xvcnNcIjtcbmltcG9ydCBJY29uU1ZHIGZyb20gXCIuL2ljb24uc3ZnXCI7XG5pbXBvcnQgV2lkZ2V0IGZyb20gXCIuL3dpZGdldFwiO1xuXG5leHBvcnQgY29uc3QgQ09ORklHID0ge1xuICB0eXBlOiBXaWRnZXQuZ2V0V2lkZ2V0VHlwZSgpLFxuICBuYW1lOiBcIkNpcmN1bGFyIFByb2dyZXNzXCIsXG4gIGhpZGVDYXJkOiB0cnVlLFxuICBpc0RlcHJlY2F0ZWQ6IHRydWUsXG4gIHJlcGxhY2VtZW50OiBcIlBST0dSRVNTX1dJREdFVFwiLFxuICBpY29uU1ZHOiBJY29uU1ZHLFxuICBkZWZhdWx0czoge1xuICAgIGNvdW50ZXJDbG9ja1dpc2U6IGZhbHNlLFxuICAgIGZpbGxDb2xvcjogQ29sb3JzLkdSRUVOLFxuICAgIGlzVmlzaWJsZTogdHJ1ZSxcbiAgICBwcm9ncmVzczogNjUsXG4gICAgc2hvd1Jlc3VsdDogdHJ1ZSxcblxuICAgIHJvd3M6IDE3LFxuICAgIGNvbHVtbnM6IDE2LFxuICAgIHdpZGdldE5hbWU6IFwiQ2lyY3VsYXJQcm9ncmVzc1wiLFxuICAgIHNob3VsZFNjcm9sbDogZmFsc2UsXG4gICAgc2hvdWxkVHJ1bmNhdGU6IGZhbHNlLFxuICAgIHZlcnNpb246IDEsXG4gICAgYW5pbWF0ZUxvYWRpbmc6IHRydWUsXG4gIH0sXG4gIHByb3BlcnRpZXM6IHtcbiAgICBkZXJpdmVkOiBXaWRnZXQuZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAoKSxcbiAgICBkZWZhdWx0OiBXaWRnZXQuZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAoKSxcbiAgICBtZXRhOiBXaWRnZXQuZ2V0TWV0YVByb3BlcnRpZXNNYXAoKSxcbiAgICBjb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVDb25maWcoKSxcbiAgICBzdHlsZXNoZWV0Q29uZmlnOiBXaWRnZXQuZ2V0U3R5bGVzaGVldENvbmZpZygpLFxuICAgIGF1dG9jb21wbGV0ZURlZmluaXRpb25zOiBXaWRnZXQuZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMoKSxcbiAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFdpZGdldDtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxjQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxjQUFBO0FBZlosU0FBU0UsTUFBTSxRQUFRLGtCQUFrQjtBQUN6QyxPQUFPQyxPQUFPLE1BQU0sWUFBWTtBQUNoQyxPQUFPQyxNQUFNLE1BQU0sVUFBVTtBQUU3QixPQUFPLE1BQU1DLE1BQU0sSUFBQUwsY0FBQSxHQUFBTSxDQUFBLE9BQUc7RUFDcEJDLElBQUksRUFBRUgsTUFBTSxDQUFDSSxhQUFhLENBQUMsQ0FBQztFQUM1QkMsSUFBSSxFQUFFLG1CQUFtQjtFQUN6QkMsUUFBUSxFQUFFLElBQUk7RUFDZEMsWUFBWSxFQUFFLElBQUk7RUFDbEJDLFdBQVcsRUFBRSxpQkFBaUI7RUFDOUJDLE9BQU8sRUFBRVYsT0FBTztFQUNoQlcsUUFBUSxFQUFFO0lBQ1JDLGdCQUFnQixFQUFFLEtBQUs7SUFDdkJDLFNBQVMsRUFBRWQsTUFBTSxDQUFDZSxLQUFLO0lBQ3ZCQyxTQUFTLEVBQUUsSUFBSTtJQUNmQyxRQUFRLEVBQUUsRUFBRTtJQUNaQyxVQUFVLEVBQUUsSUFBSTtJQUVoQkMsSUFBSSxFQUFFLEVBQUU7SUFDUkMsT0FBTyxFQUFFLEVBQUU7SUFDWEMsVUFBVSxFQUFFLGtCQUFrQjtJQUM5QkMsWUFBWSxFQUFFLEtBQUs7SUFDbkJDLGNBQWMsRUFBRSxLQUFLO0lBQ3JCQyxPQUFPLEVBQUUsQ0FBQztJQUNWQyxjQUFjLEVBQUU7RUFDbEIsQ0FBQztFQUNEQyxVQUFVLEVBQUU7SUFDVkMsT0FBTyxFQUFFekIsTUFBTSxDQUFDMEIsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsT0FBTyxFQUFFM0IsTUFBTSxDQUFDNEIsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsSUFBSSxFQUFFN0IsTUFBTSxDQUFDOEIsb0JBQW9CLENBQUMsQ0FBQztJQUNuQ0MsTUFBTSxFQUFFL0IsTUFBTSxDQUFDZ0MscUJBQXFCLENBQUMsQ0FBQztJQUN0Q0MsZ0JBQWdCLEVBQUVqQyxNQUFNLENBQUNrQyxtQkFBbUIsQ0FBQyxDQUFDO0lBQzlDQyx1QkFBdUIsRUFBRW5DLE1BQU0sQ0FBQ29DLDBCQUEwQixDQUFDO0VBQzdEO0FBQ0YsQ0FBQztBQUVELGVBQWVwQyxNQUFNIn0=