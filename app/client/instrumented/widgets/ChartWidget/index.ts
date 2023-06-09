function cov_17h9n4vneq() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/ChartWidget/index.ts";
  var hash = "3fd1074fb6a961f510751be29ab52d36ed498a4e";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/ChartWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 10,
          column: 22
        },
        end: {
          line: 126,
          column: 1
        }
      },
      "1": {
        start: {
          line: 118,
          column: 10
        },
        end: {
          line: 121,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 117,
            column: 23
          },
          end: {
            line: 117,
            column: 24
          }
        },
        loc: {
          start: {
            line: 117,
            column: 29
          },
          end: {
            line: 122,
            column: 9
          }
        },
        line: 117
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
    hash: "3fd1074fb6a961f510751be29ab52d36ed498a4e"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_17h9n4vneq = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_17h9n4vneq();
import { Colors } from "constants/Colors";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { generateReactKey } from "widgets/WidgetUtils";
import { LabelOrientation } from "./constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_17h9n4vneq().s[0]++, {
  type: Widget.getWidgetType(),
  name: "Chart",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["graph", "visuals", "visualisations"],
  defaults: {
    rows: 32,
    columns: 24,
    widgetName: "Chart",
    chartType: "COLUMN_CHART",
    chartName: "Sales Report",
    allowScroll: false,
    version: 1,
    animateLoading: true,
    responsiveBehavior: ResponsiveBehavior.Fill,
    minWidth: FILL_WIDGET_MIN_WIDTH,
    chartData: {
      [generateReactKey()]: {
        seriesName: "Sales",
        data: [{
          x: "Product1",
          y: 20000
        }, {
          x: "Product2",
          y: 22000
        }, {
          x: "Product3",
          y: 32000
        }]
      }
    },
    xAxisName: "Product Line",
    yAxisName: "Revenue($)",
    labelOrientation: LabelOrientation.AUTO,
    customFusionChartConfig: {
      type: "column2d",
      dataSource: {
        data: [{
          label: "Product1",
          value: 20000
        }, {
          label: "Product2",
          value: 22000
        }, {
          label: "Product3",
          value: 32000
        }],
        chart: {
          caption: "Sales Report",
          xAxisName: "Product Line",
          yAxisName: "Revenue($)",
          theme: "fusion",
          alignCaptionWithCanvas: 1,
          // Caption styling =======================
          captionFontSize: "24",
          captionAlignment: "center",
          captionPadding: "20",
          captionFontColor: Colors.THUNDER,
          // legend position styling ==========
          legendIconSides: "4",
          legendIconBgAlpha: "100",
          legendIconAlpha: "100",
          legendPosition: "top",
          // Canvas styles ========
          canvasPadding: "0",
          // Chart styling =======
          chartLeftMargin: "20",
          chartTopMargin: "10",
          chartRightMargin: "40",
          chartBottomMargin: "10",
          // Axis name styling ======
          xAxisNameFontSize: "14",
          labelFontSize: "12",
          labelFontColor: Colors.DOVE_GRAY2,
          xAxisNameFontColor: Colors.DOVE_GRAY2,
          yAxisNameFontSize: "14",
          yAxisValueFontSize: "12",
          yAxisValueFontColor: Colors.DOVE_GRAY2,
          yAxisNameFontColor: Colors.DOVE_GRAY2
        }
      }
    }
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
        cov_17h9n4vneq().f[0]++;
        cov_17h9n4vneq().s[1]++;
        return {
          minWidth: "280px",
          minHeight: "300px"
        };
      }
    }]
  }
});
export default Widget;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMTdoOW40dm5lcSIsImFjdHVhbENvdmVyYWdlIiwiQ29sb3JzIiwiRklMTF9XSURHRVRfTUlOX1dJRFRIIiwiUmVzcG9uc2l2ZUJlaGF2aW9yIiwiZ2VuZXJhdGVSZWFjdEtleSIsIkxhYmVsT3JpZW50YXRpb24iLCJJY29uU1ZHIiwiV2lkZ2V0IiwiQ09ORklHIiwicyIsInR5cGUiLCJnZXRXaWRnZXRUeXBlIiwibmFtZSIsImljb25TVkciLCJuZWVkc01ldGEiLCJzZWFyY2hUYWdzIiwiZGVmYXVsdHMiLCJyb3dzIiwiY29sdW1ucyIsIndpZGdldE5hbWUiLCJjaGFydFR5cGUiLCJjaGFydE5hbWUiLCJhbGxvd1Njcm9sbCIsInZlcnNpb24iLCJhbmltYXRlTG9hZGluZyIsInJlc3BvbnNpdmVCZWhhdmlvciIsIkZpbGwiLCJtaW5XaWR0aCIsImNoYXJ0RGF0YSIsInNlcmllc05hbWUiLCJkYXRhIiwieCIsInkiLCJ4QXhpc05hbWUiLCJ5QXhpc05hbWUiLCJsYWJlbE9yaWVudGF0aW9uIiwiQVVUTyIsImN1c3RvbUZ1c2lvbkNoYXJ0Q29uZmlnIiwiZGF0YVNvdXJjZSIsImxhYmVsIiwidmFsdWUiLCJjaGFydCIsImNhcHRpb24iLCJ0aGVtZSIsImFsaWduQ2FwdGlvbldpdGhDYW52YXMiLCJjYXB0aW9uRm9udFNpemUiLCJjYXB0aW9uQWxpZ25tZW50IiwiY2FwdGlvblBhZGRpbmciLCJjYXB0aW9uRm9udENvbG9yIiwiVEhVTkRFUiIsImxlZ2VuZEljb25TaWRlcyIsImxlZ2VuZEljb25CZ0FscGhhIiwibGVnZW5kSWNvbkFscGhhIiwibGVnZW5kUG9zaXRpb24iLCJjYW52YXNQYWRkaW5nIiwiY2hhcnRMZWZ0TWFyZ2luIiwiY2hhcnRUb3BNYXJnaW4iLCJjaGFydFJpZ2h0TWFyZ2luIiwiY2hhcnRCb3R0b21NYXJnaW4iLCJ4QXhpc05hbWVGb250U2l6ZSIsImxhYmVsRm9udFNpemUiLCJsYWJlbEZvbnRDb2xvciIsIkRPVkVfR1JBWTIiLCJ4QXhpc05hbWVGb250Q29sb3IiLCJ5QXhpc05hbWVGb250U2l6ZSIsInlBeGlzVmFsdWVGb250U2l6ZSIsInlBeGlzVmFsdWVGb250Q29sb3IiLCJ5QXhpc05hbWVGb250Q29sb3IiLCJwcm9wZXJ0aWVzIiwiZGVyaXZlZCIsImdldERlcml2ZWRQcm9wZXJ0aWVzTWFwIiwiZGVmYXVsdCIsImdldERlZmF1bHRQcm9wZXJ0aWVzTWFwIiwibWV0YSIsImdldE1ldGFQcm9wZXJ0aWVzTWFwIiwiY29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lQ29uZmlnIiwiY29udGVudENvbmZpZyIsImdldFByb3BlcnR5UGFuZUNvbnRlbnRDb25maWciLCJzdHlsZUNvbmZpZyIsImdldFByb3BlcnR5UGFuZVN0eWxlQ29uZmlnIiwic3R5bGVzaGVldENvbmZpZyIsImdldFN0eWxlc2hlZXRDb25maWciLCJhdXRvY29tcGxldGVEZWZpbml0aW9ucyIsImdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiYXV0b0xheW91dCIsIndpZGdldFNpemUiLCJ2aWV3cG9ydE1pbldpZHRoIiwiY29uZmlndXJhdGlvbiIsImYiLCJtaW5IZWlnaHQiXSwic291cmNlcyI6WyJpbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb2xvcnMgfSBmcm9tIFwiY29uc3RhbnRzL0NvbG9yc1wiO1xuaW1wb3J0IHsgRklMTF9XSURHRVRfTUlOX1dJRFRIIH0gZnJvbSBcImNvbnN0YW50cy9taW5XaWR0aENvbnN0YW50c1wiO1xuaW1wb3J0IHsgUmVzcG9uc2l2ZUJlaGF2aW9yIH0gZnJvbSBcInV0aWxzL2F1dG9MYXlvdXQvY29uc3RhbnRzXCI7XG5cbmltcG9ydCB7IGdlbmVyYXRlUmVhY3RLZXkgfSBmcm9tIFwid2lkZ2V0cy9XaWRnZXRVdGlsc1wiO1xuaW1wb3J0IHsgTGFiZWxPcmllbnRhdGlvbiB9IGZyb20gXCIuL2NvbnN0YW50c1wiO1xuaW1wb3J0IEljb25TVkcgZnJvbSBcIi4vaWNvbi5zdmdcIjtcbmltcG9ydCBXaWRnZXQgZnJvbSBcIi4vd2lkZ2V0XCI7XG5cbmV4cG9ydCBjb25zdCBDT05GSUcgPSB7XG4gIHR5cGU6IFdpZGdldC5nZXRXaWRnZXRUeXBlKCksXG4gIG5hbWU6IFwiQ2hhcnRcIixcbiAgaWNvblNWRzogSWNvblNWRyxcbiAgbmVlZHNNZXRhOiB0cnVlLFxuICBzZWFyY2hUYWdzOiBbXCJncmFwaFwiLCBcInZpc3VhbHNcIiwgXCJ2aXN1YWxpc2F0aW9uc1wiXSxcbiAgZGVmYXVsdHM6IHtcbiAgICByb3dzOiAzMixcbiAgICBjb2x1bW5zOiAyNCxcbiAgICB3aWRnZXROYW1lOiBcIkNoYXJ0XCIsXG4gICAgY2hhcnRUeXBlOiBcIkNPTFVNTl9DSEFSVFwiLFxuICAgIGNoYXJ0TmFtZTogXCJTYWxlcyBSZXBvcnRcIixcbiAgICBhbGxvd1Njcm9sbDogZmFsc2UsXG4gICAgdmVyc2lvbjogMSxcbiAgICBhbmltYXRlTG9hZGluZzogdHJ1ZSxcbiAgICByZXNwb25zaXZlQmVoYXZpb3I6IFJlc3BvbnNpdmVCZWhhdmlvci5GaWxsLFxuICAgIG1pbldpZHRoOiBGSUxMX1dJREdFVF9NSU5fV0lEVEgsXG4gICAgY2hhcnREYXRhOiB7XG4gICAgICBbZ2VuZXJhdGVSZWFjdEtleSgpXToge1xuICAgICAgICBzZXJpZXNOYW1lOiBcIlNhbGVzXCIsXG4gICAgICAgIGRhdGE6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB4OiBcIlByb2R1Y3QxXCIsXG4gICAgICAgICAgICB5OiAyMDAwMCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHg6IFwiUHJvZHVjdDJcIixcbiAgICAgICAgICAgIHk6IDIyMDAwLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgeDogXCJQcm9kdWN0M1wiLFxuICAgICAgICAgICAgeTogMzIwMDAsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICB4QXhpc05hbWU6IFwiUHJvZHVjdCBMaW5lXCIsXG4gICAgeUF4aXNOYW1lOiBcIlJldmVudWUoJClcIixcbiAgICBsYWJlbE9yaWVudGF0aW9uOiBMYWJlbE9yaWVudGF0aW9uLkFVVE8sXG4gICAgY3VzdG9tRnVzaW9uQ2hhcnRDb25maWc6IHtcbiAgICAgIHR5cGU6IFwiY29sdW1uMmRcIixcbiAgICAgIGRhdGFTb3VyY2U6IHtcbiAgICAgICAgZGF0YTogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiBcIlByb2R1Y3QxXCIsXG4gICAgICAgICAgICB2YWx1ZTogMjAwMDAsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogXCJQcm9kdWN0MlwiLFxuICAgICAgICAgICAgdmFsdWU6IDIyMDAwLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6IFwiUHJvZHVjdDNcIixcbiAgICAgICAgICAgIHZhbHVlOiAzMjAwMCxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBjaGFydDoge1xuICAgICAgICAgIGNhcHRpb246IFwiU2FsZXMgUmVwb3J0XCIsXG4gICAgICAgICAgeEF4aXNOYW1lOiBcIlByb2R1Y3QgTGluZVwiLFxuICAgICAgICAgIHlBeGlzTmFtZTogXCJSZXZlbnVlKCQpXCIsXG4gICAgICAgICAgdGhlbWU6IFwiZnVzaW9uXCIsXG4gICAgICAgICAgYWxpZ25DYXB0aW9uV2l0aENhbnZhczogMSxcbiAgICAgICAgICAvLyBDYXB0aW9uIHN0eWxpbmcgPT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgICBjYXB0aW9uRm9udFNpemU6IFwiMjRcIixcbiAgICAgICAgICBjYXB0aW9uQWxpZ25tZW50OiBcImNlbnRlclwiLFxuICAgICAgICAgIGNhcHRpb25QYWRkaW5nOiBcIjIwXCIsXG4gICAgICAgICAgY2FwdGlvbkZvbnRDb2xvcjogQ29sb3JzLlRIVU5ERVIsXG4gICAgICAgICAgLy8gbGVnZW5kIHBvc2l0aW9uIHN0eWxpbmcgPT09PT09PT09PVxuICAgICAgICAgIGxlZ2VuZEljb25TaWRlczogXCI0XCIsXG4gICAgICAgICAgbGVnZW5kSWNvbkJnQWxwaGE6IFwiMTAwXCIsXG4gICAgICAgICAgbGVnZW5kSWNvbkFscGhhOiBcIjEwMFwiLFxuICAgICAgICAgIGxlZ2VuZFBvc2l0aW9uOiBcInRvcFwiLFxuICAgICAgICAgIC8vIENhbnZhcyBzdHlsZXMgPT09PT09PT1cbiAgICAgICAgICBjYW52YXNQYWRkaW5nOiBcIjBcIixcbiAgICAgICAgICAvLyBDaGFydCBzdHlsaW5nID09PT09PT1cbiAgICAgICAgICBjaGFydExlZnRNYXJnaW46IFwiMjBcIixcbiAgICAgICAgICBjaGFydFRvcE1hcmdpbjogXCIxMFwiLFxuICAgICAgICAgIGNoYXJ0UmlnaHRNYXJnaW46IFwiNDBcIixcbiAgICAgICAgICBjaGFydEJvdHRvbU1hcmdpbjogXCIxMFwiLFxuICAgICAgICAgIC8vIEF4aXMgbmFtZSBzdHlsaW5nID09PT09PVxuICAgICAgICAgIHhBeGlzTmFtZUZvbnRTaXplOiBcIjE0XCIsXG4gICAgICAgICAgbGFiZWxGb250U2l6ZTogXCIxMlwiLFxuICAgICAgICAgIGxhYmVsRm9udENvbG9yOiBDb2xvcnMuRE9WRV9HUkFZMixcbiAgICAgICAgICB4QXhpc05hbWVGb250Q29sb3I6IENvbG9ycy5ET1ZFX0dSQVkyLFxuXG4gICAgICAgICAgeUF4aXNOYW1lRm9udFNpemU6IFwiMTRcIixcbiAgICAgICAgICB5QXhpc1ZhbHVlRm9udFNpemU6IFwiMTJcIixcbiAgICAgICAgICB5QXhpc1ZhbHVlRm9udENvbG9yOiBDb2xvcnMuRE9WRV9HUkFZMixcbiAgICAgICAgICB5QXhpc05hbWVGb250Q29sb3I6IENvbG9ycy5ET1ZFX0dSQVkyLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBwcm9wZXJ0aWVzOiB7XG4gICAgZGVyaXZlZDogV2lkZ2V0LmdldERlcml2ZWRQcm9wZXJ0aWVzTWFwKCksXG4gICAgZGVmYXVsdDogV2lkZ2V0LmdldERlZmF1bHRQcm9wZXJ0aWVzTWFwKCksXG4gICAgbWV0YTogV2lkZ2V0LmdldE1ldGFQcm9wZXJ0aWVzTWFwKCksXG4gICAgY29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lQ29uZmlnKCksXG4gICAgY29udGVudENvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbnRlbnRDb25maWcoKSxcbiAgICBzdHlsZUNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZVN0eWxlQ29uZmlnKCksXG4gICAgc3R5bGVzaGVldENvbmZpZzogV2lkZ2V0LmdldFN0eWxlc2hlZXRDb25maWcoKSxcbiAgICBhdXRvY29tcGxldGVEZWZpbml0aW9uczogV2lkZ2V0LmdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zKCksXG4gIH0sXG4gIGF1dG9MYXlvdXQ6IHtcbiAgICB3aWRnZXRTaXplOiBbXG4gICAgICB7XG4gICAgICAgIHZpZXdwb3J0TWluV2lkdGg6IDAsXG4gICAgICAgIGNvbmZpZ3VyYXRpb246ICgpID0+IHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWluV2lkdGg6IFwiMjgwcHhcIixcbiAgICAgICAgICAgIG1pbkhlaWdodDogXCIzMDBweFwiLFxuICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF0sXG4gIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBXaWRnZXQ7XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxjQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxjQUFBO0FBZlosU0FBU0UsTUFBTSxRQUFRLGtCQUFrQjtBQUN6QyxTQUFTQyxxQkFBcUIsUUFBUSw2QkFBNkI7QUFDbkUs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