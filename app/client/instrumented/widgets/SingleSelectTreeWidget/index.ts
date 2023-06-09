function cov_wdknz16t4() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/SingleSelectTreeWidget/index.ts";
  var hash = "afcfd6901a2747eb110f882b5c932346e9c41c03";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/SingleSelectTreeWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 10,
          column: 22
        },
        end: {
          line: 97,
          column: 1
        }
      },
      "1": {
        start: {
          line: 87,
          column: 10
        },
        end: {
          line: 89,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 86,
            column: 23
          },
          end: {
            line: 86,
            column: 24
          }
        },
        loc: {
          start: {
            line: 86,
            column: 29
          },
          end: {
            line: 90,
            column: 9
          }
        },
        line: 86
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
    hash: "afcfd6901a2747eb110f882b5c932346e9c41c03"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_wdknz16t4 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_wdknz16t4();
import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { DynamicHeight } from "utils/WidgetFeatures";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_wdknz16t4().s[0]++, {
  features: {
    dynamicHeight: {
      sectionIndex: 3,
      defaultValue: DynamicHeight.FIXED,
      active: true
    }
  },
  type: Widget.getWidgetType(),
  name: "TreeSelect",
  searchTags: ["dropdown"],
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 7,
    columns: 20,
    animateLoading: true,
    options: [{
      label: "Blue",
      value: "BLUE",
      children: [{
        label: "Dark Blue",
        value: "DARK BLUE"
      }, {
        label: "Light Blue",
        value: "LIGHT BLUE"
      }]
    }, {
      label: "Green",
      value: "GREEN"
    }, {
      label: "Red",
      value: "RED"
    }],
    widgetName: "TreeSelect",
    defaultOptionValue: "BLUE",
    version: 1,
    isVisible: true,
    isRequired: false,
    isDisabled: false,
    allowClear: false,
    expandAll: false,
    placeholderText: "Select option",
    labelText: "Label",
    labelPosition: LabelPosition.Top,
    labelAlignment: Alignment.LEFT,
    labelWidth: 5,
    labelTextSize: "0.875rem",
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
    disabledPropsDefaults: {
      labelPosition: LabelPosition.Top,
      labelTextSize: "0.875rem"
    },
    defaults: {
      rows: 6.6
    },
    autoDimension: {
      height: true
    },
    widgetSize: [{
      viewportMinWidth: 0,
      configuration: () => {
        cov_wdknz16t4().f[0]++;
        cov_wdknz16t4().s[1]++;
        return {
          minWidth: "160px"
        };
      }
    }],
    disableResizeHandles: {
      vertical: true
    }
  }
});
export default Widget;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3Zfd2RrbnoxNnQ0IiwiYWN0dWFsQ292ZXJhZ2UiLCJBbGlnbm1lbnQiLCJMYWJlbFBvc2l0aW9uIiwiRklMTF9XSURHRVRfTUlOX1dJRFRIIiwiUmVzcG9uc2l2ZUJlaGF2aW9yIiwiRHluYW1pY0hlaWdodCIsIkljb25TVkciLCJXaWRnZXQiLCJDT05GSUciLCJzIiwiZmVhdHVyZXMiLCJkeW5hbWljSGVpZ2h0Iiwic2VjdGlvbkluZGV4IiwiZGVmYXVsdFZhbHVlIiwiRklYRUQiLCJhY3RpdmUiLCJ0eXBlIiwiZ2V0V2lkZ2V0VHlwZSIsIm5hbWUiLCJzZWFyY2hUYWdzIiwiaWNvblNWRyIsIm5lZWRzTWV0YSIsImRlZmF1bHRzIiwicm93cyIsImNvbHVtbnMiLCJhbmltYXRlTG9hZGluZyIsIm9wdGlvbnMiLCJsYWJlbCIsInZhbHVlIiwiY2hpbGRyZW4iLCJ3aWRnZXROYW1lIiwiZGVmYXVsdE9wdGlvblZhbHVlIiwidmVyc2lvbiIsImlzVmlzaWJsZSIsImlzUmVxdWlyZWQiLCJpc0Rpc2FibGVkIiwiYWxsb3dDbGVhciIsImV4cGFuZEFsbCIsInBsYWNlaG9sZGVyVGV4dCIsImxhYmVsVGV4dCIsImxhYmVsUG9zaXRpb24iLCJUb3AiLCJsYWJlbEFsaWdubWVudCIsIkxFRlQiLCJsYWJlbFdpZHRoIiwibGFiZWxUZXh0U2l6ZSIsInJlc3BvbnNpdmVCZWhhdmlvciIsIkZpbGwiLCJtaW5XaWR0aCIsInByb3BlcnRpZXMiLCJkZXJpdmVkIiwiZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAiLCJkZWZhdWx0IiwiZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAiLCJtZXRhIiwiZ2V0TWV0YVByb3BlcnRpZXNNYXAiLCJjb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb25maWciLCJjb250ZW50Q29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lQ29udGVudENvbmZpZyIsInN0eWxlQ29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lU3R5bGVDb25maWciLCJzdHlsZXNoZWV0Q29uZmlnIiwiZ2V0U3R5bGVzaGVldENvbmZpZyIsImF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiLCJhdXRvTGF5b3V0IiwiZGlzYWJsZWRQcm9wc0RlZmF1bHRzIiwiYXV0b0RpbWVuc2lvbiIsImhlaWdodCIsIndpZGdldFNpemUiLCJ2aWV3cG9ydE1pbldpZHRoIiwiY29uZmlndXJhdGlvbiIsImYiLCJkaXNhYmxlUmVzaXplSGFuZGxlcyIsInZlcnRpY2FsIl0sInNvdXJjZXMiOlsiaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWxpZ25tZW50IH0gZnJvbSBcIkBibHVlcHJpbnRqcy9jb3JlXCI7XG5pbXBvcnQgeyBMYWJlbFBvc2l0aW9uIH0gZnJvbSBcImNvbXBvbmVudHMvY29uc3RhbnRzXCI7XG5pbXBvcnQgeyBGSUxMX1dJREdFVF9NSU5fV0lEVEggfSBmcm9tIFwiY29uc3RhbnRzL21pbldpZHRoQ29uc3RhbnRzXCI7XG5pbXBvcnQgeyBSZXNwb25zaXZlQmVoYXZpb3IgfSBmcm9tIFwidXRpbHMvYXV0b0xheW91dC9jb25zdGFudHNcIjtcbmltcG9ydCB7IER5bmFtaWNIZWlnaHQgfSBmcm9tIFwidXRpbHMvV2lkZ2V0RmVhdHVyZXNcIjtcblxuaW1wb3J0IEljb25TVkcgZnJvbSBcIi4vaWNvbi5zdmdcIjtcbmltcG9ydCBXaWRnZXQgZnJvbSBcIi4vd2lkZ2V0XCI7XG5cbmV4cG9ydCBjb25zdCBDT05GSUcgPSB7XG4gIGZlYXR1cmVzOiB7XG4gICAgZHluYW1pY0hlaWdodDoge1xuICAgICAgc2VjdGlvbkluZGV4OiAzLFxuICAgICAgZGVmYXVsdFZhbHVlOiBEeW5hbWljSGVpZ2h0LkZJWEVELFxuICAgICAgYWN0aXZlOiB0cnVlLFxuICAgIH0sXG4gIH0sXG4gIHR5cGU6IFdpZGdldC5nZXRXaWRnZXRUeXBlKCksXG4gIG5hbWU6IFwiVHJlZVNlbGVjdFwiLFxuICBzZWFyY2hUYWdzOiBbXCJkcm9wZG93blwiXSxcbiAgaWNvblNWRzogSWNvblNWRyxcbiAgbmVlZHNNZXRhOiB0cnVlLFxuICBkZWZhdWx0czoge1xuICAgIHJvd3M6IDcsXG4gICAgY29sdW1uczogMjAsXG4gICAgYW5pbWF0ZUxvYWRpbmc6IHRydWUsXG4gICAgb3B0aW9uczogW1xuICAgICAge1xuICAgICAgICBsYWJlbDogXCJCbHVlXCIsXG4gICAgICAgIHZhbHVlOiBcIkJMVUVcIixcbiAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogXCJEYXJrIEJsdWVcIixcbiAgICAgICAgICAgIHZhbHVlOiBcIkRBUksgQkxVRVwiLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6IFwiTGlnaHQgQmx1ZVwiLFxuICAgICAgICAgICAgdmFsdWU6IFwiTElHSFQgQkxVRVwiLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICAgeyBsYWJlbDogXCJHcmVlblwiLCB2YWx1ZTogXCJHUkVFTlwiIH0sXG4gICAgICB7IGxhYmVsOiBcIlJlZFwiLCB2YWx1ZTogXCJSRURcIiB9LFxuICAgIF0sXG4gICAgd2lkZ2V0TmFtZTogXCJUcmVlU2VsZWN0XCIsXG4gICAgZGVmYXVsdE9wdGlvblZhbHVlOiBcIkJMVUVcIixcbiAgICB2ZXJzaW9uOiAxLFxuICAgIGlzVmlzaWJsZTogdHJ1ZSxcbiAgICBpc1JlcXVpcmVkOiBmYWxzZSxcbiAgICBpc0Rpc2FibGVkOiBmYWxzZSxcbiAgICBhbGxvd0NsZWFyOiBmYWxzZSxcbiAgICBleHBhbmRBbGw6IGZhbHNlLFxuICAgIHBsYWNlaG9sZGVyVGV4dDogXCJTZWxlY3Qgb3B0aW9uXCIsXG4gICAgbGFiZWxUZXh0OiBcIkxhYmVsXCIsXG4gICAgbGFiZWxQb3NpdGlvbjogTGFiZWxQb3NpdGlvbi5Ub3AsXG4gICAgbGFiZWxBbGlnbm1lbnQ6IEFsaWdubWVudC5MRUZULFxuICAgIGxhYmVsV2lkdGg6IDUsXG4gICAgbGFiZWxUZXh0U2l6ZTogXCIwLjg3NXJlbVwiLFxuICAgIHJlc3BvbnNpdmVCZWhhdmlvcjogUmVzcG9uc2l2ZUJlaGF2aW9yLkZpbGwsXG4gICAgbWluV2lkdGg6IEZJTExfV0lER0VUX01JTl9XSURUSCxcbiAgfSxcbiAgcHJvcGVydGllczoge1xuICAgIGRlcml2ZWQ6IFdpZGdldC5nZXREZXJpdmVkUHJvcGVydGllc01hcCgpLFxuICAgIGRlZmF1bHQ6IFdpZGdldC5nZXREZWZhdWx0UHJvcGVydGllc01hcCgpLFxuICAgIG1ldGE6IFdpZGdldC5nZXRNZXRhUHJvcGVydGllc01hcCgpLFxuICAgIGNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbmZpZygpLFxuICAgIGNvbnRlbnRDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnKCksXG4gICAgc3R5bGVDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVTdHlsZUNvbmZpZygpLFxuICAgIHN0eWxlc2hlZXRDb25maWc6IFdpZGdldC5nZXRTdHlsZXNoZWV0Q29uZmlnKCksXG4gICAgYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnM6IFdpZGdldC5nZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucygpLFxuICB9LFxuICBhdXRvTGF5b3V0OiB7XG4gICAgZGlzYWJsZWRQcm9wc0RlZmF1bHRzOiB7XG4gICAgICBsYWJlbFBvc2l0aW9uOiBMYWJlbFBvc2l0aW9uLlRvcCxcbiAgICAgIGxhYmVsVGV4dFNpemU6IFwiMC44NzVyZW1cIixcbiAgICB9LFxuICAgIGRlZmF1bHRzOiB7XG4gICAgICByb3dzOiA2LjYsXG4gICAgfSxcbiAgICBhdXRvRGltZW5zaW9uOiB7XG4gICAgICBoZWlnaHQ6IHRydWUsXG4gICAgfSxcbiAgICB3aWRnZXRTaXplOiBbXG4gICAgICB7XG4gICAgICAgIHZpZXdwb3J0TWluV2lkdGg6IDAsXG4gICAgICAgIGNvbmZpZ3VyYXRpb246ICgpID0+IHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWluV2lkdGg6IFwiMTYwcHhcIixcbiAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdLFxuICAgIGRpc2FibGVSZXNpemVIYW5kbGVzOiB7XG4gICAgICB2ZXJ0aWNhbDogdHJ1ZSxcbiAgICB9LFxuICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgV2lkZ2V0O1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsYUFBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsYUFBQTtBQWZaLFNBQVNFLFNBQVMsUUFBUSxtQkFBbUI7QUFDN0MsU0FBU0MsYUFBYSxRQUFRLHNCQUFzQjtBQUNwRCxTQUFTQyxxQkFBcUIsUUFBUSw2QkFBNkI7QUFDbkUsU0FBU0Msa0JBQWtCLFFBQVEsNEJBQTRCO0FBQy9ELFNBQVNDLGFBQWEsUUFBUSxzQkFBc0I7QUFFcEQsT0FBT0MsT0FBTyxNQUFNLFlBQVk7QUFDaEMsT0FBT0MsTUFBTSxNQUFNLFVBQVU7QUFFN0IsT0FBTyxNQUFNQyxNQUFNLElBQUFULGFBQUEsR0FBQVUsQ0FBQSxPQUFHO0VBQ3BCQyxRQUFRLEVBQUU7SUFDUkMsYUFBYSxFQUFFO01BQ2JDLFlBQVksRUFBRSxDQUFDO01BQ2ZDLFlBQVksRUFBRVIsYUFBYSxDQUFDUyxLQUFLO01BQ2pDQyxNQUFNLEVBQUU7SUFDVjtFQUNGLENBQUM7RUFDREMsSUFBSSxFQUFFVCxNQUFNLENBQUNVLGFBQWEsQ0FBQyxDQUFDO0VBQzVCQyxJQUFJLEVBQUUsWUFBWTtFQUNsQkMsVUFBVSxFQUFFLENBQUMsVUFBVSxDQUFDO0VBQ3hCQyxPQUFPLEVBQUVkLE9BQU87RUFDaEJlLFNBQVMsRUFBRSxJQUFJO0VBQ2ZDLFFBQVEsRUFBRTtJQUNSQyxJQUFJLEVBQUUsQ0FBQztJ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