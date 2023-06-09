function cov_21b4vpb4su() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/MapChartWidget/index.ts";
  var hash = "85312a1423fcea7ae6d060ba0d07d10bcb14d794";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/MapChartWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 8,
          column: 22
        },
        end: {
          line: 67,
          column: 1
        }
      },
      "1": {
        start: {
          line: 59,
          column: 10
        },
        end: {
          line: 62,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 58,
            column: 23
          },
          end: {
            line: 58,
            column: 24
          }
        },
        loc: {
          start: {
            line: 58,
            column: 29
          },
          end: {
            line: 63,
            column: 9
          }
        },
        line: 58
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
    hash: "85312a1423fcea7ae6d060ba0d07d10bcb14d794"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_21b4vpb4su = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_21b4vpb4su();
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { dataSetForWorld, MapTypes } from "./constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_21b4vpb4su().s[0]++, {
  type: Widget.getWidgetType(),
  name: "Map Chart",
  // The display name which will be made in uppercase and show in the widgets panel ( can have spaces )
  iconSVG: IconSVG,
  needsMeta: true,
  // Defines if this widget adds any meta properties
  isCanvas: false,
  // Defines if this widget has a canvas within in which we can drop other widgets
  searchTags: ["graph", "visuals", "visualisations"],
  defaults: {
    rows: 32,
    columns: 24,
    widgetName: "MapChart",
    version: 1,
    mapType: MapTypes.WORLD,
    mapTitle: "Global Population",
    showLabels: true,
    data: dataSetForWorld,
    colorRange: [{
      minValue: 0.5,
      maxValue: 1.0,
      code: "#FFD74D"
    }, {
      minValue: 1.0,
      maxValue: 2.0,
      code: "#FB8C00"
    }, {
      minValue: 2.0,
      maxValue: 3.0,
      code: "#E65100"
    }],
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
        cov_21b4vpb4su().f[0]++;
        cov_21b4vpb4su().s[1]++;
        return {
          minWidth: "280px",
          minHeight: "300px"
        };
      }
    }]
  }
});
export default Widget;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMjFiNHZwYjRzdSIsImFjdHVhbENvdmVyYWdlIiwiRklMTF9XSURHRVRfTUlOX1dJRFRIIiwiUmVzcG9uc2l2ZUJlaGF2aW9yIiwiZGF0YVNldEZvcldvcmxkIiwiTWFwVHlwZXMiLCJJY29uU1ZHIiwiV2lkZ2V0IiwiQ09ORklHIiwicyIsInR5cGUiLCJnZXRXaWRnZXRUeXBlIiwibmFtZSIsImljb25TVkciLCJuZWVkc01ldGEiLCJpc0NhbnZhcyIsInNlYXJjaFRhZ3MiLCJkZWZhdWx0cyIsInJvd3MiLCJjb2x1bW5zIiwid2lkZ2V0TmFtZSIsInZlcnNpb24iLCJtYXBUeXBlIiwiV09STEQiLCJtYXBUaXRsZSIsInNob3dMYWJlbHMiLCJkYXRhIiwiY29sb3JSYW5nZSIsIm1pblZhbHVlIiwibWF4VmFsdWUiLCJjb2RlIiwicmVzcG9uc2l2ZUJlaGF2aW9yIiwiRmlsbCIsIm1pbldpZHRoIiwicHJvcGVydGllcyIsImRlcml2ZWQiLCJnZXREZXJpdmVkUHJvcGVydGllc01hcCIsImRlZmF1bHQiLCJnZXREZWZhdWx0UHJvcGVydGllc01hcCIsIm1ldGEiLCJnZXRNZXRhUHJvcGVydGllc01hcCIsImNvbmZpZyIsImdldFByb3BlcnR5UGFuZUNvbmZpZyIsImNvbnRlbnRDb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnIiwic3R5bGVDb25maWciLCJnZXRQcm9wZXJ0eVBhbmVTdHlsZUNvbmZpZyIsInN0eWxlc2hlZXRDb25maWciLCJnZXRTdHlsZXNoZWV0Q29uZmlnIiwiYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiLCJnZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucyIsImF1dG9MYXlvdXQiLCJ3aWRnZXRTaXplIiwidmlld3BvcnRNaW5XaWR0aCIsImNvbmZpZ3VyYXRpb24iLCJmIiwibWluSGVpZ2h0Il0sInNvdXJjZXMiOlsiaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRklMTF9XSURHRVRfTUlOX1dJRFRIIH0gZnJvbSBcImNvbnN0YW50cy9taW5XaWR0aENvbnN0YW50c1wiO1xuaW1wb3J0IHsgUmVzcG9uc2l2ZUJlaGF2aW9yIH0gZnJvbSBcInV0aWxzL2F1dG9MYXlvdXQvY29uc3RhbnRzXCI7XG5cbmltcG9ydCB7IGRhdGFTZXRGb3JXb3JsZCwgTWFwVHlwZXMgfSBmcm9tIFwiLi9jb25zdGFudHNcIjtcbmltcG9ydCBJY29uU1ZHIGZyb20gXCIuL2ljb24uc3ZnXCI7XG5pbXBvcnQgV2lkZ2V0IGZyb20gXCIuL3dpZGdldFwiO1xuXG5leHBvcnQgY29uc3QgQ09ORklHID0ge1xuICB0eXBlOiBXaWRnZXQuZ2V0V2lkZ2V0VHlwZSgpLFxuICBuYW1lOiBcIk1hcCBDaGFydFwiLCAvLyBUaGUgZGlzcGxheSBuYW1lIHdoaWNoIHdpbGwgYmUgbWFkZSBpbiB1cHBlcmNhc2UgYW5kIHNob3cgaW4gdGhlIHdpZGdldHMgcGFuZWwgKCBjYW4gaGF2ZSBzcGFjZXMgKVxuICBpY29uU1ZHOiBJY29uU1ZHLFxuICBuZWVkc01ldGE6IHRydWUsIC8vIERlZmluZXMgaWYgdGhpcyB3aWRnZXQgYWRkcyBhbnkgbWV0YSBwcm9wZXJ0aWVzXG4gIGlzQ2FudmFzOiBmYWxzZSwgLy8gRGVmaW5lcyBpZiB0aGlzIHdpZGdldCBoYXMgYSBjYW52YXMgd2l0aGluIGluIHdoaWNoIHdlIGNhbiBkcm9wIG90aGVyIHdpZGdldHNcbiAgc2VhcmNoVGFnczogW1wiZ3JhcGhcIiwgXCJ2aXN1YWxzXCIsIFwidmlzdWFsaXNhdGlvbnNcIl0sXG4gIGRlZmF1bHRzOiB7XG4gICAgcm93czogMzIsXG4gICAgY29sdW1uczogMjQsXG4gICAgd2lkZ2V0TmFtZTogXCJNYXBDaGFydFwiLFxuICAgIHZlcnNpb246IDEsXG4gICAgbWFwVHlwZTogTWFwVHlwZXMuV09STEQsXG4gICAgbWFwVGl0bGU6IFwiR2xvYmFsIFBvcHVsYXRpb25cIixcbiAgICBzaG93TGFiZWxzOiB0cnVlLFxuICAgIGRhdGE6IGRhdGFTZXRGb3JXb3JsZCxcbiAgICBjb2xvclJhbmdlOiBbXG4gICAgICB7XG4gICAgICAgIG1pblZhbHVlOiAwLjUsXG4gICAgICAgIG1heFZhbHVlOiAxLjAsXG4gICAgICAgIGNvZGU6IFwiI0ZGRDc0RFwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbWluVmFsdWU6IDEuMCxcbiAgICAgICAgbWF4VmFsdWU6IDIuMCxcbiAgICAgICAgY29kZTogXCIjRkI4QzAwXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBtaW5WYWx1ZTogMi4wLFxuICAgICAgICBtYXhWYWx1ZTogMy4wLFxuICAgICAgICBjb2RlOiBcIiNFNjUxMDBcIixcbiAgICAgIH0sXG4gICAgXSxcbiAgICByZXNwb25zaXZlQmVoYXZpb3I6IFJlc3BvbnNpdmVCZWhhdmlvci5GaWxsLFxuICAgIG1pbldpZHRoOiBGSUxMX1dJREdFVF9NSU5fV0lEVEgsXG4gIH0sXG4gIHByb3BlcnRpZXM6IHtcbiAgICBkZXJpdmVkOiBXaWRnZXQuZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAoKSxcbiAgICBkZWZhdWx0OiBXaWRnZXQuZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAoKSxcbiAgICBtZXRhOiBXaWRnZXQuZ2V0TWV0YVByb3BlcnRpZXNNYXAoKSxcbiAgICBjb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVDb25maWcoKSxcbiAgICBjb250ZW50Q29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lQ29udGVudENvbmZpZygpLFxuICAgIHN0eWxlQ29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lU3R5bGVDb25maWcoKSxcbiAgICBzdHlsZXNoZWV0Q29uZmlnOiBXaWRnZXQuZ2V0U3R5bGVzaGVldENvbmZpZygpLFxuICAgIGF1dG9jb21wbGV0ZURlZmluaXRpb25zOiBXaWRnZXQuZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMoKSxcbiAgfSxcbiAgYXV0b0xheW91dDoge1xuICAgIHdpZGdldFNpemU6IFtcbiAgICAgIHtcbiAgICAgICAgdmlld3BvcnRNaW5XaWR0aDogMCxcbiAgICAgICAgY29uZmlndXJhdGlvbjogKCkgPT4ge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtaW5XaWR0aDogXCIyODBweFwiLFxuICAgICAgICAgICAgbWluSGVpZ2h0OiBcIjMwMHB4XCIsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFdpZGdldDtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGNBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGNBQUE7QUFmWixTQUFTRSxxQkFBcUIsUUFBUSw2QkFBNkI7QUFDbkUsU0FBU0Msa0JBQWtCLFFBQVEsNEJBQTRCO0FBRS9ELFNBQVNDLGVBQWUsRUFBRUMsUUFBUSxRQUFRLGFBQWE7QUFDdkQsT0FBT0MsT0FBTyxNQUFNLFlBQVk7QUFDaEMsT0FBT0MsTUFBTSxNQUFNLFVBQVU7QUFFN0IsT0FBTyxNQUFNQyxNQUFNLElBQUFSLGNBQUEsR0FBQVMsQ0FBQSxPQUFHO0VBQ3BCQyxJQUFJLEVBQUVILE1BQU0sQ0FBQ0ksYUFBYSxDQUFDLENBQUM7RUFDNUJDLElBQUksRUFBRSxXQUFXO0VBQUU7RUFDbkJDLE9BQU8sRUFBRVAsT0FBTztFQUNoQlEsU0FBUyxFQUFFLElBQUk7RUFBRTtFQUNqQkMsUUFBUSxFQUFFLEtBQUs7RUFBRTtFQUNqQkMsVUFBVSxFQUFFLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxnQkFBZ0IsQ0FBQztFQUNsREMsUUFBUSxFQUFFO0lBQ1JDLElBQUksRUFBRSxFQUFFO0lBQ1JDLE9BQU8sRUFBRSxFQUFFO0lBQ1hDLFVBQVUsRUFBRSxVQUFVO0lBQ3RCQyxPQUFPLEVBQUUsQ0FBQztJQUNWQyxPQUFPLEVBQUVqQixRQUFRLENBQUNrQixLQUFLO0lBQ3ZCQyxRQUFRLEVBQUUsbUJBQW1CO0lBQzdCQyxVQUFVLEVBQUUsSUFBSTtJQUNoQkMsSUFBSSxFQUFFdEIsZUFBZTtJQUNyQnVCLFVBQVUsRUFBRSxDQUNWO01BQ0VDLFFBQVEsRUFBRSxHQUFHO01BQ2JDLFFBQVEsRUFBRSxHQUFHO01BQ2JDLElBQUksRUFBRTtJQUNSLENBQUMsRUFDRDtNQUNFRixRQUFRLEVBQUUsR0FBRztNQUNiQyxRQUFRLEVBQUUsR0FBRztNQUNiQyxJQUFJLEVBQUU7SUFDUixDQUFDLEVBQ0Q7TUFDRUYsUUFBUSxFQUFFLEdBQUc7TUFDYkMsUUFBUSxFQUFFLEdBQUc7TUFDYkMsSUFBSSxFQUFFO0lBQ1IsQ0FBQyxDQUNGO0lBQ0RDLGtCQUFrQixFQUFFNUIsa0JBQWtCLENBQUM2QixJQUFJO0lBQzNDQyxRQUFRLEVBQUUvQjtFQUNaLENBQUM7RUFDRGdDLFVBQVUsRUFBRTtJQUNWQyxPQUFPLEVBQUU1QixNQUFNLENBQUM2Qix1QkFBdUIsQ0FBQyxDQUFDO0lBQ3pDQyxPQUFPLEVBQUU5QixNQUFNLENBQUMrQix1QkFBdUIsQ0FBQyxDQUFDO0lBQ3pDQyxJQUFJLEVBQUVoQyxNQUFNLENBQUNpQyxvQkFBb0IsQ0FBQyxDQUFDO0lBQ25DQyxNQUFNLEVBQUVsQyxNQUFNLENBQUNtQyxxQkFBcUIsQ0FBQyxDQUFDO0lBQ3RDQyxhQUFhLEVBQUVwQyxNQUFNLENBQUNxQyw0QkFBNEIsQ0FBQyxDQUFDO0lBQ3BEQyxXQUFXLEVBQUV0QyxNQUFNLENBQUN1QywwQkFBMEIsQ0FBQyxDQUFDO0lBQ2hEQyxnQkFBZ0IsRUFBRXhDLE1BQU0sQ0FBQ3lDLG1CQUFtQixDQUFDLENBQUM7SUFDOUNDLHVCQUF1QixFQUFFMUMsTUFBTSxDQUFDMkMsMEJBQTBCLENBQUM7RUFDN0QsQ0FBQztFQUNEQyxVQUFVLEVBQUU7SUFDVkMsVUFBVSxFQUFFLENBQ1Y7TUFDRUMsZ0JBQWdCLEVBQUUsQ0FBQztNQUNuQkMsYUFBYSxFQUFFQSxDQUFBLEtBQU07UUFBQXRELGNBQUEsR0FBQXVELENBQUE7UUFBQXZELGNBQUEsR0FBQVMsQ0FBQTtRQUNuQixPQUFPO1VBQ0x3QixRQUFRLEVBQUUsT0FBTztVQUNqQnVCLFNBQVMsRUFBRTtRQUNiLENBQUM7TUFDSDtJQUNGLENBQUM7RUFFTDtBQUNGLENBQUM7QUFFRCxlQUFlakQsTUFBTSJ9