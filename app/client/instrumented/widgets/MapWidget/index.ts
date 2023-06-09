function cov_1nmavnwuhl() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/MapWidget/index.ts";
  var hash = "7d1b102578f06fe1261da8c2115aecc085e0ec3f";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/MapWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 7,
          column: 22
        },
        end: {
          line: 53,
          column: 1
        }
      },
      "1": {
        start: {
          line: 45,
          column: 10
        },
        end: {
          line: 48,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 44,
            column: 23
          },
          end: {
            line: 44,
            column: 24
          }
        },
        loc: {
          start: {
            line: 44,
            column: 29
          },
          end: {
            line: 49,
            column: 9
          }
        },
        line: 44
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
    hash: "7d1b102578f06fe1261da8c2115aecc085e0ec3f"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1nmavnwuhl = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1nmavnwuhl();
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_1nmavnwuhl().s[0]++, {
  type: Widget.getWidgetType(),
  name: "Map",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 40,
    columns: 24,
    isDisabled: false,
    isVisible: true,
    widgetName: "Map",
    enableSearch: true,
    zoomLevel: 50,
    enablePickLocation: true,
    allowZoom: true,
    mapCenter: {
      lat: 25.122,
      long: 50.132
    },
    defaultMarkers: [{
      lat: 25.122,
      long: 50.132,
      title: "Location1"
    }],
    isClickedMarkerCentered: true,
    version: 1,
    animateLoading: true,
    responsiveBehavior: ResponsiveBehavior.Fill,
    minWidth: FILL_WIDGET_MIN_WIDTH
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
        cov_1nmavnwuhl().f[0]++;
        cov_1nmavnwuhl().s[1]++;
        return {
          minWidth: "280px",
          minHeight: "300px"
        };
      }
    }]
  }
});
export default Widget;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMW5tYXZud3VobCIsImFjdHVhbENvdmVyYWdlIiwiRklMTF9XSURHRVRfTUlOX1dJRFRIIiwiUmVzcG9uc2l2ZUJlaGF2aW9yIiwiSWNvblNWRyIsIldpZGdldCIsIkNPTkZJRyIsInMiLCJ0eXBlIiwiZ2V0V2lkZ2V0VHlwZSIsIm5hbWUiLCJpY29uU1ZHIiwibmVlZHNNZXRhIiwiZGVmYXVsdHMiLCJyb3dzIiwiY29sdW1ucyIsImlzRGlzYWJsZWQiLCJpc1Zpc2libGUiLCJ3aWRnZXROYW1lIiwiZW5hYmxlU2VhcmNoIiwiem9vbUxldmVsIiwiZW5hYmxlUGlja0xvY2F0aW9uIiwiYWxsb3dab29tIiwibWFwQ2VudGVyIiwibGF0IiwibG9uZyIsImRlZmF1bHRNYXJrZXJzIiwidGl0bGUiLCJpc0NsaWNrZWRNYXJrZXJDZW50ZXJlZCIsInZlcnNpb24iLCJhbmltYXRlTG9hZGluZyIsInJlc3BvbnNpdmVCZWhhdmlvciIsIkZpbGwiLCJtaW5XaWR0aCIsInByb3BlcnRpZXMiLCJkZXJpdmVkIiwiZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAiLCJkZWZhdWx0IiwiZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAiLCJtZXRhIiwiZ2V0TWV0YVByb3BlcnRpZXNNYXAiLCJjb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb25maWciLCJjb250ZW50Q29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lQ29udGVudENvbmZpZyIsInN0eWxlQ29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lU3R5bGVDb25maWciLCJzdHlsZXNoZWV0Q29uZmlnIiwiZ2V0U3R5bGVzaGVldENvbmZpZyIsImF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiLCJhdXRvTGF5b3V0Iiwid2lkZ2V0U2l6ZSIsInZpZXdwb3J0TWluV2lkdGgiLCJjb25maWd1cmF0aW9uIiwiZiIsIm1pbkhlaWdodCJdLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEZJTExfV0lER0VUX01JTl9XSURUSCB9IGZyb20gXCJjb25zdGFudHMvbWluV2lkdGhDb25zdGFudHNcIjtcbmltcG9ydCB7IFJlc3BvbnNpdmVCZWhhdmlvciB9IGZyb20gXCJ1dGlscy9hdXRvTGF5b3V0L2NvbnN0YW50c1wiO1xuXG5pbXBvcnQgSWNvblNWRyBmcm9tIFwiLi9pY29uLnN2Z1wiO1xuaW1wb3J0IFdpZGdldCBmcm9tIFwiLi93aWRnZXRcIjtcblxuZXhwb3J0IGNvbnN0IENPTkZJRyA9IHtcbiAgdHlwZTogV2lkZ2V0LmdldFdpZGdldFR5cGUoKSxcbiAgbmFtZTogXCJNYXBcIixcbiAgaWNvblNWRzogSWNvblNWRyxcbiAgbmVlZHNNZXRhOiB0cnVlLFxuICBkZWZhdWx0czoge1xuICAgIHJvd3M6IDQwLFxuICAgIGNvbHVtbnM6IDI0LFxuICAgIGlzRGlzYWJsZWQ6IGZhbHNlLFxuICAgIGlzVmlzaWJsZTogdHJ1ZSxcbiAgICB3aWRnZXROYW1lOiBcIk1hcFwiLFxuICAgIGVuYWJsZVNlYXJjaDogdHJ1ZSxcbiAgICB6b29tTGV2ZWw6IDUwLFxuICAgIGVuYWJsZVBpY2tMb2NhdGlvbjogdHJ1ZSxcbiAgICBhbGxvd1pvb206IHRydWUsXG4gICAgbWFwQ2VudGVyOiB7IGxhdDogMjUuMTIyLCBsb25nOiA1MC4xMzIgfSxcbiAgICBkZWZhdWx0TWFya2VyczogW3sgbGF0OiAyNS4xMjIsIGxvbmc6IDUwLjEzMiwgdGl0bGU6IFwiTG9jYXRpb24xXCIgfV0sXG4gICAgaXNDbGlja2VkTWFya2VyQ2VudGVyZWQ6IHRydWUsXG4gICAgdmVyc2lvbjogMSxcbiAgICBhbmltYXRlTG9hZGluZzogdHJ1ZSxcbiAgICByZXNwb25zaXZlQmVoYXZpb3I6IFJlc3BvbnNpdmVCZWhhdmlvci5GaWxsLFxuICAgIG1pbldpZHRoOiBGSUxMX1dJREdFVF9NSU5fV0lEVEgsXG4gIH0sXG4gIHByb3BlcnRpZXM6IHtcbiAgICBkZXJpdmVkOiBXaWRnZXQuZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAoKSxcbiAgICBkZWZhdWx0OiBXaWRnZXQuZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAoKSxcbiAgICBtZXRhOiBXaWRnZXQuZ2V0TWV0YVByb3BlcnRpZXNNYXAoKSxcbiAgICBjb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVDb25maWcoKSxcbiAgICBjb250ZW50Q29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lQ29udGVudENvbmZpZygpLFxuICAgIHN0eWxlQ29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lU3R5bGVDb25maWcoKSxcbiAgICBzdHlsZXNoZWV0Q29uZmlnOiBXaWRnZXQuZ2V0U3R5bGVzaGVldENvbmZpZygpLFxuICAgIGF1dG9jb21wbGV0ZURlZmluaXRpb25zOiBXaWRnZXQuZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMoKSxcbiAgfSxcbiAgYXV0b0xheW91dDoge1xuICAgIHdpZGdldFNpemU6IFtcbiAgICAgIHtcbiAgICAgICAgdmlld3BvcnRNaW5XaWR0aDogMCxcbiAgICAgICAgY29uZmlndXJhdGlvbjogKCkgPT4ge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtaW5XaWR0aDogXCIyODBweFwiLFxuICAgICAgICAgICAgbWluSGVpZ2h0OiBcIjMwMHB4XCIsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFdpZGdldDtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGNBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGNBQUE7QUFmWixTQUFTRSxxQkFBcUIsUUFBUSw2QkFBNkI7QUFDbkUsU0FBU0Msa0JBQWtCLFFBQVEsNEJBQTRCO0FBRS9ELE9BQU9DLE9BQU8sTUFBTSxZQUFZO0FBQ2hDLE9BQU9DLE1BQU0sTUFBTSxVQUFVO0FBRTdCLE9BQU8sTUFBTUMsTUFBTSxJQUFBTixjQUFBLEdBQUFPLENBQUEsT0FBRztFQUNwQkMsSUFBSSxFQUFFSCxNQUFNLENBQUNJLGFBQWEsQ0FBQyxDQUFDO0VBQzVCQyxJQUFJLEVBQUUsS0FBSztFQUNYQyxPQUFPLEVBQUVQLE9BQU87RUFDaEJRLFNBQVMsRUFBRSxJQUFJO0VBQ2ZDLFFBQVEsRUFBRTtJQUNSQyxJQUFJLEVBQUUsRUFBRTtJQUNSQyxPQUFPLEVBQUUsRUFBRTtJQUNYQyxVQUFVLEVBQUUsS0FBSztJQUNqQkMsU0FBUyxFQUFFLElBQUk7SUFDZkMsVUFBVSxFQUFFLEtBQUs7SUFDakJDLFlBQVksRUFBRSxJQUFJO0lBQ2xCQyxTQUFTLEVBQUUsRUFBRTtJQUNiQyxrQkFBa0IsRUFBRSxJQUFJO0lBQ3hCQyxTQUFTLEVBQUUsSUFBSTtJQUNmQyxTQUFTLEVBQUU7TUFBRUMsR0FBRyxFQUFFLE1BQU07TUFBRUMsSUFBSSxFQUFFO0lBQU8sQ0FBQztJQUN4Q0MsY0FBYyxFQUFFLENBQUM7TUFBRUYsR0FBRyxFQUFFLE1BQU07TUFBRUMsSUFBSSxFQUFFLE1BQU07TUFBRUUsS0FBSyxFQUFFO0lBQVksQ0FBQyxDQUFDO0lBQ25FQyx1QkFBdUIsRUFBRSxJQUFJO0lBQzdCQyxPQUFPLEVBQUUsQ0FBQztJQUNWQyxjQUFjLEVBQUUsSUFBSTtJQUNwQkMsa0JBQWtCLEVBQUU1QixrQkFBa0IsQ0FBQzZCLElBQUk7SUFDM0NDLFFBQVEsRUFBRS9CO0VBQ1osQ0FBQztFQUNEZ0MsVUFBVSxFQUFFO0lBQ1ZDLE9BQU8sRUFBRTlCLE1BQU0sQ0FBQytCLHVCQUF1QixDQUFDLENBQUM7SUFDekNDLE9BQU8sRUFBRWhDLE1BQU0sQ0FBQ2lDLHVCQUF1QixDQUFDLENBQUM7SUFDekNDLElBQUksRUFBRWxDLE1BQU0sQ0FBQ21DLG9CQUFvQixDQUFDLENBQUM7SUFDbkNDLE1BQU0sRUFBRXBDLE1BQU0sQ0FBQ3FDLHFCQUFxQixDQUFDLENBQUM7SUFDdENDLGFBQWEsRUFBRXRDLE1BQU0sQ0FBQ3VDLDRCQUE0QixDQUFDLENBQUM7SUFDcERDLFdBQVcsRUFBRXhDLE1BQU0sQ0FBQ3lDLDBCQUEwQixDQUFDLENBQUM7SUFDaERDLGdCQUFnQixFQUFFMUMsTUFBTSxDQUFDMkMsbUJBQW1CLENBQUMsQ0FBQztJQUM5Q0MsdUJBQXVCLEVBQUU1QyxNQUFNLENBQUM2QywwQkFBMEIsQ0FBQztFQUM3RCxDQUFDO0VBQ0RDLFVBQVUsRUFBRTtJQUNWQyxVQUFVLEVBQUUsQ0FDVjtNQUNFQyxnQkFBZ0IsRUFBRSxDQUFDO01BQ25CQyxhQUFhLEVBQUVBLENBQUEsS0FBTTtRQUFBdEQsY0FBQSxHQUFBdUQsQ0FBQTtRQUFBdkQsY0FBQSxHQUFBTyxDQUFBO1FBQ25CLE9BQU87VUFDTDBCLFFBQVEsRUFBRSxPQUFPO1VBQ2pCdUIsU0FBUyxFQUFFO1FBQ2IsQ0FBQztNQUNIO0lBQ0YsQ0FBQztFQUVMO0FBQ0YsQ0FBQztBQUVELGVBQWVuRCxNQUFNIn0=