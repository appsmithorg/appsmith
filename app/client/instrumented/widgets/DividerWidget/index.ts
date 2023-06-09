function cov_2rl71o37mx() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/DividerWidget/index.ts";
  var hash = "f2fc9b1dac8f8d8b376dca5ed1c9b58b07cd4bc9";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/DividerWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 8,
          column: 22
        },
        end: {
          line: 54,
          column: 1
        }
      },
      "1": {
        start: {
          line: 43,
          column: 10
        },
        end: {
          line: 46,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 42,
            column: 23
          },
          end: {
            line: 42,
            column: 24
          }
        },
        loc: {
          start: {
            line: 42,
            column: 29
          },
          end: {
            line: 47,
            column: 9
          }
        },
        line: 42
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
    hash: "f2fc9b1dac8f8d8b376dca5ed1c9b58b07cd4bc9"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_2rl71o37mx = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_2rl71o37mx();
import { Colors } from "constants/Colors";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_2rl71o37mx().s[0]++, {
  type: Widget.getWidgetType(),
  name: "Divider",
  iconSVG: IconSVG,
  searchTags: ["line"],
  defaults: {
    rows: 4,
    columns: 20,
    widgetName: "Divider",
    orientation: "horizontal",
    capType: "nc",
    capSide: 0,
    strokeStyle: "solid",
    dividerColor: Colors.GRAY,
    thickness: 2,
    isVisible: true,
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
    autocompleteDefinitions: Widget.getAutocompleteDefinitions()
  },
  autoLayout: {
    widgetSize: [{
      viewportMinWidth: 0,
      configuration: () => {
        cov_2rl71o37mx().f[0]++;
        cov_2rl71o37mx().s[1]++;
        return {
          minWidth: "280px",
          minHeight: "40px"
        };
      }
    }],
    disableResizeHandles: {
      vertical: true
    }
  }
});
export default Widget;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMnJsNzFvMzdteCIsImFjdHVhbENvdmVyYWdlIiwiQ29sb3JzIiwiRklMTF9XSURHRVRfTUlOX1dJRFRIIiwiUmVzcG9uc2l2ZUJlaGF2aW9yIiwiSWNvblNWRyIsIldpZGdldCIsIkNPTkZJRyIsInMiLCJ0eXBlIiwiZ2V0V2lkZ2V0VHlwZSIsIm5hbWUiLCJpY29uU1ZHIiwic2VhcmNoVGFncyIsImRlZmF1bHRzIiwicm93cyIsImNvbHVtbnMiLCJ3aWRnZXROYW1lIiwib3JpZW50YXRpb24iLCJjYXBUeXBlIiwiY2FwU2lkZSIsInN0cm9rZVN0eWxlIiwiZGl2aWRlckNvbG9yIiwiR1JBWSIsInRoaWNrbmVzcyIsImlzVmlzaWJsZSIsInZlcnNpb24iLCJhbmltYXRlTG9hZGluZyIsInJlc3BvbnNpdmVCZWhhdmlvciIsIkZpbGwiLCJtaW5XaWR0aCIsInByb3BlcnRpZXMiLCJkZXJpdmVkIiwiZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAiLCJkZWZhdWx0IiwiZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAiLCJtZXRhIiwiZ2V0TWV0YVByb3BlcnRpZXNNYXAiLCJjb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb25maWciLCJjb250ZW50Q29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lQ29udGVudENvbmZpZyIsInN0eWxlQ29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lU3R5bGVDb25maWciLCJhdXRvY29tcGxldGVEZWZpbml0aW9ucyIsImdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiYXV0b0xheW91dCIsIndpZGdldFNpemUiLCJ2aWV3cG9ydE1pbldpZHRoIiwiY29uZmlndXJhdGlvbiIsImYiLCJtaW5IZWlnaHQiLCJkaXNhYmxlUmVzaXplSGFuZGxlcyIsInZlcnRpY2FsIl0sInNvdXJjZXMiOlsiaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29sb3JzIH0gZnJvbSBcImNvbnN0YW50cy9Db2xvcnNcIjtcbmltcG9ydCB7IEZJTExfV0lER0VUX01JTl9XSURUSCB9IGZyb20gXCJjb25zdGFudHMvbWluV2lkdGhDb25zdGFudHNcIjtcbmltcG9ydCB7IFJlc3BvbnNpdmVCZWhhdmlvciB9IGZyb20gXCJ1dGlscy9hdXRvTGF5b3V0L2NvbnN0YW50c1wiO1xuXG5pbXBvcnQgSWNvblNWRyBmcm9tIFwiLi9pY29uLnN2Z1wiO1xuaW1wb3J0IFdpZGdldCBmcm9tIFwiLi93aWRnZXRcIjtcblxuZXhwb3J0IGNvbnN0IENPTkZJRyA9IHtcbiAgdHlwZTogV2lkZ2V0LmdldFdpZGdldFR5cGUoKSxcbiAgbmFtZTogXCJEaXZpZGVyXCIsXG4gIGljb25TVkc6IEljb25TVkcsXG4gIHNlYXJjaFRhZ3M6IFtcImxpbmVcIl0sXG4gIGRlZmF1bHRzOiB7XG4gICAgcm93czogNCxcbiAgICBjb2x1bW5zOiAyMCxcbiAgICB3aWRnZXROYW1lOiBcIkRpdmlkZXJcIixcbiAgICBvcmllbnRhdGlvbjogXCJob3Jpem9udGFsXCIsXG4gICAgY2FwVHlwZTogXCJuY1wiLFxuICAgIGNhcFNpZGU6IDAsXG4gICAgc3Ryb2tlU3R5bGU6IFwic29saWRcIixcbiAgICBkaXZpZGVyQ29sb3I6IENvbG9ycy5HUkFZLFxuICAgIHRoaWNrbmVzczogMixcbiAgICBpc1Zpc2libGU6IHRydWUsXG4gICAgdmVyc2lvbjogMSxcbiAgICBhbmltYXRlTG9hZGluZzogdHJ1ZSxcbiAgICByZXNwb25zaXZlQmVoYXZpb3I6IFJlc3BvbnNpdmVCZWhhdmlvci5GaWxsLFxuICAgIG1pbldpZHRoOiBGSUxMX1dJREdFVF9NSU5fV0lEVEgsXG4gIH0sXG4gIHByb3BlcnRpZXM6IHtcbiAgICBkZXJpdmVkOiBXaWRnZXQuZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAoKSxcbiAgICBkZWZhdWx0OiBXaWRnZXQuZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAoKSxcbiAgICBtZXRhOiBXaWRnZXQuZ2V0TWV0YVByb3BlcnRpZXNNYXAoKSxcbiAgICBjb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVDb25maWcoKSxcbiAgICBjb250ZW50Q29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lQ29udGVudENvbmZpZygpLFxuICAgIHN0eWxlQ29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lU3R5bGVDb25maWcoKSxcbiAgICBhdXRvY29tcGxldGVEZWZpbml0aW9uczogV2lkZ2V0LmdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zKCksXG4gIH0sXG4gIGF1dG9MYXlvdXQ6IHtcbiAgICB3aWRnZXRTaXplOiBbXG4gICAgICB7XG4gICAgICAgIHZpZXdwb3J0TWluV2lkdGg6IDAsXG4gICAgICAgIGNvbmZpZ3VyYXRpb246ICgpID0+IHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWluV2lkdGg6IFwiMjgwcHhcIixcbiAgICAgICAgICAgIG1pbkhlaWdodDogXCI0MHB4XCIsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSxcbiAgICBkaXNhYmxlUmVzaXplSGFuZGxlczoge1xuICAgICAgdmVydGljYWw6IHRydWUsXG4gICAgfSxcbiAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFdpZGdldDtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGNBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGNBQUE7QUFmWixTQUFTRSxNQUFNLFFBQVEsa0JBQWtCO0FBQ3pDLFNBQVNDLHFCQUFxQixRQUFRLDZCQUE2QjtBQUNuRSxTQUFTQyxrQkFBa0IsUUFBUSw0QkFBNEI7QUFFL0QsT0FBT0MsT0FBTyxNQUFNLFlBQVk7QUFDaEMsT0FBT0MsTUFBTSxNQUFNLFVBQVU7QUFFN0IsT0FBTyxNQUFNQyxNQUFNLElBQUFQLGNBQUEsR0FBQVEsQ0FBQSxPQUFHO0VBQ3BCQyxJQUFJLEVBQUVILE1BQU0sQ0FBQ0ksYUFBYSxDQUFDLENBQUM7RUFDNUJDLElBQUksRUFBRSxTQUFTO0VBQ2ZDLE9BQU8sRUFBRVAsT0FBTztFQUNoQlEsVUFBVSxFQUFFLENBQUMsTUFBTSxDQUFDO0VBQ3BCQyxRQUFRLEVBQUU7SUFDUkMsSUFBSSxFQUFFLENBQUM7SUFDUEMsT0FBTyxFQUFFLEVBQUU7SUFDWEMsVUFBVSxFQUFFLFNBQVM7SUFDckJDLFdBQVcsRUFBRSxZQUFZO0lBQ3pCQyxPQUFPLEVBQUUsSUFBSTtJQUNiQyxPQUFPLEVBQUUsQ0FBQztJQUNWQyxXQUFXLEVBQUUsT0FBTztJQUNwQkMsWUFBWSxFQUFFcEIsTUFBTSxDQUFDcUIsSUFBSTtJQUN6QkMsU0FBUyxFQUFFLENBQUM7SUFDWkMsU0FBUyxFQUFFLElBQUk7SUFDZkMsT0FBTyxFQUFFLENBQUM7SUFDVkMsY0FBYyxFQUFFLElBQUk7SUFDcEJDLGtCQUFrQixFQUFFeEIsa0JBQWtCLENBQUN5QixJQUFJO0lBQzNDQyxRQUFRLEVBQUUzQjtFQUNaLENBQUM7RUFDRDRCLFVBQVUsRUFBRTtJQUNWQyxPQUFPLEVBQUUxQixNQUFNLENBQUMyQix1QkFBdUIsQ0FBQyxDQUFDO0lBQ3pDQyxPQUFPLEVBQUU1QixNQUFNLENBQUM2Qix1QkFBdUIsQ0FBQyxDQUFDO0lBQ3pDQyxJQUFJLEVBQUU5QixNQUFNLENBQUMrQixvQkFBb0IsQ0FBQyxDQUFDO0lBQ25DQyxNQUFNLEVBQUVoQyxNQUFNLENBQUNpQyxxQkFBcUIsQ0FBQyxDQUFDO0lBQ3RDQyxhQUFhLEVBQUVsQyxNQUFNLENBQUNtQyw0QkFBNEIsQ0FBQyxDQUFDO0lBQ3BEQyxXQUFXLEVBQUVwQyxNQUFNLENBQUNxQywwQkFBMEIsQ0FBQyxDQUFDO0lBQ2hEQyx1QkFBdUIsRUFBRXRDLE1BQU0sQ0FBQ3VDLDBCQUEwQixDQUFDO0VBQzdELENBQUM7RUFDREMsVUFBVSxFQUFFO0lBQ1ZDLFVBQVUsRUFBRSxDQUNWO01BQ0VDLGdCQUFnQixFQUFFLENBQUM7TUFDbkJDLGFBQWEsRUFBRUEsQ0FBQSxLQUFNO1FBQUFqRCxjQUFBLEdBQUFrRCxDQUFBO1FBQUFsRCxjQUFBLEdBQUFRLENBQUE7UUFDbkIsT0FBTztVQUNMc0IsUUFBUSxFQUFFLE9BQU87VUFDakJxQixTQUFTLEVBQUU7UUFDYixDQUFDO01BQ0g7SUFDRixDQUFDLENBQ0Y7SUFDREMsb0JBQW9CLEVBQUU7TUFDcEJDLFFBQVEsRUFBRTtJQUNaO0VBQ0Y7QUFDRixDQUFDO0FBRUQsZUFBZS9DLE1BQU0ifQ==