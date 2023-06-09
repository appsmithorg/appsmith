function cov_cl28mzx16() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/TextWidget/index.ts";
  var hash = "851998476c411253037692836f8c7a51a06161dd";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/TextWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 10,
          column: 22
        },
        end: {
          line: 73,
          column: 1
        }
      },
      "1": {
        start: {
          line: 62,
          column: 10
        },
        end: {
          line: 65,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 61,
            column: 23
          },
          end: {
            line: 61,
            column: 24
          }
        },
        loc: {
          start: {
            line: 61,
            column: 29
          },
          end: {
            line: 66,
            column: 9
          }
        },
        line: 61
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
    hash: "851998476c411253037692836f8c7a51a06161dd"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_cl28mzx16 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_cl28mzx16();
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { DEFAULT_FONT_SIZE } from "constants/WidgetConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { OverflowTypes } from "./constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
import { DynamicHeight } from "utils/WidgetFeatures";
export const CONFIG = (cov_cl28mzx16().s[0]++, {
  features: {
    dynamicHeight: {
      sectionIndex: 0,
      active: true
    }
  },
  type: Widget.getWidgetType(),
  name: "Text",
  iconSVG: IconSVG,
  searchTags: ["typography", "paragraph", "label"],
  defaults: {
    text: "Label",
    fontSize: DEFAULT_FONT_SIZE,
    fontStyle: "BOLD",
    textAlign: "LEFT",
    textColor: "#231F20",
    rows: 4,
    columns: 16,
    widgetName: "Text",
    shouldTruncate: false,
    overflow: OverflowTypes.NONE,
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
    autoDimension: {
      height: true
    },
    disabledPropsDefaults: {
      overflow: OverflowTypes.NONE,
      dynamicHeight: DynamicHeight.AUTO_HEIGHT
    },
    defaults: {
      columns: 4
    },
    widgetSize: [{
      viewportMinWidth: 0,
      configuration: () => {
        cov_cl28mzx16().f[0]++;
        cov_cl28mzx16().s[1]++;
        return {
          minWidth: "120px",
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfY2wyOG16eDE2IiwiYWN0dWFsQ292ZXJhZ2UiLCJGSUxMX1dJREdFVF9NSU5fV0lEVEgiLCJERUZBVUxUX0ZPTlRfU0laRSIsIlJlc3BvbnNpdmVCZWhhdmlvciIsIk92ZXJmbG93VHlwZXMiLCJJY29uU1ZHIiwiV2lkZ2V0IiwiRHluYW1pY0hlaWdodCIsIkNPTkZJRyIsInMiLCJmZWF0dXJlcyIsImR5bmFtaWNIZWlnaHQiLCJzZWN0aW9uSW5kZXgiLCJhY3RpdmUiLCJ0eXBlIiwiZ2V0V2lkZ2V0VHlwZSIsIm5hbWUiLCJpY29uU1ZHIiwic2VhcmNoVGFncyIsImRlZmF1bHRzIiwidGV4dCIsImZvbnRTaXplIiwiZm9udFN0eWxlIiwidGV4dEFsaWduIiwidGV4dENvbG9yIiwicm93cyIsImNvbHVtbnMiLCJ3aWRnZXROYW1lIiwic2hvdWxkVHJ1bmNhdGUiLCJvdmVyZmxvdyIsIk5PTkUiLCJ2ZXJzaW9uIiwiYW5pbWF0ZUxvYWRpbmciLCJyZXNwb25zaXZlQmVoYXZpb3IiLCJGaWxsIiwibWluV2lkdGgiLCJwcm9wZXJ0aWVzIiwiZGVyaXZlZCIsImdldERlcml2ZWRQcm9wZXJ0aWVzTWFwIiwiZGVmYXVsdCIsImdldERlZmF1bHRQcm9wZXJ0aWVzTWFwIiwibWV0YSIsImdldE1ldGFQcm9wZXJ0aWVzTWFwIiwiY29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lQ29uZmlnIiwiY29udGVudENvbmZpZyIsImdldFByb3BlcnR5UGFuZUNvbnRlbnRDb25maWciLCJzdHlsZUNvbmZpZyIsImdldFByb3BlcnR5UGFuZVN0eWxlQ29uZmlnIiwic3R5bGVzaGVldENvbmZpZyIsImdldFN0eWxlc2hlZXRDb25maWciLCJhdXRvY29tcGxldGVEZWZpbml0aW9ucyIsImdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiYXV0b0xheW91dCIsImF1dG9EaW1lbnNpb24iLCJoZWlnaHQiLCJkaXNhYmxlZFByb3BzRGVmYXVsdHMiLCJBVVRPX0hFSUdIVCIsIndpZGdldFNpemUiLCJ2aWV3cG9ydE1pbldpZHRoIiwiY29uZmlndXJhdGlvbiIsImYiLCJtaW5IZWlnaHQiLCJkaXNhYmxlUmVzaXplSGFuZGxlcyIsInZlcnRpY2FsIl0sInNvdXJjZXMiOlsiaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRklMTF9XSURHRVRfTUlOX1dJRFRIIH0gZnJvbSBcImNvbnN0YW50cy9taW5XaWR0aENvbnN0YW50c1wiO1xuaW1wb3J0IHsgREVGQVVMVF9GT05UX1NJWkUgfSBmcm9tIFwiY29uc3RhbnRzL1dpZGdldENvbnN0YW50c1wiO1xuaW1wb3J0IHsgUmVzcG9uc2l2ZUJlaGF2aW9yIH0gZnJvbSBcInV0aWxzL2F1dG9MYXlvdXQvY29uc3RhbnRzXCI7XG5pbXBvcnQgeyBPdmVyZmxvd1R5cGVzIH0gZnJvbSBcIi4vY29uc3RhbnRzXCI7XG5cbmltcG9ydCBJY29uU1ZHIGZyb20gXCIuL2ljb24uc3ZnXCI7XG5pbXBvcnQgV2lkZ2V0IGZyb20gXCIuL3dpZGdldFwiO1xuaW1wb3J0IHsgRHluYW1pY0hlaWdodCB9IGZyb20gXCJ1dGlscy9XaWRnZXRGZWF0dXJlc1wiO1xuXG5leHBvcnQgY29uc3QgQ09ORklHID0ge1xuICBmZWF0dXJlczoge1xuICAgIGR5bmFtaWNIZWlnaHQ6IHtcbiAgICAgIHNlY3Rpb25JbmRleDogMCxcbiAgICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICB9LFxuICB9LFxuICB0eXBlOiBXaWRnZXQuZ2V0V2lkZ2V0VHlwZSgpLFxuICBuYW1lOiBcIlRleHRcIixcbiAgaWNvblNWRzogSWNvblNWRyxcbiAgc2VhcmNoVGFnczogW1widHlwb2dyYXBoeVwiLCBcInBhcmFncmFwaFwiLCBcImxhYmVsXCJdLFxuICBkZWZhdWx0czoge1xuICAgIHRleHQ6IFwiTGFiZWxcIixcbiAgICBmb250U2l6ZTogREVGQVVMVF9GT05UX1NJWkUsXG4gICAgZm9udFN0eWxlOiBcIkJPTERcIixcbiAgICB0ZXh0QWxpZ246IFwiTEVGVFwiLFxuICAgIHRleHRDb2xvcjogXCIjMjMxRjIwXCIsXG4gICAgcm93czogNCxcbiAgICBjb2x1bW5zOiAxNixcbiAgICB3aWRnZXROYW1lOiBcIlRleHRcIixcbiAgICBzaG91bGRUcnVuY2F0ZTogZmFsc2UsXG4gICAgb3ZlcmZsb3c6IE92ZXJmbG93VHlwZXMuTk9ORSxcbiAgICB2ZXJzaW9uOiAxLFxuICAgIGFuaW1hdGVMb2FkaW5nOiB0cnVlLFxuICAgIHJlc3BvbnNpdmVCZWhhdmlvcjogUmVzcG9uc2l2ZUJlaGF2aW9yLkZpbGwsXG4gICAgbWluV2lkdGg6IEZJTExfV0lER0VUX01JTl9XSURUSCxcbiAgfSxcbiAgcHJvcGVydGllczoge1xuICAgIGRlcml2ZWQ6IFdpZGdldC5nZXREZXJpdmVkUHJvcGVydGllc01hcCgpLFxuICAgIGRlZmF1bHQ6IFdpZGdldC5nZXREZWZhdWx0UHJvcGVydGllc01hcCgpLFxuICAgIG1ldGE6IFdpZGdldC5nZXRNZXRhUHJvcGVydGllc01hcCgpLFxuICAgIGNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbmZpZygpLFxuICAgIGNvbnRlbnRDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnKCksXG4gICAgc3R5bGVDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVTdHlsZUNvbmZpZygpLFxuICAgIHN0eWxlc2hlZXRDb25maWc6IFdpZGdldC5nZXRTdHlsZXNoZWV0Q29uZmlnKCksXG4gICAgYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnM6IFdpZGdldC5nZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucygpLFxuICB9LFxuICBhdXRvTGF5b3V0OiB7XG4gICAgYXV0b0RpbWVuc2lvbjoge1xuICAgICAgaGVpZ2h0OiB0cnVlLFxuICAgIH0sXG4gICAgZGlzYWJsZWRQcm9wc0RlZmF1bHRzOiB7XG4gICAgICBvdmVyZmxvdzogT3ZlcmZsb3dUeXBlcy5OT05FLFxuICAgICAgZHluYW1pY0hlaWdodDogRHluYW1pY0hlaWdodC5BVVRPX0hFSUdIVCxcbiAgICB9LFxuICAgIGRlZmF1bHRzOiB7XG4gICAgICBjb2x1bW5zOiA0LFxuICAgIH0sXG4gICAgd2lkZ2V0U2l6ZTogW1xuICAgICAge1xuICAgICAgICB2aWV3cG9ydE1pbldpZHRoOiAwLFxuICAgICAgICBjb25maWd1cmF0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1pbldpZHRoOiBcIjEyMHB4XCIsXG4gICAgICAgICAgICBtaW5IZWlnaHQ6IFwiNDBweFwiLFxuICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF0sXG4gICAgZGlzYWJsZVJlc2l6ZUhhbmRsZXM6IHtcbiAgICAgIHZlcnRpY2FsOiB0cnVlLFxuICAgIH0sXG4gIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBXaWRnZXQ7XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxhQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxhQUFBO0FBZlosU0FBU0UscUJBQXFCLFFBQVEsNkJBQTZCO0FBQ25FLFNBQVNDLGlCQUFpQixRQUFRLDJCQUEyQjtBQUM3RCxTQUFTQyxrQkFBa0IsUUFBUSw0QkFBNEI7QUFDL0QsU0FBU0MsYUFBYSxRQUFRLGFBQWE7QUFFM0MsT0FBT0MsT0FBTyxNQUFNLFlBQVk7QUFDaEMsT0FBT0MsTUFBTSxNQUFNLFVBQVU7QUFDN0IsU0FBU0MsYUFBYSxRQUFRLHNCQUFzQjtBQUVwRCxPQUFPLE1BQU1DLE1BQU0sSUFBQVQsYUFBQSxHQUFBVSxDQUFBLE9BQUc7RUFDcEJDLFFBQVEsRUFBRTtJQUNSQyxhQUFhLEVBQUU7TUFDYkMsWUFBWSxFQUFFLENBQUM7TUFDZkMsTUFBTSxFQUFFO0lBQ1Y7RUFDRixDQUFDO0VBQ0RDLElBQUksRUFBRVIsTUFBTSxDQUFDUyxhQUFhLENBQUMsQ0FBQztFQUM1QkMsSUFBSSxFQUFFLE1BQU07RUFDWkMsT0FBTyxFQUFFWixPQUFPO0VBQ2hCYSxVQUFVLEVBQUUsQ0FBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLE9BQU8sQ0FBQztFQUNoREMsUUFBUSxFQUFFO0lBQ1JDLElBQUksRUFBRSxPQUFPO0lBQ2JDLFFBQVEsRUFBRW5CLGlCQUFpQjtJQUMzQm9CLFNBQVMsRUFBRSxNQUFNO0lBQ2pCQyxTQUFTLEVBQUUsTUFBTTtJQUNqQkMsU0FBUyxFQUFFLFNBQVM7SUFDcEJDLElBQUksRUFBRSxDQUFDO0lBQ1BDLE9BQU8sRUFBRSxFQUFFO0lBQ1hDLFVBQVUsRUFBRSxNQUFNO0lBQ2xCQyxjQUFjLEVBQUUsS0FBSztJQUNyQkMsUUFBUSxFQUFFekIsYUFBYSxDQUFDMEIsSUFBSTtJQUM1QkMsT0FBTyxFQUFFLENBQUM7SUFDVkMsY0FBYyxFQUFFLElBQUk7SUFDcEJDLGtCQUFrQixFQUFFOUIsa0JBQWtCLENBQUMrQixJQUFJO0lBQzNDQyxRQUFRLEVBQUVsQztFQUNaLENBQUM7RUFDRG1DLFVBQVUsRUFBRTtJQUNWQyxPQUFPLEVBQUUvQixNQUFNLENBQUNnQyx1QkFBdUIsQ0FBQyxDQUFDO0lBQ3pDQyxPQUFPLEVBQUVqQyxNQUFNLENBQUNrQyx1QkFBdUIsQ0FBQyxDQUFDO0lBQ3pDQyxJQUFJLEVBQUVuQyxNQUFNLENBQUNvQyxvQkFBb0IsQ0FBQyxDQUFDO0lBQ25DQyxNQUFNLEVBQUVyQyxNQUFNLENBQUNzQyxxQkFBcUIsQ0FBQyxDQUFDO0lBQ3RDQyxhQUFhLEVBQUV2QyxNQUFNLENBQUN3Qyw0QkFBNEIsQ0FBQyxDQUFDO0lBQ3BEQyxXQUFXLEVBQUV6QyxNQUFNLENBQUMwQywwQkFBMEIsQ0FBQyxDQUFDO0lBQ2hEQyxnQkFBZ0IsRUFBRTNDLE1BQU0sQ0FBQzRDLG1CQUFtQixDQUFDLENBQUM7SUFDOUNDLHVCQUF1QixFQUFFN0MsTUFBTSxDQUFDOEMsMEJBQTBCLENBQUM7RUFDN0QsQ0FBQztFQUNEQyxVQUFVLEVBQUU7SUFDVkMsYUFBYSxFQUFFO01BQ2JDLE1BQU0sRUFBRTtJQUNWLENBQUM7SUFDREMscUJBQXFCLEVBQUU7TUFDckIzQixRQUFRLEVBQUV6QixhQUFhLENBQUMwQixJQUFJO01BQzVCbkIsYUFBYSxFQUFFSixhQUFhLENBQUNrRDtJQUMvQixDQUFDO0lBQ0R0QyxRQUFRLEVBQUU7TUFDUk8sT0FBTyxFQUFFO0lBQ1gsQ0FBQztJQUNEZ0MsVUFBVSxFQUFFLENBQ1Y7TUFDRUMsZ0JBQWdCLEVBQUUsQ0FBQztNQUNuQkMsYUFBYSxFQUFFQSxDQUFBLEtBQU07UUFBQTdELGFBQUEsR0FBQThELENBQUE7UUFBQTlELGFBQUEsR0FBQVUsQ0FBQTtRQUNuQixPQUFPO1VBQ0wwQixRQUFRLEVBQUUsT0FBTztVQUNqQjJCLFNBQVMsRUFBRTtRQUNiLENBQUM7TUFDSDtJQUNGLENBQUMsQ0FDRjtJQUNEQyxvQkFBb0IsRUFBRTtNQUNwQkMsUUFBUSxFQUFFO0lBQ1o7RUFDRjtBQUNGLENBQUM7QUFFRCxlQUFlMUQsTUFBTSJ9