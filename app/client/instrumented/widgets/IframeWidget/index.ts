function cov_etqq0ruty() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/IframeWidget/index.ts";
  var hash = "9f9aad2c0a04d06074c5714f569674a06a3033a5";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/IframeWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 6,
          column: 28
        },
        end: {
          line: 6,
          column: 41
        }
      },
      "1": {
        start: {
          line: 8,
          column: 30
        },
        end: {
          line: 10,
          column: 6
        }
      },
      "2": {
        start: {
          line: 12,
          column: 22
        },
        end: {
          line: 52,
          column: 1
        }
      },
      "3": {
        start: {
          line: 44,
          column: 10
        },
        end: {
          line: 47,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 43,
            column: 23
          },
          end: {
            line: 43,
            column: 24
          }
        },
        loc: {
          start: {
            line: 43,
            column: 29
          },
          end: {
            line: 48,
            column: 9
          }
        },
        line: 43
      }
    },
    branchMap: {
      "0": {
        loc: {
          start: {
            line: 8,
            column: 30
          },
          end: {
            line: 10,
            column: 6
          }
        },
        type: "cond-expr",
        locations: [{
          start: {
            line: 9,
            column: 4
          },
          end: {
            line: 9,
            column: 29
          }
        }, {
          start: {
            line: 10,
            column: 4
          },
          end: {
            line: 10,
            column: 6
          }
        }],
        line: 8
      }
    },
    s: {
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 0
    },
    f: {
      "0": 0
    },
    b: {
      "0": [0, 0]
    },
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "9f9aad2c0a04d06074c5714f569674a06a3033a5"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_etqq0ruty = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_etqq0ruty();
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
const isAirgappedInstance = (cov_etqq0ruty().s[0]++, isAirgapped());
const DEFAULT_IFRAME_SOURCE = (cov_etqq0ruty().s[1]++, !isAirgappedInstance ? (cov_etqq0ruty().b[0][0]++, "https://www.example.com") : (cov_etqq0ruty().b[0][1]++, ""));
export const CONFIG = (cov_etqq0ruty().s[2]++, {
  type: Widget.getWidgetType(),
  name: "Iframe",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["embed"],
  defaults: {
    source: DEFAULT_IFRAME_SOURCE,
    borderOpacity: 100,
    borderWidth: 1,
    rows: 32,
    columns: 24,
    widgetName: "Iframe",
    version: 1,
    animateLoading: true,
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
        cov_etqq0ruty().f[0]++;
        cov_etqq0ruty().s[3]++;
        return {
          minWidth: "280px",
          minHeight: "300px"
        };
      }
    }]
  }
});
export default Widget;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfZXRxcTBydXR5IiwiYWN0dWFsQ292ZXJhZ2UiLCJSZXNwb25zaXZlQmVoYXZpb3IiLCJJY29uU1ZHIiwiV2lkZ2V0IiwiaXNBaXJnYXBwZWQiLCJpc0FpcmdhcHBlZEluc3RhbmNlIiwicyIsIkRFRkFVTFRfSUZSQU1FX1NPVVJDRSIsImIiLCJDT05GSUciLCJ0eXBlIiwiZ2V0V2lkZ2V0VHlwZSIsIm5hbWUiLCJpY29uU1ZHIiwibmVlZHNNZXRhIiwic2VhcmNoVGFncyIsImRlZmF1bHRzIiwic291cmNlIiwiYm9yZGVyT3BhY2l0eSIsImJvcmRlcldpZHRoIiwicm93cyIsImNvbHVtbnMiLCJ3aWRnZXROYW1lIiwidmVyc2lvbiIsImFuaW1hdGVMb2FkaW5nIiwicmVzcG9uc2l2ZUJlaGF2aW9yIiwiRmlsbCIsInByb3BlcnRpZXMiLCJkZXJpdmVkIiwiZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAiLCJkZWZhdWx0IiwiZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAiLCJtZXRhIiwiZ2V0TWV0YVByb3BlcnRpZXNNYXAiLCJjb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb25maWciLCJjb250ZW50Q29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lQ29udGVudENvbmZpZyIsInN0eWxlQ29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lU3R5bGVDb25maWciLCJzdHlsZXNoZWV0Q29uZmlnIiwiZ2V0U3R5bGVzaGVldENvbmZpZyIsImF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiLCJhdXRvTGF5b3V0Iiwid2lkZ2V0U2l6ZSIsInZpZXdwb3J0TWluV2lkdGgiLCJjb25maWd1cmF0aW9uIiwiZiIsIm1pbldpZHRoIiwibWluSGVpZ2h0Il0sInNvdXJjZXMiOlsiaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUmVzcG9uc2l2ZUJlaGF2aW9yIH0gZnJvbSBcInV0aWxzL2F1dG9MYXlvdXQvY29uc3RhbnRzXCI7XG5pbXBvcnQgSWNvblNWRyBmcm9tIFwiLi9pY29uLnN2Z1wiO1xuaW1wb3J0IFdpZGdldCBmcm9tIFwiLi93aWRnZXRcIjtcbmltcG9ydCB7IGlzQWlyZ2FwcGVkIH0gZnJvbSBcIkBhcHBzbWl0aC91dGlscy9haXJnYXBIZWxwZXJzXCI7XG5cbmNvbnN0IGlzQWlyZ2FwcGVkSW5zdGFuY2UgPSBpc0FpcmdhcHBlZCgpO1xuXG5jb25zdCBERUZBVUxUX0lGUkFNRV9TT1VSQ0UgPSAhaXNBaXJnYXBwZWRJbnN0YW5jZVxuICA/IFwiaHR0cHM6Ly93d3cuZXhhbXBsZS5jb21cIlxuICA6IFwiXCI7XG5cbmV4cG9ydCBjb25zdCBDT05GSUcgPSB7XG4gIHR5cGU6IFdpZGdldC5nZXRXaWRnZXRUeXBlKCksXG4gIG5hbWU6IFwiSWZyYW1lXCIsXG4gIGljb25TVkc6IEljb25TVkcsXG4gIG5lZWRzTWV0YTogdHJ1ZSxcbiAgc2VhcmNoVGFnczogW1wiZW1iZWRcIl0sXG4gIGRlZmF1bHRzOiB7XG4gICAgc291cmNlOiBERUZBVUxUX0lGUkFNRV9TT1VSQ0UsXG4gICAgYm9yZGVyT3BhY2l0eTogMTAwLFxuICAgIGJvcmRlcldpZHRoOiAxLFxuICAgIHJvd3M6IDMyLFxuICAgIGNvbHVtbnM6IDI0LFxuICAgIHdpZGdldE5hbWU6IFwiSWZyYW1lXCIsXG4gICAgdmVyc2lvbjogMSxcbiAgICBhbmltYXRlTG9hZGluZzogdHJ1ZSxcbiAgICByZXNwb25zaXZlQmVoYXZpb3I6IFJlc3BvbnNpdmVCZWhhdmlvci5GaWxsLFxuICB9LFxuICBwcm9wZXJ0aWVzOiB7XG4gICAgZGVyaXZlZDogV2lkZ2V0LmdldERlcml2ZWRQcm9wZXJ0aWVzTWFwKCksXG4gICAgZGVmYXVsdDogV2lkZ2V0LmdldERlZmF1bHRQcm9wZXJ0aWVzTWFwKCksXG4gICAgbWV0YTogV2lkZ2V0LmdldE1ldGFQcm9wZXJ0aWVzTWFwKCksXG4gICAgY29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lQ29uZmlnKCksXG4gICAgY29udGVudENvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbnRlbnRDb25maWcoKSxcbiAgICBzdHlsZUNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZVN0eWxlQ29uZmlnKCksXG4gICAgc3R5bGVzaGVldENvbmZpZzogV2lkZ2V0LmdldFN0eWxlc2hlZXRDb25maWcoKSxcbiAgICBhdXRvY29tcGxldGVEZWZpbml0aW9uczogV2lkZ2V0LmdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zKCksXG4gIH0sXG4gIGF1dG9MYXlvdXQ6IHtcbiAgICB3aWRnZXRTaXplOiBbXG4gICAgICB7XG4gICAgICAgIHZpZXdwb3J0TWluV2lkdGg6IDAsXG4gICAgICAgIGNvbmZpZ3VyYXRpb246ICgpID0+IHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWluV2lkdGg6IFwiMjgwcHhcIixcbiAgICAgICAgICAgIG1pbkhlaWdodDogXCIzMDBweFwiLFxuICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF0sXG4gIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBXaWRnZXQ7XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsYUFBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsYUFBQTtBQWZaLFNBQVNFLGtCQUFrQixRQUFRLDRCQUE0QjtBQUMvRCxPQUFPQyxPQUFPLE1BQU0sWUFBWTtBQUNoQyxPQUFPQyxNQUFNLE1BQU0sVUFBVTtBQUM3QixTQUFTQyxXQUFXLFFBQVEsK0JBQStCO0FBRTNELE1BQU1DLG1CQUFtQixJQUFBTixhQUFBLEdBQUFPLENBQUEsT0FBR0YsV0FBVyxDQUFDLENBQUM7QUFFekMsTUFBTUcscUJBQXFCLElBQUFSLGFBQUEsR0FBQU8sQ0FBQSxPQUFHLENBQUNELG1CQUFtQixJQUFBTixhQUFBLEdBQUFTLENBQUEsVUFDOUMseUJBQXlCLEtBQUFULGFBQUEsR0FBQVMsQ0FBQSxVQUN6QixFQUFFO0FBRU4sT0FBTyxNQUFNQyxNQUFNLElBQUFWLGFBQUEsR0FBQU8sQ0FBQSxPQUFHO0VBQ3BCSSxJQUFJLEVBQUVQLE1BQU0sQ0FBQ1EsYUFBYSxDQUFDLENBQUM7RUFDNUJDLElBQUksRUFBRSxRQUFRO0VBQ2RDLE9BQU8sRUFBRVgsT0FBTztFQUNoQlksU0FBUyxFQUFFLElBQUk7RUFDZkMsVUFBVSxFQUFFLENBQUMsT0FBTyxDQUFDO0VBQ3JCQyxRQUFRLEVBQUU7SUFDUkMsTUFBTSxFQUFFVixxQkFBcUI7SUFDN0JXLGFBQWEsRUFBRSxHQUFHO0lBQ2xCQyxXQUFXLEVBQUUsQ0FBQztJQUNkQyxJQUFJLEVBQUUsRUFBRTtJQUNSQyxPQUFPLEVBQUUsRUFBRTtJQUNYQyxVQUFVLEVBQUUsUUFBUTtJQUNwQkMsT0FBTyxFQUFFLENBQUM7SUFDVkMsY0FBYyxFQUFFLElBQUk7SUFDcEJDLGtCQUFrQixFQUFFeEIsa0JBQWtCLENBQUN5QjtFQUN6QyxDQUFDO0VBQ0RDLFVBQVUsRUFBRTtJQUNWQyxPQUFPLEVBQUV6QixNQUFNLENBQUMwQix1QkFBdUIsQ0FBQyxDQUFDO0lBQ3pDQyxPQUFPLEVBQUUzQixNQUFNLENBQUM0Qix1QkFBdUIsQ0FBQyxDQUFDO0lBQ3pDQyxJQUFJLEVBQUU3QixNQUFNLENBQUM4QixvQkFBb0IsQ0FBQyxDQUFDO0lBQ25DQyxNQUFNLEVBQUUvQixNQUFNLENBQUNnQyxxQkFBcUIsQ0FBQyxDQUFDO0lBQ3RDQyxhQUFhLEVBQUVqQyxNQUFNLENBQUNrQyw0QkFBNEIsQ0FBQyxDQUFDO0lBQ3BEQyxXQUFXLEVBQUVuQyxNQUFNLENBQUNvQywwQkFBMEIsQ0FBQyxDQUFDO0lBQ2hEQyxnQkFBZ0IsRUFBRXJDLE1BQU0sQ0FBQ3NDLG1CQUFtQixDQUFDLENBQUM7SUFDOUNDLHVCQUF1QixFQUFFdkMsTUFBTSxDQUFDd0MsMEJBQTBCLENBQUM7RUFDN0QsQ0FBQztFQUNEQyxVQUFVLEVBQUU7SUFDVkMsVUFBVSxFQUFFLENBQ1Y7TUFDRUMsZ0JBQWdCLEVBQUUsQ0FBQztNQUNuQkMsYUFBYSxFQUFFQSxDQUFBLEtBQU07UUFBQWhELGFBQUEsR0FBQWlELENBQUE7UUFBQWpELGFBQUEsR0FBQU8sQ0FBQTtRQUNuQixPQUFPO1VBQ0wyQyxRQUFRLEVBQUUsT0FBTztVQUNqQkMsU0FBUyxFQUFFO1FBQ2IsQ0FBQztNQUNIO0lBQ0YsQ0FBQztFQUVMO0FBQ0YsQ0FBQztBQUVELGVBQWUvQyxNQUFNIn0=