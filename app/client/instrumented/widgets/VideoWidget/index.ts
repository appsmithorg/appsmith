function cov_1pv9o5awa3() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/VideoWidget/index.ts";
  var hash = "235dccef896e012504fe3cf279daccb251bf63a8";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/VideoWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 7,
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
    hash: "235dccef896e012504fe3cf279daccb251bf63a8"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1pv9o5awa3 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1pv9o5awa3();
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
export const CONFIG = (cov_1pv9o5awa3().s[0]++, {
  type: Widget.getWidgetType(),
  name: "Video",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["youtube"],
  defaults: {
    rows: 28,
    columns: 24,
    widgetName: "Video",
    url: getAssetUrl(`${ASSETS_CDN_URL}/widgets/bird.mp4`),
    autoPlay: false,
    version: 1,
    animateLoading: true,
    backgroundColor: "#000",
    responsiveBehavior: ResponsiveBehavior.Fill
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
        cov_1pv9o5awa3().f[0]++;
        cov_1pv9o5awa3().s[1]++;
        return {
          minWidth: "280px",
          minHeight: "300px"
        };
      }
    }]
  }
});
export default Widget;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMXB2OW81YXdhMyIsImFjdHVhbENvdmVyYWdlIiwiQVNTRVRTX0NETl9VUkwiLCJSZXNwb25zaXZlQmVoYXZpb3IiLCJJY29uU1ZHIiwiV2lkZ2V0IiwiZ2V0QXNzZXRVcmwiLCJDT05GSUciLCJzIiwidHlwZSIsImdldFdpZGdldFR5cGUiLCJuYW1lIiwiaWNvblNWRyIsIm5lZWRzTWV0YSIsInNlYXJjaFRhZ3MiLCJkZWZhdWx0cyIsInJvd3MiLCJjb2x1bW5zIiwid2lkZ2V0TmFtZSIsInVybCIsImF1dG9QbGF5IiwidmVyc2lvbiIsImFuaW1hdGVMb2FkaW5nIiwiYmFja2dyb3VuZENvbG9yIiwicmVzcG9uc2l2ZUJlaGF2aW9yIiwiRmlsbCIsInByb3BlcnRpZXMiLCJkZXJpdmVkIiwiZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAiLCJkZWZhdWx0IiwiZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAiLCJtZXRhIiwiZ2V0TWV0YVByb3BlcnRpZXNNYXAiLCJjb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb25maWciLCJjb250ZW50Q29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lQ29udGVudENvbmZpZyIsInN0eWxlQ29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lU3R5bGVDb25maWciLCJzdHlsZXNoZWV0Q29uZmlnIiwiZ2V0U3R5bGVzaGVldENvbmZpZyIsImF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiLCJhdXRvTGF5b3V0Iiwid2lkZ2V0U2l6ZSIsInZpZXdwb3J0TWluV2lkdGgiLCJjb25maWd1cmF0aW9uIiwiZiIsIm1pbldpZHRoIiwibWluSGVpZ2h0Il0sInNvdXJjZXMiOlsiaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQVNTRVRTX0NETl9VUkwgfSBmcm9tIFwiY29uc3RhbnRzL1RoaXJkUGFydHlDb25zdGFudHNcIjtcbmltcG9ydCB7IFJlc3BvbnNpdmVCZWhhdmlvciB9IGZyb20gXCJ1dGlscy9hdXRvTGF5b3V0L2NvbnN0YW50c1wiO1xuaW1wb3J0IEljb25TVkcgZnJvbSBcIi4vaWNvbi5zdmdcIjtcbmltcG9ydCBXaWRnZXQgZnJvbSBcIi4vd2lkZ2V0XCI7XG5pbXBvcnQgeyBnZXRBc3NldFVybCB9IGZyb20gXCJAYXBwc21pdGgvdXRpbHMvYWlyZ2FwSGVscGVyc1wiO1xuXG5leHBvcnQgY29uc3QgQ09ORklHID0ge1xuICB0eXBlOiBXaWRnZXQuZ2V0V2lkZ2V0VHlwZSgpLFxuICBuYW1lOiBcIlZpZGVvXCIsXG4gIGljb25TVkc6IEljb25TVkcsXG4gIG5lZWRzTWV0YTogdHJ1ZSxcbiAgc2VhcmNoVGFnczogW1wieW91dHViZVwiXSxcbiAgZGVmYXVsdHM6IHtcbiAgICByb3dzOiAyOCxcbiAgICBjb2x1bW5zOiAyNCxcbiAgICB3aWRnZXROYW1lOiBcIlZpZGVvXCIsXG4gICAgdXJsOiBnZXRBc3NldFVybChgJHtBU1NFVFNfQ0ROX1VSTH0vd2lkZ2V0cy9iaXJkLm1wNGApLFxuICAgIGF1dG9QbGF5OiBmYWxzZSxcbiAgICB2ZXJzaW9uOiAxLFxuICAgIGFuaW1hdGVMb2FkaW5nOiB0cnVlLFxuICAgIGJhY2tncm91bmRDb2xvcjogXCIjMDAwXCIsXG4gICAgcmVzcG9uc2l2ZUJlaGF2aW9yOiBSZXNwb25zaXZlQmVoYXZpb3IuRmlsbCxcbiAgfSxcbiAgcHJvcGVydGllczoge1xuICAgIGRlcml2ZWQ6IFdpZGdldC5nZXREZXJpdmVkUHJvcGVydGllc01hcCgpLFxuICAgIGRlZmF1bHQ6IFdpZGdldC5nZXREZWZhdWx0UHJvcGVydGllc01hcCgpLFxuICAgIG1ldGE6IFdpZGdldC5nZXRNZXRhUHJvcGVydGllc01hcCgpLFxuICAgIGNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbmZpZygpLFxuICAgIGNvbnRlbnRDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnKCksXG4gICAgc3R5bGVDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVTdHlsZUNvbmZpZygpLFxuICAgIHN0eWxlc2hlZXRDb25maWc6IFdpZGdldC5nZXRTdHlsZXNoZWV0Q29uZmlnKCksXG4gICAgYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnM6IFdpZGdldC5nZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucygpLFxuICB9LFxuICBhdXRvTGF5b3V0OiB7XG4gICAgd2lkZ2V0U2l6ZTogW1xuICAgICAge1xuICAgICAgICB2aWV3cG9ydE1pbldpZHRoOiAwLFxuICAgICAgICBjb25maWd1cmF0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1pbldpZHRoOiBcIjI4MHB4XCIsXG4gICAgICAgICAgICBtaW5IZWlnaHQ6IFwiMzAwcHhcIixcbiAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdLFxuICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgV2lkZ2V0O1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsY0FBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsY0FBQTtBQWZaLFNBQVNFLGNBQWMsUUFBUSwrQkFBK0I7QUFDOUQsU0FBU0Msa0JBQWtCLFFBQVEsNEJBQTRCO0FBQy9ELE9BQU9DLE9BQU8sTUFBTSxZQUFZO0FBQ2hDLE9BQU9DLE1BQU0sTUFBTSxVQUFVO0FBQzdCLFNBQVNDLFdBQVcsUUFBUSwrQkFBK0I7QUFFM0QsT0FBTyxNQUFNQyxNQUFNLElBQUFQLGNBQUEsR0FBQVEsQ0FBQSxPQUFHO0VBQ3BCQyxJQUFJLEVBQUVKLE1BQU0sQ0FBQ0ssYUFBYSxDQUFDLENBQUM7RUFDNUJDLElBQUksRUFBRSxPQUFPO0VBQ2JDLE9BQU8sRUFBRVIsT0FBTztFQUNoQlMsU0FBUyxFQUFFLElBQUk7RUFDZkMsVUFBVSxFQUFFLENBQUMsU0FBUyxDQUFDO0VBQ3ZCQyxRQUFRLEVBQUU7SUFDUkMsSUFBSSxFQUFFLEVBQUU7SUFDUkMsT0FBTyxFQUFFLEVBQUU7SUFDWEMsVUFBVSxFQUFFLE9BQU87SUFDbkJDLEdBQUcsRUFBRWIsV0FBVyxDQUFFLEdBQUVKLGNBQWUsbUJBQWtCLENBQUM7SUFDdERrQixRQUFRLEVBQUUsS0FBSztJQUNmQyxPQUFPLEVBQUUsQ0FBQztJQUNWQyxjQUFjLEVBQUUsSUFBSTtJQUNwQkMsZUFBZSxFQUFFLE1BQU07SUFDdkJDLGtCQUFrQixFQUFFckIsa0JBQWtCLENBQUNzQjtFQUN6QyxDQUFDO0VBQ0RDLFVBQVUsRUFBRTtJQUNWQyxPQUFPLEVBQUV0QixNQUFNLENBQUN1Qix1QkFBdUIsQ0FBQyxDQUFDO0lBQ3pDQyxPQUFPLEVBQUV4QixNQUFNLENBQUN5Qix1QkFBdUIsQ0FBQyxDQUFDO0lBQ3pDQyxJQUFJLEVBQUUxQixNQUFNLENBQUMyQixvQkFBb0IsQ0FBQyxDQUFDO0lBQ25DQyxNQUFNLEVBQUU1QixNQUFNLENBQUM2QixxQkFBcUIsQ0FBQyxDQUFDO0lBQ3RDQyxhQUFhLEVBQUU5QixNQUFNLENBQUMrQiw0QkFBNEIsQ0FBQyxDQUFDO0lBQ3BEQyxXQUFXLEVBQUVoQyxNQUFNLENBQUNpQywwQkFBMEIsQ0FBQyxDQUFDO0lBQ2hEQyxnQkFBZ0IsRUFBRWxDLE1BQU0sQ0FBQ21DLG1CQUFtQixDQUFDLENBQUM7SUFDOUNDLHVCQUF1QixFQUFFcEMsTUFBTSxDQUFDcUMsMEJBQTBCLENBQUM7RUFDN0QsQ0FBQztFQUNEQyxVQUFVLEVBQUU7SUFDVkMsVUFBVSxFQUFFLENBQ1Y7TUFDRUMsZ0JBQWdCLEVBQUUsQ0FBQztNQUNuQkMsYUFBYSxFQUFFQSxDQUFBLEtBQU07UUFBQTlDLGNBQUEsR0FBQStDLENBQUE7UUFBQS9DLGNBQUEsR0FBQVEsQ0FBQTtRQUNuQixPQUFPO1VBQ0x3QyxRQUFRLEVBQUUsT0FBTztVQUNqQkMsU0FBUyxFQUFFO1FBQ2IsQ0FBQztNQUNIO0lBQ0YsQ0FBQztFQUVMO0FBQ0YsQ0FBQztBQUVELGVBQWU1QyxNQUFNIn0=