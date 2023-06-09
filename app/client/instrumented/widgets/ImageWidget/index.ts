function cov_1ayccl9iw() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/ImageWidget/index.ts";
  var hash = "ebb6b79ac0de113d8005fc12fe5bb4d8680b6916";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/ImageWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 6,
          column: 22
        },
        end: {
          line: 47,
          column: 1
        }
      },
      "1": {
        start: {
          line: 39,
          column: 10
        },
        end: {
          line: 42,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 38,
            column: 23
          },
          end: {
            line: 38,
            column: 24
          }
        },
        loc: {
          start: {
            line: 38,
            column: 29
          },
          end: {
            line: 43,
            column: 9
          }
        },
        line: 38
      }
    },
    branchMap: {},
    s: {
      "0": 0,
      "1": 0
    },
    f: {
      "0": 0
    },
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "ebb6b79ac0de113d8005fc12fe5bb4d8680b6916"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1ayccl9iw = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1ayccl9iw();
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
export const CONFIG = (cov_1ayccl9iw().s[0]++, {
  type: Widget.getWidgetType(),
  name: "Image",
  iconSVG: IconSVG,
  defaults: {
    defaultImage: getAssetUrl(`${ASSETS_CDN_URL}/widgets/default.png`),
    imageShape: "RECTANGLE",
    maxZoomLevel: 1,
    enableRotation: false,
    enableDownload: false,
    objectFit: "cover",
    image: "",
    rows: 12,
    columns: 12,
    widgetName: "Image",
    version: 1,
    animateLoading: true
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
    stylesheetConfig: Widget.getStylesheetConfig(),
    autocompleteDefinitions: Widget.getAutocompleteDefinitions()
  },
  autoLayout: {
    widgetSize: [{
      viewportMinWidth: 0,
      configuration: () => {
        cov_1ayccl9iw().f[0]++;
        cov_1ayccl9iw().s[1]++;
        return {
          minWidth: "280px",
          minHeight: "40px"
        };
      }
    }]
  }
});
export default Widget;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMWF5Y2NsOWl3IiwiYWN0dWFsQ292ZXJhZ2UiLCJBU1NFVFNfQ0ROX1VSTCIsIkljb25TVkciLCJXaWRnZXQiLCJnZXRBc3NldFVybCIsIkNPTkZJRyIsInMiLCJ0eXBlIiwiZ2V0V2lkZ2V0VHlwZSIsIm5hbWUiLCJpY29uU1ZHIiwiZGVmYXVsdHMiLCJkZWZhdWx0SW1hZ2UiLCJpbWFnZVNoYXBlIiwibWF4Wm9vbUxldmVsIiwiZW5hYmxlUm90YXRpb24iLCJlbmFibGVEb3dubG9hZCIsIm9iamVjdEZpdCIsImltYWdlIiwicm93cyIsImNvbHVtbnMiLCJ3aWRnZXROYW1lIiwidmVyc2lvbiIsImFuaW1hdGVMb2FkaW5nIiwicHJvcGVydGllcyIsImRlcml2ZWQiLCJnZXREZXJpdmVkUHJvcGVydGllc01hcCIsImRlZmF1bHQiLCJnZXREZWZhdWx0UHJvcGVydGllc01hcCIsIm1ldGEiLCJnZXRNZXRhUHJvcGVydGllc01hcCIsImNvbmZpZyIsImdldFByb3BlcnR5UGFuZUNvbmZpZyIsImNvbnRlbnRDb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnIiwic3R5bGVDb25maWciLCJnZXRQcm9wZXJ0eVBhbmVTdHlsZUNvbmZpZyIsInN0eWxlc2hlZXRDb25maWciLCJnZXRTdHlsZXNoZWV0Q29uZmlnIiwiYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiLCJnZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucyIsImF1dG9MYXlvdXQiLCJ3aWRnZXRTaXplIiwidmlld3BvcnRNaW5XaWR0aCIsImNvbmZpZ3VyYXRpb24iLCJmIiwibWluV2lkdGgiLCJtaW5IZWlnaHQiXSwic291cmNlcyI6WyJpbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBU1NFVFNfQ0ROX1VSTCB9IGZyb20gXCJjb25zdGFudHMvVGhpcmRQYXJ0eUNvbnN0YW50c1wiO1xuaW1wb3J0IEljb25TVkcgZnJvbSBcIi4vaWNvbi5zdmdcIjtcbmltcG9ydCBXaWRnZXQgZnJvbSBcIi4vd2lkZ2V0XCI7XG5pbXBvcnQgeyBnZXRBc3NldFVybCB9IGZyb20gXCJAYXBwc21pdGgvdXRpbHMvYWlyZ2FwSGVscGVyc1wiO1xuXG5leHBvcnQgY29uc3QgQ09ORklHID0ge1xuICB0eXBlOiBXaWRnZXQuZ2V0V2lkZ2V0VHlwZSgpLFxuICBuYW1lOiBcIkltYWdlXCIsXG4gIGljb25TVkc6IEljb25TVkcsXG4gIGRlZmF1bHRzOiB7XG4gICAgZGVmYXVsdEltYWdlOiBnZXRBc3NldFVybChgJHtBU1NFVFNfQ0ROX1VSTH0vd2lkZ2V0cy9kZWZhdWx0LnBuZ2ApLFxuICAgIGltYWdlU2hhcGU6IFwiUkVDVEFOR0xFXCIsXG4gICAgbWF4Wm9vbUxldmVsOiAxLFxuICAgIGVuYWJsZVJvdGF0aW9uOiBmYWxzZSxcbiAgICBlbmFibGVEb3dubG9hZDogZmFsc2UsXG4gICAgb2JqZWN0Rml0OiBcImNvdmVyXCIsXG4gICAgaW1hZ2U6IFwiXCIsXG4gICAgcm93czogMTIsXG4gICAgY29sdW1uczogMTIsXG4gICAgd2lkZ2V0TmFtZTogXCJJbWFnZVwiLFxuICAgIHZlcnNpb246IDEsXG4gICAgYW5pbWF0ZUxvYWRpbmc6IHRydWUsXG4gIH0sXG4gIHByb3BlcnRpZXM6IHtcbiAgICBkZXJpdmVkOiBXaWRnZXQuZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAoKSxcbiAgICBkZWZhdWx0OiBXaWRnZXQuZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAoKSxcbiAgICBtZXRhOiBXaWRnZXQuZ2V0TWV0YVByb3BlcnRpZXNNYXAoKSxcbiAgICBjb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVDb25maWcoKSxcbiAgICBjb250ZW50Q29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lQ29udGVudENvbmZpZygpLFxuICAgIHN0eWxlQ29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lU3R5bGVDb25maWcoKSxcbiAgICBzdHlsZXNoZWV0Q29uZmlnOiBXaWRnZXQuZ2V0U3R5bGVzaGVldENvbmZpZygpLFxuICAgIGF1dG9jb21wbGV0ZURlZmluaXRpb25zOiBXaWRnZXQuZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMoKSxcbiAgfSxcbiAgYXV0b0xheW91dDoge1xuICAgIHdpZGdldFNpemU6IFtcbiAgICAgIHtcbiAgICAgICAgdmlld3BvcnRNaW5XaWR0aDogMCxcbiAgICAgICAgY29uZmlndXJhdGlvbjogKCkgPT4ge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtaW5XaWR0aDogXCIyODBweFwiLFxuICAgICAgICAgICAgbWluSGVpZ2h0OiBcIjQwcHhcIixcbiAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdLFxuICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgV2lkZ2V0O1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsYUFBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsYUFBQTtBQWZaLFNBQVNFLGNBQWMsUUFBUSwrQkFBK0I7QUFDOUQsT0FBT0MsT0FBTyxNQUFNLFlBQVk7QUFDaEMsT0FBT0MsTUFBTSxNQUFNLFVBQVU7QUFDN0IsU0FBU0MsV0FBVyxRQUFRLCtCQUErQjtBQUUzRCxPQUFPLE1BQU1DLE1BQU0sSUFBQU4sYUFBQSxHQUFBTyxDQUFBLE9BQUc7RUFDcEJDLElBQUksRUFBRUosTUFBTSxDQUFDSyxhQUFhLENBQUMsQ0FBQztFQUM1QkMsSUFBSSxFQUFFLE9BQU87RUFDYkMsT0FBTyxFQUFFUixPQUFPO0VBQ2hCUyxRQUFRLEVBQUU7SUFDUkMsWUFBWSxFQUFFUixXQUFXLENBQUUsR0FBRUgsY0FBZSxzQkFBcUIsQ0FBQztJQUNsRVksVUFBVSxFQUFFLFdBQVc7SUFDdkJDLFlBQVksRUFBRSxDQUFDO0lBQ2ZDLGNBQWMsRUFBRSxLQUFLO0lBQ3JCQyxjQUFjLEVBQUUsS0FBSztJQUNyQkMsU0FBUyxFQUFFLE9BQU87SUFDbEJDLEtBQUssRUFBRSxFQUFFO0lBQ1RDLElBQUksRUFBRSxFQUFFO0lBQ1JDLE9BQU8sRUFBRSxFQUFFO0lBQ1hDLFVBQVUsRUFBRSxPQUFPO0lBQ25CQyxPQUFPLEVBQUUsQ0FBQztJQUNWQyxjQUFjLEVBQUU7RUFDbEIsQ0FBQztFQUNEQyxVQUFVLEVBQUU7SUFDVkMsT0FBTyxFQUFFdEIsTUFBTSxDQUFDdUIsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsT0FBTyxFQUFFeEIsTUFBTSxDQUFDeUIsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsSUFBSSxFQUFFMUIsTUFBTSxDQUFDMkIsb0JBQW9CLENBQUMsQ0FBQztJQUNuQ0MsTUFBTSxFQUFFNUIsTUFBTSxDQUFDNkIscUJBQXFCLENBQUMsQ0FBQztJQUN0Q0MsYUFBYSxFQUFFOUIsTUFBTSxDQUFDK0IsNEJBQTRCLENBQUMsQ0FBQztJQUNwREMsV0FBVyxFQUFFaEMsTUFBTSxDQUFDaUMsMEJBQTBCLENBQUMsQ0FBQztJQUNoREMsZ0JBQWdCLEVBQUVsQyxNQUFNLENBQUNtQyxtQkFBbUIsQ0FBQyxDQUFDO0lBQzlDQyx1QkFBdUIsRUFBRXBDLE1BQU0sQ0FBQ3FDLDBCQUEwQixDQUFDO0VBQzdELENBQUM7RUFDREMsVUFBVSxFQUFFO0lBQ1ZDLFVBQVUsRUFBRSxDQUNWO01BQ0VDLGdCQUFnQixFQUFFLENBQUM7TUFDbkJDLGFBQWEsRUFBRUEsQ0FBQSxLQUFNO1FBQUE3QyxhQUFBLEdBQUE4QyxDQUFBO1FBQUE5QyxhQUFBLEdBQUFPLENBQUE7UUFDbkIsT0FBTztVQUNMd0MsUUFBUSxFQUFFLE9BQU87VUFDakJDLFNBQVMsRUFBRTtRQUNiLENBQUM7TUFDSDtJQUNGLENBQUM7RUFFTDtBQUNGLENBQUM7QUFFRCxlQUFlNUMsTUFBTSJ9