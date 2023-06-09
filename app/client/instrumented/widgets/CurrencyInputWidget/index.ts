function cov_1s7zbhu3yp() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/CurrencyInputWidget/index.ts";
  var hash = "4153f0255bed86d6d82447ea8539157c1b630468";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/CurrencyInputWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 11,
          column: 22
        },
        end: {
          line: 72,
          column: 1
        }
      },
      "1": {
        start: {
          line: 62,
          column: 10
        },
        end: {
          line: 64,
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
            line: 65,
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
    hash: "4153f0255bed86d6d82447ea8539157c1b630468"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1s7zbhu3yp = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1s7zbhu3yp();
import { LabelPosition } from "components/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { DynamicHeight } from "utils/WidgetFeatures";
import { CONFIG as BaseConfig } from "widgets/BaseInputWidget";
import { getDefaultCurrency } from "./component/CurrencyCodeDropdown";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_1s7zbhu3yp().s[0]++, {
  features: {
    dynamicHeight: {
      sectionIndex: 3,
      defaultValue: DynamicHeight.FIXED,
      active: true
    }
  },
  type: Widget.getWidgetType(),
  name: "Currency Input",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["amount", "total"],
  defaults: {
    ...BaseConfig.defaults,
    widgetName: "CurrencyInput",
    version: 1,
    rows: 7,
    labelPosition: LabelPosition.Top,
    allowCurrencyChange: false,
    defaultCurrencyCode: getDefaultCurrency().currency,
    decimals: 0,
    showStepArrows: false,
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
        cov_1s7zbhu3yp().f[0]++;
        cov_1s7zbhu3yp().s[1]++;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMXM3emJodTN5cCIsImFjdHVhbENvdmVyYWdlIiwiTGFiZWxQb3NpdGlvbiIsIkZJTExfV0lER0VUX01JTl9XSURUSCIsIlJlc3BvbnNpdmVCZWhhdmlvciIsIkR5bmFtaWNIZWlnaHQiLCJDT05GSUciLCJCYXNlQ29uZmlnIiwiZ2V0RGVmYXVsdEN1cnJlbmN5IiwiSWNvblNWRyIsIldpZGdldCIsInMiLCJmZWF0dXJlcyIsImR5bmFtaWNIZWlnaHQiLCJzZWN0aW9uSW5kZXgiLCJkZWZhdWx0VmFsdWUiLCJGSVhFRCIsImFjdGl2ZSIsInR5cGUiLCJnZXRXaWRnZXRUeXBlIiwibmFtZSIsImljb25TVkciLCJuZWVkc01ldGEiLCJzZWFyY2hUYWdzIiwiZGVmYXVsdHMiLCJ3aWRnZXROYW1lIiwidmVyc2lvbiIsInJvd3MiLCJsYWJlbFBvc2l0aW9uIiwiVG9wIiwiYWxsb3dDdXJyZW5jeUNoYW5nZSIsImRlZmF1bHRDdXJyZW5jeUNvZGUiLCJjdXJyZW5jeSIsImRlY2ltYWxzIiwic2hvd1N0ZXBBcnJvd3MiLCJyZXNwb25zaXZlQmVoYXZpb3IiLCJGaWxsIiwibWluV2lkdGgiLCJwcm9wZXJ0aWVzIiwiZGVyaXZlZCIsImdldERlcml2ZWRQcm9wZXJ0aWVzTWFwIiwiZGVmYXVsdCIsImdldERlZmF1bHRQcm9wZXJ0aWVzTWFwIiwibWV0YSIsImdldE1ldGFQcm9wZXJ0aWVzTWFwIiwiY29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lQ29uZmlnIiwiY29udGVudENvbmZpZyIsImdldFByb3BlcnR5UGFuZUNvbnRlbnRDb25maWciLCJzdHlsZUNvbmZpZyIsImdldFByb3BlcnR5UGFuZVN0eWxlQ29uZmlnIiwic3R5bGVzaGVldENvbmZpZyIsImdldFN0eWxlc2hlZXRDb25maWciLCJhdXRvY29tcGxldGVEZWZpbml0aW9ucyIsImdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiYXV0b0xheW91dCIsImRpc2FibGVkUHJvcHNEZWZhdWx0cyIsImxhYmVsVGV4dFNpemUiLCJhdXRvRGltZW5zaW9uIiwiaGVpZ2h0Iiwid2lkZ2V0U2l6ZSIsInZpZXdwb3J0TWluV2lkdGgiLCJjb25maWd1cmF0aW9uIiwiZiIsImRpc2FibGVSZXNpemVIYW5kbGVzIiwidmVydGljYWwiXSwic291cmNlcyI6WyJpbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBMYWJlbFBvc2l0aW9uIH0gZnJvbSBcImNvbXBvbmVudHMvY29uc3RhbnRzXCI7XG5pbXBvcnQgeyBGSUxMX1dJREdFVF9NSU5fV0lEVEggfSBmcm9tIFwiY29uc3RhbnRzL21pbldpZHRoQ29uc3RhbnRzXCI7XG5pbXBvcnQgeyBSZXNwb25zaXZlQmVoYXZpb3IgfSBmcm9tIFwidXRpbHMvYXV0b0xheW91dC9jb25zdGFudHNcIjtcbmltcG9ydCB7IER5bmFtaWNIZWlnaHQgfSBmcm9tIFwidXRpbHMvV2lkZ2V0RmVhdHVyZXNcIjtcbmltcG9ydCB7IENPTkZJRyBhcyBCYXNlQ29uZmlnIH0gZnJvbSBcIndpZGdldHMvQmFzZUlucHV0V2lkZ2V0XCI7XG5cbmltcG9ydCB7IGdldERlZmF1bHRDdXJyZW5jeSB9IGZyb20gXCIuL2NvbXBvbmVudC9DdXJyZW5jeUNvZGVEcm9wZG93blwiO1xuaW1wb3J0IEljb25TVkcgZnJvbSBcIi4vaWNvbi5zdmdcIjtcbmltcG9ydCBXaWRnZXQgZnJvbSBcIi4vd2lkZ2V0XCI7XG5cbmV4cG9ydCBjb25zdCBDT05GSUcgPSB7XG4gIGZlYXR1cmVzOiB7XG4gICAgZHluYW1pY0hlaWdodDoge1xuICAgICAgc2VjdGlvbkluZGV4OiAzLFxuICAgICAgZGVmYXVsdFZhbHVlOiBEeW5hbWljSGVpZ2h0LkZJWEVELFxuICAgICAgYWN0aXZlOiB0cnVlLFxuICAgIH0sXG4gIH0sXG4gIHR5cGU6IFdpZGdldC5nZXRXaWRnZXRUeXBlKCksXG4gIG5hbWU6IFwiQ3VycmVuY3kgSW5wdXRcIixcbiAgaWNvblNWRzogSWNvblNWRyxcbiAgbmVlZHNNZXRhOiB0cnVlLFxuICBzZWFyY2hUYWdzOiBbXCJhbW91bnRcIiwgXCJ0b3RhbFwiXSxcbiAgZGVmYXVsdHM6IHtcbiAgICAuLi5CYXNlQ29uZmlnLmRlZmF1bHRzLFxuICAgIHdpZGdldE5hbWU6IFwiQ3VycmVuY3lJbnB1dFwiLFxuICAgIHZlcnNpb246IDEsXG4gICAgcm93czogNyxcbiAgICBsYWJlbFBvc2l0aW9uOiBMYWJlbFBvc2l0aW9uLlRvcCxcbiAgICBhbGxvd0N1cnJlbmN5Q2hhbmdlOiBmYWxzZSxcbiAgICBkZWZhdWx0Q3VycmVuY3lDb2RlOiBnZXREZWZhdWx0Q3VycmVuY3koKS5jdXJyZW5jeSxcbiAgICBkZWNpbWFsczogMCxcbiAgICBzaG93U3RlcEFycm93czogZmFsc2UsXG4gICAgcmVzcG9uc2l2ZUJlaGF2aW9yOiBSZXNwb25zaXZlQmVoYXZpb3IuRmlsbCxcbiAgICBtaW5XaWR0aDogRklMTF9XSURHRVRfTUlOX1dJRFRILFxuICB9LFxuICBwcm9wZXJ0aWVzOiB7XG4gICAgZGVyaXZlZDogV2lkZ2V0LmdldERlcml2ZWRQcm9wZXJ0aWVzTWFwKCksXG4gICAgZGVmYXVsdDogV2lkZ2V0LmdldERlZmF1bHRQcm9wZXJ0aWVzTWFwKCksXG4gICAgbWV0YTogV2lkZ2V0LmdldE1ldGFQcm9wZXJ0aWVzTWFwKCksXG4gICAgY29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lQ29uZmlnKCksXG4gICAgY29udGVudENvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbnRlbnRDb25maWcoKSxcbiAgICBzdHlsZUNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZVN0eWxlQ29uZmlnKCksXG4gICAgc3R5bGVzaGVldENvbmZpZzogV2lkZ2V0LmdldFN0eWxlc2hlZXRDb25maWcoKSxcbiAgICBhdXRvY29tcGxldGVEZWZpbml0aW9uczogV2lkZ2V0LmdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zKCksXG4gIH0sXG4gIGF1dG9MYXlvdXQ6IHtcbiAgICBkaXNhYmxlZFByb3BzRGVmYXVsdHM6IHtcbiAgICAgIGxhYmVsUG9zaXRpb246IExhYmVsUG9zaXRpb24uVG9wLFxuICAgICAgbGFiZWxUZXh0U2l6ZTogXCIwLjg3NXJlbVwiLFxuICAgIH0sXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgIHJvd3M6IDYuNixcbiAgICB9LFxuICAgIGF1dG9EaW1lbnNpb246IHtcbiAgICAgIGhlaWdodDogdHJ1ZSxcbiAgICB9LFxuICAgIHdpZGdldFNpemU6IFtcbiAgICAgIHtcbiAgICAgICAgdmlld3BvcnRNaW5XaWR0aDogMCxcbiAgICAgICAgY29uZmlndXJhdGlvbjogKCkgPT4ge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtaW5XaWR0aDogXCIxMjBweFwiLFxuICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF0sXG4gICAgZGlzYWJsZVJlc2l6ZUhhbmRsZXM6IHtcbiAgICAgIHZlcnRpY2FsOiB0cnVlLFxuICAgIH0sXG4gIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBXaWRnZXQ7XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxjQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxjQUFBO0FBZlosU0FBU0UsYUFBYSxRQUFRLHNCQUFzQjtBQUNwRCxTQUFTQyxxQkFBcUIsUUFBUSw2QkFBNkI7QUFDbkUsU0FBU0Msa0JBQWtCLFFBQVEsNEJBQTRCO0FBQy9ELFNBQVNDLGFBQWEsUUFBUSxzQkFBc0I7QUFDcEQsU0FBU0MsTUFBTSxJQUFJQyxVQUFVLFFBQVEseUJBQXlCO0FBRTlELFNBQVNDLGtCQUFrQixRQUFRLGtDQUFrQztBQUNyRSxPQUFPQyxPQUFPLE1BQU0sWUFBWTtBQUNoQyxPQUFPQyxNQUFNLE1BQU0sVUFBVTtBQUU3QixPQUFPLE1BQU1KLE1BQU0sSUFBQU4sY0FBQSxHQUFBVyxDQUFBLE9BQUc7RUFDcEJDLFFBQVEsRUFBRTtJQUNSQyxhQUFhLEVBQUU7TUFDYkMsWUFBWSxFQUFFLENBQUM7TUFDZkMsWUFBWSxFQUFFVixhQUFhLENBQUNXLEtBQUs7TUFDakNDLE1BQU0sRUFBRTtJQUNWO0VBQ0YsQ0FBQztFQUNEQyxJQUFJLEVBQUVSLE1BQU0sQ0FBQ1MsYUFBYSxDQUFDLENBQUM7RUFDNUJDLElBQUksRUFBRSxnQkFBZ0I7RUFDdEJDLE9BQU8sRUFBRVosT0FBTztFQUNoQmEsU0FBUyxFQUFFLElBQUk7RUFDZkMsVUFBVSxFQUFFLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQztFQUMvQkMsUUFBUSxFQUFFO0lBQ1IsR0FBR2pCLFVBQVUsQ0FBQ2lCLFFBQVE7SUFDdEJDLFVBQVUsRUFBRSxlQUFlO0lBQzNCQyxPQUFPLEVBQUUsQ0FBQztJQUNWQyxJQUFJLEVBQUUsQ0FBQztJQUNQQyxhQUFhLEVBQUUxQixhQUFhLENBQUMyQixHQUFHO0lBQ2hDQyxtQkFBbUIsRUFBRSxLQUFLO0lBQzFCQyxtQkFBbUIsRUFBRXZCLGtCQUFrQixDQUFDLENBQUMsQ0FBQ3dCLFFBQVE7SUFDbERDLFFBQVEsRUFBRSxDQUFDO0lBQ1hDLGNBQWMsRUFBRSxLQUFLO0lBQ3JCQyxrQkFBa0IsRUFBRS9CLGtCQUFrQixDQUFDZ0MsSUFBSTtJQUMzQ0MsUUFBUSxFQUFFbEM7RUFDWixDQUFDO0VBQ0RtQyxVQUFVLEVBQUU7SUFDVkMsT0FBTyxFQUFFN0IsTUFBTSxDQUFDOEIsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsT0FBTyxFQUFFL0IsTUFBTSxDQUFDZ0MsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsSUFBSSxFQUFFakMsTUFBTSxDQUFDa0Msb0JBQW9CLENBQUMsQ0FBQztJQUNuQ0MsTUFBTSxFQUFFbkMsTUFBTSxDQUFDb0MscUJBQXFCLENBQUMsQ0FBQztJQUN0Q0MsYUFBYSxFQUFFckMsTUFBTSxDQUFDc0MsNEJBQTRCLENBQUMsQ0FBQztJQUNwREMsV0FBVyxFQUFFdkMsTUFBTSxDQUFDd0MsMEJBQTBCLENBQUMsQ0FBQztJQUNoREMsZ0JBQWdCLEVBQUV6QyxNQUFNLENBQUMwQyxtQkFBbUIsQ0FBQyxDQUFDO0lBQzlDQyx1QkFBdUIsRUFBRTNDLE1BQU0sQ0FBQzRDLDBCQUEwQixDQUFDO0VBQzdELENBQUM7RUFDREMsVUFBVSxFQUFFO0lBQ1ZDLHFCQUFxQixFQUFFO01BQ3JCNUIsYUFBYSxFQUFFMUIsYUFBYSxDQUFDMkIsR0FBRztNQUNoQzRCLGFBQWEsRUFBRTtJQUNqQixDQUFDO0lBQ0RqQyxRQUFRLEVBQUU7TUFDUkcsSUFBSSxFQUFFO0lBQ1IsQ0FBQztJQUNEK0IsYUFBYSxFQUFFO01BQ2JDLE1BQU0sRUFBRTtJQUNWLENBQUM7SUFDREMsVUFBVSxFQUFFLENBQ1Y7TUFDRUMsZ0JBQWdCLEVBQUUsQ0FBQztNQUNuQkMsYUFBYSxFQUFFQSxDQUFBLEtBQU07UUFBQTlELGNBQUEsR0FBQStELENBQUE7UUFBQS9ELGNBQUEsR0FBQVcsQ0FBQTtRQUNuQixPQUFPO1VBQ0wwQixRQUFRLEVBQUU7UUFDWixDQUFDO01BQ0g7SUFDRixDQUFDLENBQ0Y7SUFDRDJCLG9CQUFvQixFQUFFO01BQ3BCQyxRQUFRLEVBQUU7SUFDWjtFQUNGO0FBQ0YsQ0FBQztBQUVELGVBQWV2RCxNQUFNIn0=