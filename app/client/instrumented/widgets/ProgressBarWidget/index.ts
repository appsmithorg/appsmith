function cov_8eqoxmztb() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/ProgressBarWidget/index.ts";
  var hash = "020b1c39095b67cfffa65c28ddf0dd7012bff8ab";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/ProgressBarWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 6,
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
    hash: "020b1c39095b67cfffa65c28ddf0dd7012bff8ab"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_8eqoxmztb = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_8eqoxmztb();
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { BarType } from "./constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_8eqoxmztb().s[0]++, {
  type: Widget.getWidgetType(),
  name: "Progress Bar",
  // The display name which will be made in uppercase and show in the widgets panel ( can have spaces )
  hideCard: true,
  isDeprecated: true,
  replacement: "PROGRESS_WIDGET",
  iconSVG: IconSVG,
  needsMeta: false,
  // Defines if this widget adds any meta properties
  isCanvas: false,
  // Defines if this widget has a canvas within in which we can drop other widgets
  defaults: {
    widgetName: "ProgressBar",
    rows: 4,
    columns: 28,
    isVisible: true,
    showResult: false,
    barType: BarType.INDETERMINATE,
    progress: 50,
    steps: 1,
    version: 1,
    responsiveBehavior: ResponsiveBehavior.Fill
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfOGVxb3htenRiIiwiYWN0dWFsQ292ZXJhZ2UiLCJSZXNwb25zaXZlQmVoYXZpb3IiLCJCYXJUeXBlIiwiSWNvblNWRyIsIldpZGdldCIsIkNPTkZJRyIsInMiLCJ0eXBlIiwiZ2V0V2lkZ2V0VHlwZSIsIm5hbWUiLCJoaWRlQ2FyZCIsImlzRGVwcmVjYXRlZCIsInJlcGxhY2VtZW50IiwiaWNvblNWRyIsIm5lZWRzTWV0YSIsImlzQ2FudmFzIiwiZGVmYXVsdHMiLCJ3aWRnZXROYW1lIiwicm93cyIsImNvbHVtbnMiLCJpc1Zpc2libGUiLCJzaG93UmVzdWx0IiwiYmFyVHlwZSIsIklOREVURVJNSU5BVEUiLCJwcm9ncmVzcyIsInN0ZXBzIiwidmVyc2lvbiIsInJlc3BvbnNpdmVCZWhhdmlvciIsIkZpbGwiLCJwcm9wZXJ0aWVzIiwiZGVyaXZlZCIsImdldERlcml2ZWRQcm9wZXJ0aWVzTWFwIiwiZGVmYXVsdCIsImdldERlZmF1bHRQcm9wZXJ0aWVzTWFwIiwibWV0YSIsImdldE1ldGFQcm9wZXJ0aWVzTWFwIiwiY29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lQ29uZmlnIiwic3R5bGVzaGVldENvbmZpZyIsImdldFN0eWxlc2hlZXRDb25maWciLCJhdXRvY29tcGxldGVEZWZpbml0aW9ucyIsImdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zIl0sInNvdXJjZXMiOlsiaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUmVzcG9uc2l2ZUJlaGF2aW9yIH0gZnJvbSBcInV0aWxzL2F1dG9MYXlvdXQvY29uc3RhbnRzXCI7XG5pbXBvcnQgeyBCYXJUeXBlIH0gZnJvbSBcIi4vY29uc3RhbnRzXCI7XG5pbXBvcnQgSWNvblNWRyBmcm9tIFwiLi9pY29uLnN2Z1wiO1xuaW1wb3J0IFdpZGdldCBmcm9tIFwiLi93aWRnZXRcIjtcblxuZXhwb3J0IGNvbnN0IENPTkZJRyA9IHtcbiAgdHlwZTogV2lkZ2V0LmdldFdpZGdldFR5cGUoKSxcbiAgbmFtZTogXCJQcm9ncmVzcyBCYXJcIiwgLy8gVGhlIGRpc3BsYXkgbmFtZSB3aGljaCB3aWxsIGJlIG1hZGUgaW4gdXBwZXJjYXNlIGFuZCBzaG93IGluIHRoZSB3aWRnZXRzIHBhbmVsICggY2FuIGhhdmUgc3BhY2VzIClcbiAgaGlkZUNhcmQ6IHRydWUsXG4gIGlzRGVwcmVjYXRlZDogdHJ1ZSxcbiAgcmVwbGFjZW1lbnQ6IFwiUFJPR1JFU1NfV0lER0VUXCIsXG4gIGljb25TVkc6IEljb25TVkcsXG4gIG5lZWRzTWV0YTogZmFsc2UsIC8vIERlZmluZXMgaWYgdGhpcyB3aWRnZXQgYWRkcyBhbnkgbWV0YSBwcm9wZXJ0aWVzXG4gIGlzQ2FudmFzOiBmYWxzZSwgLy8gRGVmaW5lcyBpZiB0aGlzIHdpZGdldCBoYXMgYSBjYW52YXMgd2l0aGluIGluIHdoaWNoIHdlIGNhbiBkcm9wIG90aGVyIHdpZGdldHNcbiAgZGVmYXVsdHM6IHtcbiAgICB3aWRnZXROYW1lOiBcIlByb2dyZXNzQmFyXCIsXG4gICAgcm93czogNCxcbiAgICBjb2x1bW5zOiAyOCxcbiAgICBpc1Zpc2libGU6IHRydWUsXG4gICAgc2hvd1Jlc3VsdDogZmFsc2UsXG4gICAgYmFyVHlwZTogQmFyVHlwZS5JTkRFVEVSTUlOQVRFLFxuICAgIHByb2dyZXNzOiA1MCxcbiAgICBzdGVwczogMSxcbiAgICB2ZXJzaW9uOiAxLFxuICAgIHJlc3BvbnNpdmVCZWhhdmlvcjogUmVzcG9uc2l2ZUJlaGF2aW9yLkZpbGwsXG4gIH0sXG4gIHByb3BlcnRpZXM6IHtcbiAgICBkZXJpdmVkOiBXaWRnZXQuZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAoKSxcbiAgICBkZWZhdWx0OiBXaWRnZXQuZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAoKSxcbiAgICBtZXRhOiBXaWRnZXQuZ2V0TWV0YVByb3BlcnRpZXNNYXAoKSxcbiAgICBjb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVDb25maWcoKSxcbiAgICBzdHlsZXNoZWV0Q29uZmlnOiBXaWRnZXQuZ2V0U3R5bGVzaGVldENvbmZpZygpLFxuICAgIGF1dG9jb21wbGV0ZURlZmluaXRpb25zOiBXaWRnZXQuZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMoKSxcbiAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFdpZGdldDtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxhQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxhQUFBO0FBZlosU0FBU0Usa0JBQWtCLFFBQVEsNEJBQTRCO0FBQy9ELFNBQVNDLE9BQU8sUUFBUSxhQUFhO0FBQ3JDLE9BQU9DLE9BQU8sTUFBTSxZQUFZO0FBQ2hDLE9BQU9DLE1BQU0sTUFBTSxVQUFVO0FBRTdCLE9BQU8sTUFBTUMsTUFBTSxJQUFBTixhQUFBLEdBQUFPLENBQUEsT0FBRztFQUNwQkMsSUFBSSxFQUFFSCxNQUFNLENBQUNJLGFBQWEsQ0FBQyxDQUFDO0VBQzVCQyxJQUFJLEVBQUUsY0FBYztFQUFFO0VBQ3RCQyxRQUFRLEVBQUUsSUFBSTtFQUNkQyxZQUFZLEVBQUUsSUFBSTtFQUNsQkMsV0FBVyxFQUFFLGlCQUFpQjtFQUM5QkMsT0FBTyxFQUFFVixPQUFPO0VBQ2hCVyxTQUFTLEVBQUUsS0FBSztFQUFFO0VBQ2xCQyxRQUFRLEVBQUUsS0FBSztFQUFFO0VBQ2pCQyxRQUFRLEVBQUU7SUFDUkMsVUFBVSxFQUFFLGFBQWE7SUFDekJDLElBQUksRUFBRSxDQUFDO0lBQ1BDLE9BQU8sRUFBRSxFQUFFO0lBQ1hDLFNBQVMsRUFBRSxJQUFJO0lBQ2ZDLFVBQVUsRUFBRSxLQUFLO0lBQ2pCQyxPQUFPLEVBQUVwQixPQUFPLENBQUNxQixhQUFhO0lBQzlCQyxRQUFRLEVBQUUsRUFBRTtJQUNaQyxLQUFLLEVBQUUsQ0FBQztJQUNSQyxPQUFPLEVBQUUsQ0FBQztJQUNWQyxrQkFBa0IsRUFBRTFCLGtCQUFrQixDQUFDMkI7RUFDekMsQ0FBQztFQUNEQyxVQUFVLEVBQUU7SUFDVkMsT0FBTyxFQUFFMUIsTUFBTSxDQUFDMkIsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsT0FBTyxFQUFFNUIsTUFBTSxDQUFDNkIsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsSUFBSSxFQUFFOUIsTUFBTSxDQUFDK0Isb0JBQW9CLENBQUMsQ0FBQztJQUNuQ0MsTUFBTSxFQUFFaEMsTUFBTSxDQUFDaUMscUJBQXFCLENBQUMsQ0FBQztJQUN0Q0MsZ0JBQWdCLEVBQUVsQyxNQUFNLENBQUNtQyxtQkFBbUIsQ0FBQyxDQUFDO0lBQzlDQyx1QkFBdUIsRUFBRXBDLE1BQU0sQ0FBQ3FDLDBCQUEwQixDQUFDO0VBQzdEO0FBQ0YsQ0FBQztBQUVELGVBQWVyQyxNQUFNIn0=