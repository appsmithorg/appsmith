function cov_7zuffjgyo() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/CheckboxWidget/index.ts";
  var hash = "f220a8e307f33ba88279e53c21de97e5aa6e2ee2";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/CheckboxWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 9,
          column: 22
        },
        end: {
          line: 65,
          column: 1
        }
      },
      "1": {
        start: {
          line: 54,
          column: 10
        },
        end: {
          line: 57,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 53,
            column: 23
          },
          end: {
            line: 53,
            column: 24
          }
        },
        loc: {
          start: {
            line: 53,
            column: 29
          },
          end: {
            line: 58,
            column: 9
          }
        },
        line: 53
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
    hash: "f220a8e307f33ba88279e53c21de97e5aa6e2ee2"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_7zuffjgyo = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_7zuffjgyo();
import { LabelPosition } from "components/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { AlignWidgetTypes } from "widgets/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_7zuffjgyo().s[0]++, {
  features: {
    dynamicHeight: {
      sectionIndex: 2,
      active: true
    }
  },
  type: Widget.getWidgetType(),
  name: "Checkbox",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["boolean"],
  defaults: {
    rows: 4,
    columns: 12,
    label: "Label",
    defaultCheckedState: true,
    widgetName: "Checkbox",
    version: 1,
    alignWidget: AlignWidgetTypes.LEFT,
    labelPosition: LabelPosition.Left,
    isDisabled: false,
    isRequired: false,
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
    disabledPropsDefaults: {
      labelTextSize: "0.875rem"
    },
    widgetSize: [{
      viewportMinWidth: 0,
      configuration: () => {
        cov_7zuffjgyo().f[0]++;
        cov_7zuffjgyo().s[1]++;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfN3p1ZmZqZ3lvIiwiYWN0dWFsQ292ZXJhZ2UiLCJMYWJlbFBvc2l0aW9uIiwiRklMTF9XSURHRVRfTUlOX1dJRFRIIiwiUmVzcG9uc2l2ZUJlaGF2aW9yIiwiQWxpZ25XaWRnZXRUeXBlcyIsIkljb25TVkciLCJXaWRnZXQiLCJDT05GSUciLCJzIiwiZmVhdHVyZXMiLCJkeW5hbWljSGVpZ2h0Iiwic2VjdGlvbkluZGV4IiwiYWN0aXZlIiwidHlwZSIsImdldFdpZGdldFR5cGUiLCJuYW1lIiwiaWNvblNWRyIsIm5lZWRzTWV0YSIsInNlYXJjaFRhZ3MiLCJkZWZhdWx0cyIsInJvd3MiLCJjb2x1bW5zIiwibGFiZWwiLCJkZWZhdWx0Q2hlY2tlZFN0YXRlIiwid2lkZ2V0TmFtZSIsInZlcnNpb24iLCJhbGlnbldpZGdldCIsIkxFRlQiLCJsYWJlbFBvc2l0aW9uIiwiTGVmdCIsImlzRGlzYWJsZWQiLCJpc1JlcXVpcmVkIiwiYW5pbWF0ZUxvYWRpbmciLCJyZXNwb25zaXZlQmVoYXZpb3IiLCJGaWxsIiwibWluV2lkdGgiLCJwcm9wZXJ0aWVzIiwiZGVyaXZlZCIsImdldERlcml2ZWRQcm9wZXJ0aWVzTWFwIiwiZGVmYXVsdCIsImdldERlZmF1bHRQcm9wZXJ0aWVzTWFwIiwibWV0YSIsImdldE1ldGFQcm9wZXJ0aWVzTWFwIiwiY29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lQ29uZmlnIiwiY29udGVudENvbmZpZyIsImdldFByb3BlcnR5UGFuZUNvbnRlbnRDb25maWciLCJzdHlsZUNvbmZpZyIsImdldFByb3BlcnR5UGFuZVN0eWxlQ29uZmlnIiwic3R5bGVzaGVldENvbmZpZyIsImdldFN0eWxlc2hlZXRDb25maWciLCJhdXRvY29tcGxldGVEZWZpbml0aW9ucyIsImdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiYXV0b0xheW91dCIsImRpc2FibGVkUHJvcHNEZWZhdWx0cyIsImxhYmVsVGV4dFNpemUiLCJ3aWRnZXRTaXplIiwidmlld3BvcnRNaW5XaWR0aCIsImNvbmZpZ3VyYXRpb24iLCJmIiwibWluSGVpZ2h0IiwiZGlzYWJsZVJlc2l6ZUhhbmRsZXMiLCJ2ZXJ0aWNhbCJdLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IExhYmVsUG9zaXRpb24gfSBmcm9tIFwiY29tcG9uZW50cy9jb25zdGFudHNcIjtcbmltcG9ydCB7IEZJTExfV0lER0VUX01JTl9XSURUSCB9IGZyb20gXCJjb25zdGFudHMvbWluV2lkdGhDb25zdGFudHNcIjtcbmltcG9ydCB7IFJlc3BvbnNpdmVCZWhhdmlvciB9IGZyb20gXCJ1dGlscy9hdXRvTGF5b3V0L2NvbnN0YW50c1wiO1xuaW1wb3J0IHsgQWxpZ25XaWRnZXRUeXBlcyB9IGZyb20gXCJ3aWRnZXRzL2NvbnN0YW50c1wiO1xuXG5pbXBvcnQgSWNvblNWRyBmcm9tIFwiLi9pY29uLnN2Z1wiO1xuaW1wb3J0IFdpZGdldCBmcm9tIFwiLi93aWRnZXRcIjtcblxuZXhwb3J0IGNvbnN0IENPTkZJRyA9IHtcbiAgZmVhdHVyZXM6IHtcbiAgICBkeW5hbWljSGVpZ2h0OiB7XG4gICAgICBzZWN0aW9uSW5kZXg6IDIsXG4gICAgICBhY3RpdmU6IHRydWUsXG4gICAgfSxcbiAgfSxcbiAgdHlwZTogV2lkZ2V0LmdldFdpZGdldFR5cGUoKSxcbiAgbmFtZTogXCJDaGVja2JveFwiLFxuICBpY29uU1ZHOiBJY29uU1ZHLFxuICBuZWVkc01ldGE6IHRydWUsXG4gIHNlYXJjaFRhZ3M6IFtcImJvb2xlYW5cIl0sXG4gIGRlZmF1bHRzOiB7XG4gICAgcm93czogNCxcbiAgICBjb2x1bW5zOiAxMixcbiAgICBsYWJlbDogXCJMYWJlbFwiLFxuICAgIGRlZmF1bHRDaGVja2VkU3RhdGU6IHRydWUsXG4gICAgd2lkZ2V0TmFtZTogXCJDaGVja2JveFwiLFxuICAgIHZlcnNpb246IDEsXG4gICAgYWxpZ25XaWRnZXQ6IEFsaWduV2lkZ2V0VHlwZXMuTEVGVCxcbiAgICBsYWJlbFBvc2l0aW9uOiBMYWJlbFBvc2l0aW9uLkxlZnQsXG4gICAgaXNEaXNhYmxlZDogZmFsc2UsXG4gICAgaXNSZXF1aXJlZDogZmFsc2UsXG4gICAgYW5pbWF0ZUxvYWRpbmc6IHRydWUsXG4gICAgcmVzcG9uc2l2ZUJlaGF2aW9yOiBSZXNwb25zaXZlQmVoYXZpb3IuRmlsbCxcbiAgICBtaW5XaWR0aDogRklMTF9XSURHRVRfTUlOX1dJRFRILFxuICB9LFxuICBwcm9wZXJ0aWVzOiB7XG4gICAgZGVyaXZlZDogV2lkZ2V0LmdldERlcml2ZWRQcm9wZXJ0aWVzTWFwKCksXG4gICAgZGVmYXVsdDogV2lkZ2V0LmdldERlZmF1bHRQcm9wZXJ0aWVzTWFwKCksXG4gICAgbWV0YTogV2lkZ2V0LmdldE1ldGFQcm9wZXJ0aWVzTWFwKCksXG4gICAgY29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lQ29uZmlnKCksXG4gICAgY29udGVudENvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbnRlbnRDb25maWcoKSxcbiAgICBzdHlsZUNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZVN0eWxlQ29uZmlnKCksXG4gICAgc3R5bGVzaGVldENvbmZpZzogV2lkZ2V0LmdldFN0eWxlc2hlZXRDb25maWcoKSxcbiAgICBhdXRvY29tcGxldGVEZWZpbml0aW9uczogV2lkZ2V0LmdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zKCksXG4gIH0sXG4gIGF1dG9MYXlvdXQ6IHtcbiAgICBkaXNhYmxlZFByb3BzRGVmYXVsdHM6IHtcbiAgICAgIGxhYmVsVGV4dFNpemU6IFwiMC44NzVyZW1cIixcbiAgICB9LFxuICAgIHdpZGdldFNpemU6IFtcbiAgICAgIHtcbiAgICAgICAgdmlld3BvcnRNaW5XaWR0aDogMCxcbiAgICAgICAgY29uZmlndXJhdGlvbjogKCkgPT4ge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtaW5XaWR0aDogXCIxMjBweFwiLFxuICAgICAgICAgICAgbWluSGVpZ2h0OiBcIjQwcHhcIixcbiAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdLFxuICAgIGRpc2FibGVSZXNpemVIYW5kbGVzOiB7XG4gICAgICB2ZXJ0aWNhbDogdHJ1ZSxcbiAgICB9LFxuICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgV2lkZ2V0O1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsYUFBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsYUFBQTtBQWZaLFNBQVNFLGFBQWEsUUFBUSxzQkFBc0I7QUFDcEQsU0FBU0MscUJBQXFCLFFBQVEsNkJBQTZCO0FBQ25FLFNBQVNDLGtCQUFrQixRQUFRLDRCQUE0QjtBQUMvRCxTQUFTQyxnQkFBZ0IsUUFBUSxtQkFBbUI7QUFFcEQsT0FBT0MsT0FBTyxNQUFNLFlBQVk7QUFDaEMsT0FBT0MsTUFBTSxNQUFNLFVBQVU7QUFFN0IsT0FBTyxNQUFNQyxNQUFNLElBQUFSLGFBQUEsR0FBQVMsQ0FBQSxPQUFHO0VBQ3BCQyxRQUFRLEVBQUU7SUFDUkMsYUFBYSxFQUFFO01BQ2JDLFlBQVksRUFBRSxDQUFDO01BQ2ZDLE1BQU0sRUFBRTtJQUNWO0VBQ0YsQ0FBQztFQUNEQyxJQUFJLEVBQUVQLE1BQU0sQ0FBQ1EsYUFBYSxDQUFDLENBQUM7RUFDNUJDLElBQUksRUFBRSxVQUFVO0VBQ2hCQyxPQUFPLEVBQUVYLE9BQU87RUFDaEJZLFNBQVMsRUFBRSxJQUFJO0VBQ2ZDLFVBQVUsRUFBRSxDQUFDLFNBQVMsQ0FBQztFQUN2QkMsUUFBUSxFQUFFO0lBQ1JDLElBQUksRUFBRSxDQUFDO0lBQ1BDLE9BQU8sRUFBRSxFQUFFO0lBQ1hDLEtBQUssRUFBRSxPQUFPO0lBQ2RDLG1CQUFtQixFQUFFLElBQUk7SUFDekJDLFVBQVUsRUFBRSxVQUFVO0lBQ3RCQyxPQUFPLEVBQUUsQ0FBQztJQUNWQyxXQUFXLEVBQUV0QixnQkFBZ0IsQ0FBQ3VCLElBQUk7SUFDbENDLGFBQWEsRUFBRTNCLGFBQWEsQ0FBQzRCLElBQUk7SUFDakNDLFVBQVUsRUFBRSxLQUFLO0lBQ2pCQyxVQUFVLEVBQUUsS0FBSztJQUNqQkMsY0FBYyxFQUFFLElBQUk7SUFDcEJDLGtCQUFrQixFQUFFOUIsa0JBQWtCLENBQUMrQixJQUFJO0lBQzNDQyxRQUFRLEVBQUVqQztFQUNaLENBQUM7RUFDRGtDLFVBQVUsRUFBRTtJQUNWQyxPQUFPLEVBQUUvQixNQUFNLENBQUNnQyx1QkFBdUIsQ0FBQyxDQUFDO0lBQ3pDQyxPQUFPLEVBQUVqQyxNQUFNLENBQUNrQyx1QkFBdUIsQ0FBQyxDQUFDO0lBQ3pDQyxJQUFJLEVBQUVuQyxNQUFNLENBQUNvQyxvQkFBb0IsQ0FBQyxDQUFDO0lBQ25DQyxNQUFNLEVBQUVyQyxNQUFNLENBQUNzQyxxQkFBcUIsQ0FBQyxDQUFDO0lBQ3RDQyxhQUFhLEVBQUV2QyxNQUFNLENBQUN3Qyw0QkFBNEIsQ0FBQyxDQUFDO0lBQ3BEQyxXQUFXLEVBQUV6QyxNQUFNLENBQUMwQywwQkFBMEIsQ0FBQyxDQUFDO0lBQ2hEQyxnQkFBZ0IsRUFBRTNDLE1BQU0sQ0FBQzRDLG1CQUFtQixDQUFDLENBQUM7SUFDOUNDLHVCQUF1QixFQUFFN0MsTUFBTSxDQUFDOEMsMEJBQTBCLENBQUM7RUFDN0QsQ0FBQztFQUNEQyxVQUFVLEVBQUU7SUFDVkMscUJBQXFCLEVBQUU7TUFDckJDLGFBQWEsRUFBRTtJQUNqQixDQUFDO0lBQ0RDLFVBQVUsRUFBRSxDQUNWO01BQ0VDLGdCQUFnQixFQUFFLENBQUM7TUFDbkJDLGFBQWEsRUFBRUEsQ0FBQSxLQUFNO1FBQUEzRCxhQUFBLEdBQUE0RCxDQUFBO1FBQUE1RCxhQUFBLEdBQUFTLENBQUE7UUFDbkIsT0FBTztVQUNMMkIsUUFBUSxFQUFFLE9BQU87VUFDakJ5QixTQUFTLEVBQUU7UUFDYixDQUFDO01BQ0g7SUFDRixDQUFDLENBQ0Y7SUFDREMsb0JBQW9CLEVBQUU7TUFDcEJDLFFBQVEsRUFBRTtJQUNaO0VBQ0Y7QUFDRixDQUFDO0FBRUQsZUFBZXhELE1BQU0ifQ==