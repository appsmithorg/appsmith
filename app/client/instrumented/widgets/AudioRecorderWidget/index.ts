function cov_2q2mb5l9go() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/AudioRecorderWidget/index.ts";
  var hash = "27bc395cfc8eecb7c3cb1f32682a0f3c777dc2ca";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/AudioRecorderWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 7,
          column: 22
        },
        end: {
          line: 51,
          column: 1
        }
      },
      "1": {
        start: {
          line: 40,
          column: 10
        },
        end: {
          line: 43,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 39,
            column: 23
          },
          end: {
            line: 39,
            column: 24
          }
        },
        loc: {
          start: {
            line: 39,
            column: 29
          },
          end: {
            line: 44,
            column: 9
          }
        },
        line: 39
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
    hash: "27bc395cfc8eecb7c3cb1f32682a0f3c777dc2ca"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_2q2mb5l9go = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_2q2mb5l9go();
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_2q2mb5l9go().s[0]++, {
  type: Widget.getWidgetType(),
  name: "Audio Recorder",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["sound recorder", "voice recorder"],
  defaults: {
    iconColor: "white",
    isDisabled: false,
    isVisible: true,
    rows: 7,
    columns: 16,
    widgetName: "AudioRecorder",
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
        cov_2q2mb5l9go().f[0]++;
        cov_2q2mb5l9go().s[1]++;
        return {
          minWidth: "280px",
          minHeight: "70px"
        };
      }
    }],
    disableResizeHandles: {
      vertical: true
    }
  }
});
export default Widget;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMnEybWI1bDlnbyIsImFjdHVhbENvdmVyYWdlIiwiRklMTF9XSURHRVRfTUlOX1dJRFRIIiwiUmVzcG9uc2l2ZUJlaGF2aW9yIiwiSWNvblNWRyIsIldpZGdldCIsIkNPTkZJRyIsInMiLCJ0eXBlIiwiZ2V0V2lkZ2V0VHlwZSIsIm5hbWUiLCJpY29uU1ZHIiwibmVlZHNNZXRhIiwic2VhcmNoVGFncyIsImRlZmF1bHRzIiwiaWNvbkNvbG9yIiwiaXNEaXNhYmxlZCIsImlzVmlzaWJsZSIsInJvd3MiLCJjb2x1bW5zIiwid2lkZ2V0TmFtZSIsInZlcnNpb24iLCJhbmltYXRlTG9hZGluZyIsInJlc3BvbnNpdmVCZWhhdmlvciIsIkZpbGwiLCJtaW5XaWR0aCIsInByb3BlcnRpZXMiLCJkZXJpdmVkIiwiZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAiLCJkZWZhdWx0IiwiZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAiLCJtZXRhIiwiZ2V0TWV0YVByb3BlcnRpZXNNYXAiLCJjb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb25maWciLCJjb250ZW50Q29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lQ29udGVudENvbmZpZyIsInN0eWxlQ29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lU3R5bGVDb25maWciLCJzdHlsZXNoZWV0Q29uZmlnIiwiZ2V0U3R5bGVzaGVldENvbmZpZyIsImF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiLCJhdXRvTGF5b3V0Iiwid2lkZ2V0U2l6ZSIsInZpZXdwb3J0TWluV2lkdGgiLCJjb25maWd1cmF0aW9uIiwiZiIsIm1pbkhlaWdodCIsImRpc2FibGVSZXNpemVIYW5kbGVzIiwidmVydGljYWwiXSwic291cmNlcyI6WyJpbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBGSUxMX1dJREdFVF9NSU5fV0lEVEggfSBmcm9tIFwiY29uc3RhbnRzL21pbldpZHRoQ29uc3RhbnRzXCI7XG5pbXBvcnQgeyBSZXNwb25zaXZlQmVoYXZpb3IgfSBmcm9tIFwidXRpbHMvYXV0b0xheW91dC9jb25zdGFudHNcIjtcblxuaW1wb3J0IEljb25TVkcgZnJvbSBcIi4vaWNvbi5zdmdcIjtcbmltcG9ydCBXaWRnZXQgZnJvbSBcIi4vd2lkZ2V0XCI7XG5cbmV4cG9ydCBjb25zdCBDT05GSUcgPSB7XG4gIHR5cGU6IFdpZGdldC5nZXRXaWRnZXRUeXBlKCksXG4gIG5hbWU6IFwiQXVkaW8gUmVjb3JkZXJcIixcbiAgaWNvblNWRzogSWNvblNWRyxcbiAgbmVlZHNNZXRhOiB0cnVlLFxuICBzZWFyY2hUYWdzOiBbXCJzb3VuZCByZWNvcmRlclwiLCBcInZvaWNlIHJlY29yZGVyXCJdLFxuICBkZWZhdWx0czoge1xuICAgIGljb25Db2xvcjogXCJ3aGl0ZVwiLFxuICAgIGlzRGlzYWJsZWQ6IGZhbHNlLFxuICAgIGlzVmlzaWJsZTogdHJ1ZSxcbiAgICByb3dzOiA3LFxuICAgIGNvbHVtbnM6IDE2LFxuICAgIHdpZGdldE5hbWU6IFwiQXVkaW9SZWNvcmRlclwiLFxuICAgIHZlcnNpb246IDEsXG4gICAgYW5pbWF0ZUxvYWRpbmc6IHRydWUsXG4gICAgcmVzcG9uc2l2ZUJlaGF2aW9yOiBSZXNwb25zaXZlQmVoYXZpb3IuRmlsbCxcbiAgICBtaW5XaWR0aDogRklMTF9XSURHRVRfTUlOX1dJRFRILFxuICB9LFxuICBwcm9wZXJ0aWVzOiB7XG4gICAgZGVyaXZlZDogV2lkZ2V0LmdldERlcml2ZWRQcm9wZXJ0aWVzTWFwKCksXG4gICAgZGVmYXVsdDogV2lkZ2V0LmdldERlZmF1bHRQcm9wZXJ0aWVzTWFwKCksXG4gICAgbWV0YTogV2lkZ2V0LmdldE1ldGFQcm9wZXJ0aWVzTWFwKCksXG4gICAgY29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lQ29uZmlnKCksXG4gICAgY29udGVudENvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbnRlbnRDb25maWcoKSxcbiAgICBzdHlsZUNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZVN0eWxlQ29uZmlnKCksXG4gICAgc3R5bGVzaGVldENvbmZpZzogV2lkZ2V0LmdldFN0eWxlc2hlZXRDb25maWcoKSxcbiAgICBhdXRvY29tcGxldGVEZWZpbml0aW9uczogV2lkZ2V0LmdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zKCksXG4gIH0sXG4gIGF1dG9MYXlvdXQ6IHtcbiAgICB3aWRnZXRTaXplOiBbXG4gICAgICB7XG4gICAgICAgIHZpZXdwb3J0TWluV2lkdGg6IDAsXG4gICAgICAgIGNvbmZpZ3VyYXRpb246ICgpID0+IHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWluV2lkdGg6IFwiMjgwcHhcIixcbiAgICAgICAgICAgIG1pbkhlaWdodDogXCI3MHB4XCIsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSxcbiAgICBkaXNhYmxlUmVzaXplSGFuZGxlczoge1xuICAgICAgdmVydGljYWw6IHRydWUsXG4gICAgfSxcbiAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFdpZGdldDtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGNBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGNBQUE7QUFmWixTQUFTRSxxQkFBcUIsUUFBUSw2QkFBNkI7QUFDbkUsU0FBU0Msa0JBQWtCLFFBQVEsNEJBQTRCO0FBRS9ELE9BQU9DLE9BQU8sTUFBTSxZQUFZO0FBQ2hDLE9BQU9DLE1BQU0sTUFBTSxVQUFVO0FBRTdCLE9BQU8sTUFBTUMsTUFBTSxJQUFBTixjQUFBLEdBQUFPLENBQUEsT0FBRztFQUNwQkMsSUFBSSxFQUFFSCxNQUFNLENBQUNJLGFBQWEsQ0FBQyxDQUFDO0VBQzVCQyxJQUFJLEVBQUUsZ0JBQWdCO0VBQ3RCQyxPQUFPLEVBQUVQLE9BQU87RUFDaEJRLFNBQVMsRUFBRSxJQUFJO0VBQ2ZDLFVBQVUsRUFBRSxDQUFDLGdCQUFnQixFQUFFLGdCQUFnQixDQUFDO0VBQ2hEQyxRQUFRLEVBQUU7SUFDUkMsU0FBUyxFQUFFLE9BQU87SUFDbEJDLFVBQVUsRUFBRSxLQUFLO0lBQ2pCQyxTQUFTLEVBQUUsSUFBSTtJQUNmQyxJQUFJLEVBQUUsQ0FBQztJQUNQQyxPQUFPLEVBQUUsRUFBRTtJQUNYQyxVQUFVLEVBQUUsZUFBZTtJQUMzQkMsT0FBTyxFQUFFLENBQUM7SUFDVkMsY0FBYyxFQUFFLElBQUk7SUFDcEJDLGtCQUFrQixFQUFFcEIsa0JBQWtCLENBQUNxQixJQUFJO0lBQzNDQyxRQUFRLEVBQUV2QjtFQUNaLENBQUM7RUFDRHdCLFVBQVUsRUFBRTtJQUNWQyxPQUFPLEVBQUV0QixNQUFNLENBQUN1Qix1QkFBdUIsQ0FBQyxDQUFDO0lBQ3pDQyxPQUFPLEVBQUV4QixNQUFNLENBQUN5Qix1QkFBdUIsQ0FBQyxDQUFDO0lBQ3pDQyxJQUFJLEVBQUUxQixNQUFNLENBQUMyQixvQkFBb0IsQ0FBQyxDQUFDO0lBQ25DQyxNQUFNLEVBQUU1QixNQUFNLENBQUM2QixxQkFBcUIsQ0FBQyxDQUFDO0lBQ3RDQyxhQUFhLEVBQUU5QixNQUFNLENBQUMrQiw0QkFBNEIsQ0FBQyxDQUFDO0lBQ3BEQyxXQUFXLEVBQUVoQyxNQUFNLENBQUNpQywwQkFBMEIsQ0FBQyxDQUFDO0lBQ2hEQyxnQkFBZ0IsRUFBRWxDLE1BQU0sQ0FBQ21DLG1CQUFtQixDQUFDLENBQUM7SUFDOUNDLHVCQUF1QixFQUFFcEMsTUFBTSxDQUFDcUMsMEJBQTBCLENBQUM7RUFDN0QsQ0FBQztFQUNEQyxVQUFVLEVBQUU7SUFDVkMsVUFBVSxFQUFFLENBQ1Y7TUFDRUMsZ0JBQWdCLEVBQUUsQ0FBQztNQUNuQkMsYUFBYSxFQUFFQSxDQUFBLEtBQU07UUFBQTlDLGNBQUEsR0FBQStDLENBQUE7UUFBQS9DLGNBQUEsR0FBQU8sQ0FBQTtRQUNuQixPQUFPO1VBQ0xrQixRQUFRLEVBQUUsT0FBTztVQUNqQnVCLFNBQVMsRUFBRTtRQUNiLENBQUM7TUFDSDtJQUNGLENBQUMsQ0FDRjtJQUNEQyxvQkFBb0IsRUFBRTtNQUNwQkMsUUFBUSxFQUFFO0lBQ1o7RUFDRjtBQUNGLENBQUM7QUFFRCxlQUFlN0MsTUFBTSJ9