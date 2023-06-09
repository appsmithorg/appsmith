function cov_1u841cp6gg() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/MultiSelectWidgetV2/index.ts";
  var hash = "7981650418789d2068110abd0031e0d53627f852";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/MultiSelectWidgetV2/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 10,
          column: 22
        },
        end: {
          line: 84,
          column: 1
        }
      },
      "1": {
        start: {
          line: 74,
          column: 10
        },
        end: {
          line: 76,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 73,
            column: 23
          },
          end: {
            line: 73,
            column: 24
          }
        },
        loc: {
          start: {
            line: 73,
            column: 29
          },
          end: {
            line: 77,
            column: 9
          }
        },
        line: 73
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
    hash: "7981650418789d2068110abd0031e0d53627f852"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1u841cp6gg = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1u841cp6gg();
import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { DynamicHeight } from "utils/WidgetFeatures";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_1u841cp6gg().s[0]++, {
  features: {
    dynamicHeight: {
      sectionIndex: 4,
      defaultValue: DynamicHeight.FIXED,
      active: true
    }
  },
  type: Widget.getWidgetType(),
  name: "MultiSelect",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["dropdown", "tags"],
  defaults: {
    rows: 7,
    columns: 20,
    animateLoading: true,
    labelText: "Label",
    labelPosition: LabelPosition.Top,
    labelAlignment: Alignment.LEFT,
    labelWidth: 5,
    labelTextSize: "0.875rem",
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
    widgetName: "MultiSelect",
    isFilterable: true,
    serverSideFiltering: false,
    defaultOptionValue: ["GREEN", "RED"],
    version: 1,
    isRequired: false,
    isDisabled: false,
    placeholderText: "Select option(s)",
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
        cov_1u841cp6gg().f[0]++;
        cov_1u841cp6gg().s[1]++;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMXU4NDFjcDZnZyIsImFjdHVhbENvdmVyYWdlIiwiQWxpZ25tZW50IiwiTGFiZWxQb3NpdGlvbiIsIkZJTExfV0lER0VUX01JTl9XSURUSCIsIlJlc3BvbnNpdmVCZWhhdmlvciIsIkR5bmFtaWNIZWlnaHQiLCJJY29uU1ZHIiwiV2lkZ2V0IiwiQ09ORklHIiwicyIsImZlYXR1cmVzIiwiZHluYW1pY0hlaWdodCIsInNlY3Rpb25JbmRleCIsImRlZmF1bHRWYWx1ZSIsIkZJWEVEIiwiYWN0aXZlIiwidHlwZSIsImdldFdpZGdldFR5cGUiLCJuYW1lIiwiaWNvblNWRyIsIm5lZWRzTWV0YSIsInNlYXJjaFRhZ3MiLCJkZWZhdWx0cyIsInJvd3MiLCJjb2x1bW5zIiwiYW5pbWF0ZUxvYWRpbmciLCJsYWJlbFRleHQiLCJsYWJlbFBvc2l0aW9uIiwiVG9wIiwibGFiZWxBbGlnbm1lbnQiLCJMRUZUIiwibGFiZWxXaWR0aCIsImxhYmVsVGV4dFNpemUiLCJvcHRpb25zIiwibGFiZWwiLCJ2YWx1ZSIsIndpZGdldE5hbWUiLCJpc0ZpbHRlcmFibGUiLCJzZXJ2ZXJTaWRlRmlsdGVyaW5nIiwiZGVmYXVsdE9wdGlvblZhbHVlIiwidmVyc2lvbiIsImlzUmVxdWlyZWQiLCJpc0Rpc2FibGVkIiwicGxhY2Vob2xkZXJUZXh0IiwicmVzcG9uc2l2ZUJlaGF2aW9yIiwiRmlsbCIsIm1pbldpZHRoIiwicHJvcGVydGllcyIsImRlcml2ZWQiLCJnZXREZXJpdmVkUHJvcGVydGllc01hcCIsImRlZmF1bHQiLCJnZXREZWZhdWx0UHJvcGVydGllc01hcCIsIm1ldGEiLCJnZXRNZXRhUHJvcGVydGllc01hcCIsImNvbmZpZyIsImdldFByb3BlcnR5UGFuZUNvbmZpZyIsImNvbnRlbnRDb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnIiwic3R5bGVDb25maWciLCJnZXRQcm9wZXJ0eVBhbmVTdHlsZUNvbmZpZyIsInN0eWxlc2hlZXRDb25maWciLCJnZXRTdHlsZXNoZWV0Q29uZmlnIiwiYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiLCJnZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucyIsImF1dG9MYXlvdXQiLCJkaXNhYmxlZFByb3BzRGVmYXVsdHMiLCJhdXRvRGltZW5zaW9uIiwiaGVpZ2h0Iiwid2lkZ2V0U2l6ZSIsInZpZXdwb3J0TWluV2lkdGgiLCJjb25maWd1cmF0aW9uIiwiZiIsImRpc2FibGVSZXNpemVIYW5kbGVzIiwidmVydGljYWwiXSwic291cmNlcyI6WyJpbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBbGlnbm1lbnQgfSBmcm9tIFwiQGJsdWVwcmludGpzL2NvcmVcIjtcbmltcG9ydCB7IExhYmVsUG9zaXRpb24gfSBmcm9tIFwiY29tcG9uZW50cy9jb25zdGFudHNcIjtcbmltcG9ydCB7IEZJTExfV0lER0VUX01JTl9XSURUSCB9IGZyb20gXCJjb25zdGFudHMvbWluV2lkdGhDb25zdGFudHNcIjtcbmltcG9ydCB7IFJlc3BvbnNpdmVCZWhhdmlvciB9IGZyb20gXCJ1dGlscy9hdXRvTGF5b3V0L2NvbnN0YW50c1wiO1xuaW1wb3J0IHsgRHluYW1pY0hlaWdodCB9IGZyb20gXCJ1dGlscy9XaWRnZXRGZWF0dXJlc1wiO1xuXG5pbXBvcnQgSWNvblNWRyBmcm9tIFwiLi9pY29uLnN2Z1wiO1xuaW1wb3J0IFdpZGdldCBmcm9tIFwiLi93aWRnZXRcIjtcblxuZXhwb3J0IGNvbnN0IENPTkZJRyA9IHtcbiAgZmVhdHVyZXM6IHtcbiAgICBkeW5hbWljSGVpZ2h0OiB7XG4gICAgICBzZWN0aW9uSW5kZXg6IDQsXG4gICAgICBkZWZhdWx0VmFsdWU6IER5bmFtaWNIZWlnaHQuRklYRUQsXG4gICAgICBhY3RpdmU6IHRydWUsXG4gICAgfSxcbiAgfSxcbiAgdHlwZTogV2lkZ2V0LmdldFdpZGdldFR5cGUoKSxcbiAgbmFtZTogXCJNdWx0aVNlbGVjdFwiLFxuICBpY29uU1ZHOiBJY29uU1ZHLFxuICBuZWVkc01ldGE6IHRydWUsXG4gIHNlYXJjaFRhZ3M6IFtcImRyb3Bkb3duXCIsIFwidGFnc1wiXSxcbiAgZGVmYXVsdHM6IHtcbiAgICByb3dzOiA3LFxuICAgIGNvbHVtbnM6IDIwLFxuICAgIGFuaW1hdGVMb2FkaW5nOiB0cnVlLFxuICAgIGxhYmVsVGV4dDogXCJMYWJlbFwiLFxuICAgIGxhYmVsUG9zaXRpb246IExhYmVsUG9zaXRpb24uVG9wLFxuICAgIGxhYmVsQWxpZ25tZW50OiBBbGlnbm1lbnQuTEVGVCxcbiAgICBsYWJlbFdpZHRoOiA1LFxuICAgIGxhYmVsVGV4dFNpemU6IFwiMC44NzVyZW1cIixcbiAgICBvcHRpb25zOiBbXG4gICAgICB7IGxhYmVsOiBcIkJsdWVcIiwgdmFsdWU6IFwiQkxVRVwiIH0sXG4gICAgICB7IGxhYmVsOiBcIkdyZWVuXCIsIHZhbHVlOiBcIkdSRUVOXCIgfSxcbiAgICAgIHsgbGFiZWw6IFwiUmVkXCIsIHZhbHVlOiBcIlJFRFwiIH0sXG4gICAgXSxcbiAgICB3aWRnZXROYW1lOiBcIk11bHRpU2VsZWN0XCIsXG4gICAgaXNGaWx0ZXJhYmxlOiB0cnVlLFxuICAgIHNlcnZlclNpZGVGaWx0ZXJpbmc6IGZhbHNlLFxuICAgIGRlZmF1bHRPcHRpb25WYWx1ZTogW1wiR1JFRU5cIiwgXCJSRURcIl0sXG4gICAgdmVyc2lvbjogMSxcbiAgICBpc1JlcXVpcmVkOiBmYWxzZSxcbiAgICBpc0Rpc2FibGVkOiBmYWxzZSxcbiAgICBwbGFjZWhvbGRlclRleHQ6IFwiU2VsZWN0IG9wdGlvbihzKVwiLFxuICAgIHJlc3BvbnNpdmVCZWhhdmlvcjogUmVzcG9uc2l2ZUJlaGF2aW9yLkZpbGwsXG4gICAgbWluV2lkdGg6IEZJTExfV0lER0VUX01JTl9XSURUSCxcbiAgfSxcblxuICBwcm9wZXJ0aWVzOiB7XG4gICAgZGVyaXZlZDogV2lkZ2V0LmdldERlcml2ZWRQcm9wZXJ0aWVzTWFwKCksXG4gICAgZGVmYXVsdDogV2lkZ2V0LmdldERlZmF1bHRQcm9wZXJ0aWVzTWFwKCksXG4gICAgbWV0YTogV2lkZ2V0LmdldE1ldGFQcm9wZXJ0aWVzTWFwKCksXG4gICAgY29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lQ29uZmlnKCksXG4gICAgY29udGVudENvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbnRlbnRDb25maWcoKSxcbiAgICBzdHlsZUNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZVN0eWxlQ29uZmlnKCksXG4gICAgc3R5bGVzaGVldENvbmZpZzogV2lkZ2V0LmdldFN0eWxlc2hlZXRDb25maWcoKSxcbiAgICBhdXRvY29tcGxldGVEZWZpbml0aW9uczogV2lkZ2V0LmdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zKCksXG4gIH0sXG4gIGF1dG9MYXlvdXQ6IHtcbiAgICBkaXNhYmxlZFByb3BzRGVmYXVsdHM6IHtcbiAgICAgIGxhYmVsUG9zaXRpb246IExhYmVsUG9zaXRpb24uVG9wLFxuICAgICAgbGFiZWxUZXh0U2l6ZTogXCIwLjg3NXJlbVwiLFxuICAgIH0sXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgIHJvd3M6IDYuNixcbiAgICB9LFxuICAgIGF1dG9EaW1lbnNpb246IHtcbiAgICAgIGhlaWdodDogdHJ1ZSxcbiAgICB9LFxuICAgIHdpZGdldFNpemU6IFtcbiAgICAgIHtcbiAgICAgICAgdmlld3BvcnRNaW5XaWR0aDogMCxcbiAgICAgICAgY29uZmlndXJhdGlvbjogKCkgPT4ge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtaW5XaWR0aDogXCIxNjBweFwiLFxuICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF0sXG4gICAgZGlzYWJsZVJlc2l6ZUhhbmRsZXM6IHtcbiAgICAgIHZlcnRpY2FsOiB0cnVlLFxuICAgIH0sXG4gIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBXaWRnZXQ7XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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