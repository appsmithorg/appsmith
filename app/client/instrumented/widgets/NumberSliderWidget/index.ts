function cov_15mkjyq6i2() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/NumberSliderWidget/index.ts";
  var hash = "0f2f05884f84c21f6585045a439184ac44ba7b58";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/NumberSliderWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 8,
          column: 22
        },
        end: {
          line: 76,
          column: 1
        }
      },
      "1": {
        start: {
          line: 65,
          column: 10
        },
        end: {
          line: 68,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 64,
            column: 23
          },
          end: {
            line: 64,
            column: 24
          }
        },
        loc: {
          start: {
            line: 64,
            column: 29
          },
          end: {
            line: 69,
            column: 9
          }
        },
        line: 64
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
    hash: "0f2f05884f84c21f6585045a439184ac44ba7b58"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_15mkjyq6i2 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_15mkjyq6i2();
import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_15mkjyq6i2().s[0]++, {
  type: Widget.getWidgetType(),
  name: "Number Slider",
  needsMeta: true,
  searchTags: ["range"],
  iconSVG: IconSVG,
  defaults: {
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 10,
    showMarksLabel: true,
    marks: [{
      value: 25,
      label: "25%"
    }, {
      value: 50,
      label: "50%"
    }, {
      value: 75,
      label: "75%"
    }],
    isVisible: true,
    isDisabled: false,
    tooltipAlwaysOn: false,
    rows: 8,
    columns: 40,
    widgetName: "NumberSlider",
    shouldScroll: false,
    shouldTruncate: false,
    version: 1,
    animateLoading: true,
    labelText: "Percentage",
    labelPosition: LabelPosition.Top,
    labelAlignment: Alignment.LEFT,
    labelWidth: 8,
    labelTextSize: "0.875rem",
    sliderSize: "m",
    responsiveBehavior: ResponsiveBehavior.Fill
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
    stylesheetConfig: Widget.getStylesheetConfig(),
    autocompleteDefinitions: Widget.getAutocompleteDefinitions()
  },
  autoLayout: {
    disabledPropsDefaults: {
      labelPosition: LabelPosition.Top,
      labelTextSize: "0.875rem"
    },
    defaults: {
      rows: 7,
      columns: 40
    },
    widgetSize: [{
      viewportMinWidth: 0,
      configuration: () => {
        cov_15mkjyq6i2().f[0]++;
        cov_15mkjyq6i2().s[1]++;
        return {
          minWidth: "180px",
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMTVta2p5cTZpMiIsImFjdHVhbENvdmVyYWdlIiwiQWxpZ25tZW50IiwiTGFiZWxQb3NpdGlvbiIsIlJlc3BvbnNpdmVCZWhhdmlvciIsIkljb25TVkciLCJXaWRnZXQiLCJDT05GSUciLCJzIiwidHlwZSIsImdldFdpZGdldFR5cGUiLCJuYW1lIiwibmVlZHNNZXRhIiwic2VhcmNoVGFncyIsImljb25TVkciLCJkZWZhdWx0cyIsIm1pbiIsIm1heCIsInN0ZXAiLCJkZWZhdWx0VmFsdWUiLCJzaG93TWFya3NMYWJlbCIsIm1hcmtzIiwidmFsdWUiLCJsYWJlbCIsImlzVmlzaWJsZSIsImlzRGlzYWJsZWQiLCJ0b29sdGlwQWx3YXlzT24iLCJyb3dzIiwiY29sdW1ucyIsIndpZGdldE5hbWUiLCJzaG91bGRTY3JvbGwiLCJzaG91bGRUcnVuY2F0ZSIsInZlcnNpb24iLCJhbmltYXRlTG9hZGluZyIsImxhYmVsVGV4dCIsImxhYmVsUG9zaXRpb24iLCJUb3AiLCJsYWJlbEFsaWdubWVudCIsIkxFRlQiLCJsYWJlbFdpZHRoIiwibGFiZWxUZXh0U2l6ZSIsInNsaWRlclNpemUiLCJyZXNwb25zaXZlQmVoYXZpb3IiLCJGaWxsIiwicHJvcGVydGllcyIsImRlcml2ZWQiLCJnZXREZXJpdmVkUHJvcGVydGllc01hcCIsImRlZmF1bHQiLCJnZXREZWZhdWx0UHJvcGVydGllc01hcCIsIm1ldGEiLCJnZXRNZXRhUHJvcGVydGllc01hcCIsImNvbnRlbnRDb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnIiwic3R5bGVDb25maWciLCJnZXRQcm9wZXJ0eVBhbmVTdHlsZUNvbmZpZyIsInN0eWxlc2hlZXRDb25maWciLCJnZXRTdHlsZXNoZWV0Q29uZmlnIiwiYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiLCJnZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucyIsImF1dG9MYXlvdXQiLCJkaXNhYmxlZFByb3BzRGVmYXVsdHMiLCJ3aWRnZXRTaXplIiwidmlld3BvcnRNaW5XaWR0aCIsImNvbmZpZ3VyYXRpb24iLCJmIiwibWluV2lkdGgiLCJtaW5IZWlnaHQiLCJkaXNhYmxlUmVzaXplSGFuZGxlcyIsInZlcnRpY2FsIl0sInNvdXJjZXMiOlsiaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWxpZ25tZW50IH0gZnJvbSBcIkBibHVlcHJpbnRqcy9jb3JlXCI7XG5pbXBvcnQgeyBMYWJlbFBvc2l0aW9uIH0gZnJvbSBcImNvbXBvbmVudHMvY29uc3RhbnRzXCI7XG5pbXBvcnQgeyBSZXNwb25zaXZlQmVoYXZpb3IgfSBmcm9tIFwidXRpbHMvYXV0b0xheW91dC9jb25zdGFudHNcIjtcblxuaW1wb3J0IEljb25TVkcgZnJvbSBcIi4vaWNvbi5zdmdcIjtcbmltcG9ydCBXaWRnZXQgZnJvbSBcIi4vd2lkZ2V0XCI7XG5cbmV4cG9ydCBjb25zdCBDT05GSUcgPSB7XG4gIHR5cGU6IFdpZGdldC5nZXRXaWRnZXRUeXBlKCksXG4gIG5hbWU6IFwiTnVtYmVyIFNsaWRlclwiLFxuICBuZWVkc01ldGE6IHRydWUsXG4gIHNlYXJjaFRhZ3M6IFtcInJhbmdlXCJdLFxuICBpY29uU1ZHOiBJY29uU1ZHLFxuICBkZWZhdWx0czoge1xuICAgIG1pbjogMCxcbiAgICBtYXg6IDEwMCxcbiAgICBzdGVwOiAxLFxuICAgIGRlZmF1bHRWYWx1ZTogMTAsXG4gICAgc2hvd01hcmtzTGFiZWw6IHRydWUsXG4gICAgbWFya3M6IFtcbiAgICAgIHsgdmFsdWU6IDI1LCBsYWJlbDogXCIyNSVcIiB9LFxuICAgICAgeyB2YWx1ZTogNTAsIGxhYmVsOiBcIjUwJVwiIH0sXG4gICAgICB7IHZhbHVlOiA3NSwgbGFiZWw6IFwiNzUlXCIgfSxcbiAgICBdLFxuICAgIGlzVmlzaWJsZTogdHJ1ZSxcbiAgICBpc0Rpc2FibGVkOiBmYWxzZSxcbiAgICB0b29sdGlwQWx3YXlzT246IGZhbHNlLFxuICAgIHJvd3M6IDgsXG4gICAgY29sdW1uczogNDAsXG4gICAgd2lkZ2V0TmFtZTogXCJOdW1iZXJTbGlkZXJcIixcbiAgICBzaG91bGRTY3JvbGw6IGZhbHNlLFxuICAgIHNob3VsZFRydW5jYXRlOiBmYWxzZSxcbiAgICB2ZXJzaW9uOiAxLFxuICAgIGFuaW1hdGVMb2FkaW5nOiB0cnVlLFxuICAgIGxhYmVsVGV4dDogXCJQZXJjZW50YWdlXCIsXG4gICAgbGFiZWxQb3NpdGlvbjogTGFiZWxQb3NpdGlvbi5Ub3AsXG4gICAgbGFiZWxBbGlnbm1lbnQ6IEFsaWdubWVudC5MRUZULFxuICAgIGxhYmVsV2lkdGg6IDgsXG4gICAgbGFiZWxUZXh0U2l6ZTogXCIwLjg3NXJlbVwiLFxuICAgIHNsaWRlclNpemU6IFwibVwiLFxuICAgIHJlc3BvbnNpdmVCZWhhdmlvcjogUmVzcG9uc2l2ZUJlaGF2aW9yLkZpbGwsXG4gIH0sXG4gIHByb3BlcnRpZXM6IHtcbiAgICBkZXJpdmVkOiBXaWRnZXQuZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAoKSxcbiAgICBkZWZhdWx0OiBXaWRnZXQuZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAoKSxcbiAgICBtZXRhOiBXaWRnZXQuZ2V0TWV0YVByb3BlcnRpZXNNYXAoKSxcbiAgICBjb250ZW50Q29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lQ29udGVudENvbmZpZygpLFxuICAgIHN0eWxlQ29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lU3R5bGVDb25maWcoKSxcbiAgICBzdHlsZXNoZWV0Q29uZmlnOiBXaWRnZXQuZ2V0U3R5bGVzaGVldENvbmZpZygpLFxuICAgIGF1dG9jb21wbGV0ZURlZmluaXRpb25zOiBXaWRnZXQuZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMoKSxcbiAgfSxcbiAgYXV0b0xheW91dDoge1xuICAgIGRpc2FibGVkUHJvcHNEZWZhdWx0czoge1xuICAgICAgbGFiZWxQb3NpdGlvbjogTGFiZWxQb3NpdGlvbi5Ub3AsXG4gICAgICBsYWJlbFRleHRTaXplOiBcIjAuODc1cmVtXCIsXG4gICAgfSxcbiAgICBkZWZhdWx0czoge1xuICAgICAgcm93czogNyxcbiAgICAgIGNvbHVtbnM6IDQwLFxuICAgIH0sXG4gICAgd2lkZ2V0U2l6ZTogW1xuICAgICAge1xuICAgICAgICB2aWV3cG9ydE1pbldpZHRoOiAwLFxuICAgICAgICBjb25maWd1cmF0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1pbldpZHRoOiBcIjE4MHB4XCIsXG4gICAgICAgICAgICBtaW5IZWlnaHQ6IFwiNzBweFwiLFxuICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF0sXG4gICAgZGlzYWJsZVJlc2l6ZUhhbmRsZXM6IHtcbiAgICAgIHZlcnRpY2FsOiB0cnVlLFxuICAgIH0sXG4gIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBXaWRnZXQ7XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxjQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxjQUFBO0FBZlosU0FBU0UsU0FBUyxRQUFRLG1CQUFtQjtBQUM3QyxTQUFTQyxhQUFhLFFBQVEsc0JBQXNCO0FBQ3BELFNBQVNDLGtCQUFrQixRQUFRLDRCQUE0QjtBQUUvRCxPQUFPQyxPQUFPLE1BQU0sWUFBWTtBQUNoQyxPQUFPQyxNQUFNLE1BQU0sVUFBVTtBQUU3QixPQUFPLE1BQU1DLE1BQU0sSUFBQVAsY0FBQSxHQUFBUSxDQUFBLE9BQUc7RUFDcEJDLElBQUksRUFBRUgsTUFBTSxDQUFDSSxhQUFhLENBQUMsQ0FBQztFQUM1QkMsSUFBSSxFQUFFLGVBQWU7RUFDckJDLFNBQVMsRUFBRSxJQUFJO0VBQ2ZDLFVBQVUsRUFBRSxDQUFDLE9BQU8sQ0FBQztFQUNyQkMsT0FBTyxFQUFFVCxPQUFPO0VBQ2hCVSxRQUFRLEVBQUU7SUFD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