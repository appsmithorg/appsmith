function cov_1er9md8jbg() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/SelectWidget/index.ts";
  var hash = "360a20140c82ba209fcff87dfbe210449eeba2ee";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/SelectWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 10,
          column: 22
        },
        end: {
          line: 83,
          column: 1
        }
      },
      "1": {
        start: {
          line: 73,
          column: 10
        },
        end: {
          line: 75,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 72,
            column: 23
          },
          end: {
            line: 72,
            column: 24
          }
        },
        loc: {
          start: {
            line: 72,
            column: 29
          },
          end: {
            line: 76,
            column: 9
          }
        },
        line: 72
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
    hash: "360a20140c82ba209fcff87dfbe210449eeba2ee"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1er9md8jbg = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1er9md8jbg();
import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { DynamicHeight } from "utils/WidgetFeatures";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_1er9md8jbg().s[0]++, {
  features: {
    dynamicHeight: {
      sectionIndex: 4,
      defaultValue: DynamicHeight.FIXED,
      active: true
    }
  },
  type: Widget.getWidgetType(),
  name: "Select",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["dropdown"],
  defaults: {
    rows: 7,
    columns: 20,
    placeholderText: "Select option",
    labelText: "Label",
    labelPosition: LabelPosition.Top,
    labelAlignment: Alignment.LEFT,
    labelWidth: 5,
    options: [{
      label: "Blue",
      value: "BLUE"
    }, {
      label: "Green",
      value: "GREEN"
    }, {
      label: "Red",
      value: "RED"
    }],
    serverSideFiltering: false,
    widgetName: "Select",
    defaultOptionValue: "GREEN",
    version: 1,
    isFilterable: true,
    isRequired: false,
    isDisabled: false,
    animateLoading: true,
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
        cov_1er9md8jbg().f[0]++;
        cov_1er9md8jbg().s[1]++;
        return {
          minWidth: "120px"
        };
      }
    }],
    disableResizeHandles: {
      vertical: true
    }
  }
});
export default Widget;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMWVyOW1kOGpiZyIsImFjdHVhbENvdmVyYWdlIiwiQWxpZ25tZW50IiwiTGFiZWxQb3NpdGlvbiIsIkZJTExfV0lER0VUX01JTl9XSURUSCIsIlJlc3BvbnNpdmVCZWhhdmlvciIsIkR5bmFtaWNIZWlnaHQiLCJJY29uU1ZHIiwiV2lkZ2V0IiwiQ09ORklHIiwicyIsImZlYXR1cmVzIiwiZHluYW1pY0hlaWdodCIsInNlY3Rpb25JbmRleCIsImRlZmF1bHRWYWx1ZSIsIkZJWEVEIiwiYWN0aXZlIiwidHlwZSIsImdldFdpZGdldFR5cGUiLCJuYW1lIiwiaWNvblNWRyIsIm5lZWRzTWV0YSIsInNlYXJjaFRhZ3MiLCJkZWZhdWx0cyIsInJvd3MiLCJjb2x1bW5zIiwicGxhY2Vob2xkZXJUZXh0IiwibGFiZWxUZXh0IiwibGFiZWxQb3NpdGlvbiIsIlRvcCIsImxhYmVsQWxpZ25tZW50IiwiTEVGVCIsImxhYmVsV2lkdGgiLCJvcHRpb25zIiwibGFiZWwiLCJ2YWx1ZSIsInNlcnZlclNpZGVGaWx0ZXJpbmciLCJ3aWRnZXROYW1lIiwiZGVmYXVsdE9wdGlvblZhbHVlIiwidmVyc2lvbiIsImlzRmlsdGVyYWJsZSIsImlzUmVxdWlyZWQiLCJpc0Rpc2FibGVkIiwiYW5pbWF0ZUxvYWRpbmciLCJsYWJlbFRleHRTaXplIiwicmVzcG9uc2l2ZUJlaGF2aW9yIiwiRmlsbCIsIm1pbldpZHRoIiwicHJvcGVydGllcyIsImRlcml2ZWQiLCJnZXREZXJpdmVkUHJvcGVydGllc01hcCIsImRlZmF1bHQiLCJnZXREZWZhdWx0UHJvcGVydGllc01hcCIsIm1ldGEiLCJnZXRNZXRhUHJvcGVydGllc01hcCIsImNvbmZpZyIsImdldFByb3BlcnR5UGFuZUNvbmZpZyIsImNvbnRlbnRDb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnIiwic3R5bGVDb25maWciLCJnZXRQcm9wZXJ0eVBhbmVTdHlsZUNvbmZpZyIsInN0eWxlc2hlZXRDb25maWciLCJnZXRTdHlsZXNoZWV0Q29uZmlnIiwiYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiLCJnZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucyIsImF1dG9MYXlvdXQiLCJkaXNhYmxlZFByb3BzRGVmYXVsdHMiLCJhdXRvRGltZW5zaW9uIiwiaGVpZ2h0Iiwid2lkZ2V0U2l6ZSIsInZpZXdwb3J0TWluV2lkdGgiLCJjb25maWd1cmF0aW9uIiwiZiIsImRpc2FibGVSZXNpemVIYW5kbGVzIiwidmVydGljYWwiXSwic291cmNlcyI6WyJpbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBbGlnbm1lbnQgfSBmcm9tIFwiQGJsdWVwcmludGpzL2NvcmVcIjtcbmltcG9ydCB7IExhYmVsUG9zaXRpb24gfSBmcm9tIFwiY29tcG9uZW50cy9jb25zdGFudHNcIjtcbmltcG9ydCB7IEZJTExfV0lER0VUX01JTl9XSURUSCB9IGZyb20gXCJjb25zdGFudHMvbWluV2lkdGhDb25zdGFudHNcIjtcbmltcG9ydCB7IFJlc3BvbnNpdmVCZWhhdmlvciB9IGZyb20gXCJ1dGlscy9hdXRvTGF5b3V0L2NvbnN0YW50c1wiO1xuaW1wb3J0IHsgRHluYW1pY0hlaWdodCB9IGZyb20gXCJ1dGlscy9XaWRnZXRGZWF0dXJlc1wiO1xuXG5pbXBvcnQgSWNvblNWRyBmcm9tIFwiLi9pY29uLnN2Z1wiO1xuaW1wb3J0IFdpZGdldCBmcm9tIFwiLi93aWRnZXRcIjtcblxuZXhwb3J0IGNvbnN0IENPTkZJRyA9IHtcbiAgZmVhdHVyZXM6IHtcbiAgICBkeW5hbWljSGVpZ2h0OiB7XG4gICAgICBzZWN0aW9uSW5kZXg6IDQsXG4gICAgICBkZWZhdWx0VmFsdWU6IER5bmFtaWNIZWlnaHQuRklYRUQsXG4gICAgICBhY3RpdmU6IHRydWUsXG4gICAgfSxcbiAgfSxcbiAgdHlwZTogV2lkZ2V0LmdldFdpZGdldFR5cGUoKSxcbiAgbmFtZTogXCJTZWxlY3RcIixcbiAgaWNvblNWRzogSWNvblNWRyxcbiAgbmVlZHNNZXRhOiB0cnVlLFxuICBzZWFyY2hUYWdzOiBbXCJkcm9wZG93blwiXSxcbiAgZGVmYXVsdHM6IHtcbiAgICByb3dzOiA3LFxuICAgIGNvbHVtbnM6IDIwLFxuICAgIHBsYWNlaG9sZGVyVGV4dDogXCJTZWxlY3Qgb3B0aW9uXCIsXG4gICAgbGFiZWxUZXh0OiBcIkxhYmVsXCIsXG4gICAgbGFiZWxQb3NpdGlvbjogTGFiZWxQb3NpdGlvbi5Ub3AsXG4gICAgbGFiZWxBbGlnbm1lbnQ6IEFsaWdubWVudC5MRUZULFxuICAgIGxhYmVsV2lkdGg6IDUsXG4gICAgb3B0aW9uczogW1xuICAgICAgeyBsYWJlbDogXCJCbHVlXCIsIHZhbHVlOiBcIkJMVUVcIiB9LFxuICAgICAgeyBsYWJlbDogXCJHcmVlblwiLCB2YWx1ZTogXCJHUkVFTlwiIH0sXG4gICAgICB7IGxhYmVsOiBcIlJlZFwiLCB2YWx1ZTogXCJSRURcIiB9LFxuICAgIF0sXG4gICAgc2VydmVyU2lkZUZpbHRlcmluZzogZmFsc2UsXG4gICAgd2lkZ2V0TmFtZTogXCJTZWxlY3RcIixcbiAgICBkZWZhdWx0T3B0aW9uVmFsdWU6IFwiR1JFRU5cIixcbiAgICB2ZXJzaW9uOiAxLFxuICAgIGlzRmlsdGVyYWJsZTogdHJ1ZSxcbiAgICBpc1JlcXVpcmVkOiBmYWxzZSxcbiAgICBpc0Rpc2FibGVkOiBmYWxzZSxcbiAgICBhbmltYXRlTG9hZGluZzogdHJ1ZSxcbiAgICBsYWJlbFRleHRTaXplOiBcIjAuODc1cmVtXCIsXG4gICAgcmVzcG9uc2l2ZUJlaGF2aW9yOiBSZXNwb25zaXZlQmVoYXZpb3IuRmlsbCxcbiAgICBtaW5XaWR0aDogRklMTF9XSURHRVRfTUlOX1dJRFRILFxuICB9LFxuICBwcm9wZXJ0aWVzOiB7XG4gICAgZGVyaXZlZDogV2lkZ2V0LmdldERlcml2ZWRQcm9wZXJ0aWVzTWFwKCksXG4gICAgZGVmYXVsdDogV2lkZ2V0LmdldERlZmF1bHRQcm9wZXJ0aWVzTWFwKCksXG4gICAgbWV0YTogV2lkZ2V0LmdldE1ldGFQcm9wZXJ0aWVzTWFwKCksXG4gICAgY29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lQ29uZmlnKCksXG4gICAgY29udGVudENvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbnRlbnRDb25maWcoKSxcbiAgICBzdHlsZUNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZVN0eWxlQ29uZmlnKCksXG4gICAgc3R5bGVzaGVldENvbmZpZzogV2lkZ2V0LmdldFN0eWxlc2hlZXRDb25maWcoKSxcbiAgICBhdXRvY29tcGxldGVEZWZpbml0aW9uczogV2lkZ2V0LmdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zKCksXG4gIH0sXG4gIGF1dG9MYXlvdXQ6IHtcbiAgICBkaXNhYmxlZFByb3BzRGVmYXVsdHM6IHtcbiAgICAgIGxhYmVsUG9zaXRpb246IExhYmVsUG9zaXRpb24uVG9wLFxuICAgICAgbGFiZWxUZXh0U2l6ZTogXCIwLjg3NXJlbVwiLFxuICAgIH0sXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgIHJvd3M6IDYuNixcbiAgICB9LFxuICAgIGF1dG9EaW1lbnNpb246IHtcbiAgICAgIGhlaWdodDogdHJ1ZSxcbiAgICB9LFxuICAgIHdpZGdldFNpemU6IFtcbiAgICAgIHtcbiAgICAgICAgdmlld3BvcnRNaW5XaWR0aDogMCxcbiAgICAgICAgY29uZmlndXJhdGlvbjogKCkgPT4ge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtaW5XaWR0aDogXCIxMjBweFwiLFxuICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF0sXG4gICAgZGlzYWJsZVJlc2l6ZUhhbmRsZXM6IHtcbiAgICAgIHZlcnRpY2FsOiB0cnVlLFxuICAgIH0sXG4gIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBXaWRnZXQ7XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxjQUFBLFlB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