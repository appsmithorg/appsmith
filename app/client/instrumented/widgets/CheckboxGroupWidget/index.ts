function cov_2a0d3eq9d5() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/CheckboxGroupWidget/index.ts";
  var hash = "50cbd524136eb7bad7d3c2600865218d76c6c17d";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/CheckboxGroupWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 7,
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
    hash: "50cbd524136eb7bad7d3c2600865218d76c6c17d"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_2a0d3eq9d5 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_2a0d3eq9d5();
import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_2a0d3eq9d5().s[0]++, {
  features: {
    dynamicHeight: {
      sectionIndex: 3,
      active: true
    }
  },
  type: Widget.getWidgetType(),
  name: "Checkbox Group",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 6,
    columns: 23,
    animateLoading: true,
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
    defaultSelectedValues: ["BLUE"],
    isDisabled: false,
    isInline: true,
    isRequired: false,
    isVisible: true,
    labelText: "Label",
    labelPosition: LabelPosition.Top,
    labelAlignment: Alignment.LEFT,
    labelWidth: 5,
    widgetName: "CheckboxGroup",
    version: 2
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
    defaults: {
      columns: 14,
      rows: 7
    },
    disabledPropsDefaults: {
      labelPosition: LabelPosition.Top
    },
    autoDimension: {
      height: true
    },
    widgetSize: [{
      viewportMinWidth: 0,
      configuration: () => {
        cov_2a0d3eq9d5().f[0]++;
        cov_2a0d3eq9d5().s[1]++;
        return {
          minWidth: "240px",
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMmEwZDNlcTlkNSIsImFjdHVhbENvdmVyYWdlIiwiQWxpZ25tZW50IiwiTGFiZWxQb3NpdGlvbiIsIkljb25TVkciLCJXaWRnZXQiLCJDT05GSUciLCJzIiwiZmVhdHVyZXMiLCJkeW5hbWljSGVpZ2h0Iiwic2VjdGlvbkluZGV4IiwiYWN0aXZlIiwidHlwZSIsImdldFdpZGdldFR5cGUiLCJuYW1lIiwiaWNvblNWRyIsIm5lZWRzTWV0YSIsImRlZmF1bHRzIiwicm93cyIsImNvbHVtbnMiLCJhbmltYXRlTG9hZGluZyIsImxhYmVsVGV4dFNpemUiLCJvcHRpb25zIiwibGFiZWwiLCJ2YWx1ZSIsImRlZmF1bHRTZWxlY3RlZFZhbHVlcyIsImlzRGlzYWJsZWQiLCJpc0lubGluZSIsImlzUmVxdWlyZWQiLCJpc1Zpc2libGUiLCJsYWJlbFRleHQiLCJsYWJlbFBvc2l0aW9uIiwiVG9wIiwibGFiZWxBbGlnbm1lbnQiLCJMRUZUIiwibGFiZWxXaWR0aCIsIndpZGdldE5hbWUiLCJ2ZXJzaW9uIiwicHJvcGVydGllcyIsImRlcml2ZWQiLCJnZXREZXJpdmVkUHJvcGVydGllc01hcCIsImRlZmF1bHQiLCJnZXREZWZhdWx0UHJvcGVydGllc01hcCIsIm1ldGEiLCJnZXRNZXRhUHJvcGVydGllc01hcCIsImNvbmZpZyIsImdldFByb3BlcnR5UGFuZUNvbmZpZyIsImNvbnRlbnRDb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnIiwic3R5bGVDb25maWciLCJnZXRQcm9wZXJ0eVBhbmVTdHlsZUNvbmZpZyIsInN0eWxlc2hlZXRDb25maWciLCJnZXRTdHlsZXNoZWV0Q29uZmlnIiwiYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiLCJnZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucyIsImF1dG9MYXlvdXQiLCJkaXNhYmxlZFByb3BzRGVmYXVsdHMiLCJhdXRvRGltZW5zaW9uIiwiaGVpZ2h0Iiwid2lkZ2V0U2l6ZSIsInZpZXdwb3J0TWluV2lkdGgiLCJjb25maWd1cmF0aW9uIiwiZiIsIm1pbldpZHRoIiwibWluSGVpZ2h0IiwiZGlzYWJsZVJlc2l6ZUhhbmRsZXMiLCJ2ZXJ0aWNhbCJdLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFsaWdubWVudCB9IGZyb20gXCJAYmx1ZXByaW50anMvY29yZVwiO1xuaW1wb3J0IHsgTGFiZWxQb3NpdGlvbiB9IGZyb20gXCJjb21wb25lbnRzL2NvbnN0YW50c1wiO1xuXG5pbXBvcnQgSWNvblNWRyBmcm9tIFwiLi9pY29uLnN2Z1wiO1xuaW1wb3J0IFdpZGdldCBmcm9tIFwiLi93aWRnZXRcIjtcblxuZXhwb3J0IGNvbnN0IENPTkZJRyA9IHtcbiAgZmVhdHVyZXM6IHtcbiAgICBkeW5hbWljSGVpZ2h0OiB7XG4gICAgICBzZWN0aW9uSW5kZXg6IDMsXG4gICAgICBhY3RpdmU6IHRydWUsXG4gICAgfSxcbiAgfSxcbiAgdHlwZTogV2lkZ2V0LmdldFdpZGdldFR5cGUoKSxcbiAgbmFtZTogXCJDaGVja2JveCBHcm91cFwiLFxuICBpY29uU1ZHOiBJY29uU1ZHLFxuICBuZWVkc01ldGE6IHRydWUsXG4gIGRlZmF1bHRzOiB7XG4gICAgcm93czogNixcbiAgICBjb2x1bW5zOiAyMyxcbiAgICBhbmltYXRlTG9hZGluZzogdHJ1ZSxcbiAgICBsYWJlbFRleHRTaXplOiBcIjAuODc1cmVtXCIsXG4gICAgb3B0aW9uczogW1xuICAgICAgeyBsYWJlbDogXCJCbHVlXCIsIHZhbHVlOiBcIkJMVUVcIiB9LFxuICAgICAgeyBsYWJlbDogXCJHcmVlblwiLCB2YWx1ZTogXCJHUkVFTlwiIH0sXG4gICAgICB7IGxhYmVsOiBcIlJlZFwiLCB2YWx1ZTogXCJSRURcIiB9LFxuICAgIF0sXG4gICAgZGVmYXVsdFNlbGVjdGVkVmFsdWVzOiBbXCJCTFVFXCJdLFxuICAgIGlzRGlzYWJsZWQ6IGZhbHNlLFxuICAgIGlzSW5saW5lOiB0cnVlLFxuICAgIGlzUmVxdWlyZWQ6IGZhbHNlLFxuICAgIGlzVmlzaWJsZTogdHJ1ZSxcbiAgICBsYWJlbFRleHQ6IFwiTGFiZWxcIixcbiAgICBsYWJlbFBvc2l0aW9uOiBMYWJlbFBvc2l0aW9uLlRvcCxcbiAgICBsYWJlbEFsaWdubWVudDogQWxpZ25tZW50LkxFRlQsXG4gICAgbGFiZWxXaWR0aDogNSxcbiAgICB3aWRnZXROYW1lOiBcIkNoZWNrYm94R3JvdXBcIixcbiAgICB2ZXJzaW9uOiAyLFxuICB9LFxuICBwcm9wZXJ0aWVzOiB7XG4gICAgZGVyaXZlZDogV2lkZ2V0LmdldERlcml2ZWRQcm9wZXJ0aWVzTWFwKCksXG4gICAgZGVmYXVsdDogV2lkZ2V0LmdldERlZmF1bHRQcm9wZXJ0aWVzTWFwKCksXG4gICAgbWV0YTogV2lkZ2V0LmdldE1ldGFQcm9wZXJ0aWVzTWFwKCksXG4gICAgY29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lQ29uZmlnKCksXG4gICAgY29udGVudENvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbnRlbnRDb25maWcoKSxcbiAgICBzdHlsZUNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZVN0eWxlQ29uZmlnKCksXG4gICAgc3R5bGVzaGVldENvbmZpZzogV2lkZ2V0LmdldFN0eWxlc2hlZXRDb25maWcoKSxcbiAgICBhdXRvY29tcGxldGVEZWZpbml0aW9uczogV2lkZ2V0LmdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zKCksXG4gIH0sXG4gIGF1dG9MYXlvdXQ6IHtcbiAgICBkZWZhdWx0czoge1xuICAgICAgY29sdW1uczogMTQsXG4gICAgICByb3dzOiA3LFxuICAgIH0sXG4gICAgZGlzYWJsZWRQcm9wc0RlZmF1bHRzOiB7XG4gICAgICBsYWJlbFBvc2l0aW9uOiBMYWJlbFBvc2l0aW9uLlRvcCxcbiAgICB9LFxuICAgIGF1dG9EaW1lbnNpb246IHtcbiAgICAgIGhlaWdodDogdHJ1ZSxcbiAgICB9LFxuICAgIHdpZGdldFNpemU6IFtcbiAgICAgIHtcbiAgICAgICAgdmlld3BvcnRNaW5XaWR0aDogMCxcbiAgICAgICAgY29uZmlndXJhdGlvbjogKCkgPT4ge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtaW5XaWR0aDogXCIyNDBweFwiLFxuICAgICAgICAgICAgbWluSGVpZ2h0OiBcIjcwcHhcIixcbiAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdLFxuICAgIGRpc2FibGVSZXNpemVIYW5kbGVzOiB7XG4gICAgICB2ZXJ0aWNhbDogdHJ1ZSxcbiAgICB9LFxuICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgV2lkZ2V0O1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsY0FBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsY0FBQTtBQWZaLFNBQVNFLFNBQVMsUUFBUSxtQkFBbUI7QUFDN0MsU0FBU0MsYUFBYSxRQUFRLHNCQUFzQjtBQUVwRCxPQUFPQyxPQUFPLE1BQU0sWUFBWTtBQUNoQyxPQUFPQyxNQUFNLE1BQU0sVUFBVTtBQUU3QixPQUFPLE1BQU1DLE1BQU0sSUFBQU4sY0FBQSxHQUFBTyxDQUFBLE9BQUc7RUFDcEJDLFFBQVEsRUFBRTtJQUNSQyxhQUFhLEVBQUU7TUFDYkMsWUFBWSxFQUFFLENBQUM7TUFDZkMsTUFBTSxFQUFFO0lBQ1Y7RUFDRixDQUFDO0VBQ0RDLElBQUksRUFBRVAsTUFBTSxDQUFDUSxhQUFhLENBQUMsQ0FBQztFQUM1QkMsSUFBSSxFQUFFLGdCQUFnQjtFQUN0QkMsT0FBTyxFQUFFWCxPQUFPO0VBQ2hCWSxTQUFTLEVBQUUsSUFBSTtFQUNmQyxRQUFRLEVBQUU7SUFDUkMsSUFBSSxFQUFFLENBQUM7SUFDUEMsT0FBTyxFQUFFLEVBQUU7SUFDWEMsY0FBYyxFQUFFLElBQUk7SUFDcEJDLGFBQWEsRUFBRSxVQUFVO0lBQ3pCQyxPQUFPLEVBQUUsQ0FDUDtNQUFFQyxLQUFLLEVBQUUsTUFBTTtNQUFFQyxLQUFLLEVBQUU7SUFBTyxDQUFDLEVBQ2hDO01BQUVELEtBQUssRUFBRSxPQUFPO01BQUVDLEtBQUssRUFBRTtJQUFRLENBQUMsRUFDbEM7TUFBRUQsS0FBSyxFQUFFLEtBQUs7TUFBRUMsS0FBSyxFQUFFO0lBQU0sQ0FBQyxDQUMvQjtJQUNEQyxxQkFBcUIsRUFBRSxDQUFDLE1BQU0sQ0FBQztJQUMvQkMsVUFBVSxFQUFFLEtBQUs7SUFDakJDLFFBQVEsRUFBRSxJQUFJO0lBQ2RDLFVBQVUsRUFBRSxLQUFLO0lBQ2pCQyxTQUFTLEVBQUUsSUFBSTtJQUNmQyxTQUFTLEVBQUUsT0FBTztJQUNsQkMsYUFBYSxFQUFFNUIsYUFBYSxDQUFDNkIsR0FBRztJQUNoQ0MsY0FBYyxFQUFFL0IsU0FBUyxDQUFDZ0MsSUFBSTtJQUM5QkMsVUFBVSxFQUFFLENBQUM7SUFDYkMsVUFBVSxFQUFFLGVBQWU7SUFDM0JDLE9BQU8sRUFBRTtFQUNYLENBQUM7RUFDREMsVUFBVSxFQUFFO0lBQ1ZDLE9BQU8sRUFBRWxDLE1BQU0sQ0FBQ21DLHVCQUF1QixDQUFDLENBQUM7SUFDekNDLE9BQU8sRUFBRXBDLE1BQU0sQ0FBQ3FDLHVCQUF1QixDQUFDLENBQUM7SUFDekNDLElBQUksRUFBRXRDLE1BQU0sQ0FBQ3VDLG9CQUFvQixDQUFDLENBQUM7SUFDbkNDLE1BQU0sRUFBRXhDLE1BQU0sQ0FBQ3lDLHFCQUFxQixDQUFDLENBQUM7SUFDdENDLGFBQWEsRUFBRTFDLE1BQU0sQ0FBQzJDLDRCQUE0QixDQUFDLENBQUM7SUFDcERDLFdBQVcsRUFBRTVDLE1BQU0sQ0FBQzZDLDBCQUEwQixDQUFDLENBQUM7SUFDaERDLGdCQUFnQixFQUFFOUMsTUFBTSxDQUFDK0MsbUJBQW1CLENBQUMsQ0FBQztJQUM5Q0MsdUJBQXVCLEVBQUVoRCxNQUFNLENBQUNpRCwwQkFBMEIsQ0FBQztFQUM3RCxDQUFDO0VBQ0RDLFVBQVUsRUFBRTtJQUNWdEMsUUFBUSxFQUFFO01BQ1JFLE9BQU8sRUFBRSxFQUFFO01BQ1hELElBQUksRUFBRTtJQUNSLENBQUM7SUFDRHNDLHFCQUFxQixFQUFFO01BQ3JCekIsYUFBYSxFQUFFNUIsYUFBYSxDQUFDNkI7SUFDL0IsQ0FBQztJQUNEeUIsYUFBYSxFQUFFO01BQ2JDLE1BQU0sRUFBRTtJQUNWLENBQUM7SUFDREMsVUFBVSxFQUFFLENBQ1Y7TUFDRUMsZ0JBQWdCLEVBQUUsQ0FBQztNQUNuQkMsYUFBYSxFQUFFQSxDQUFBLEtBQU07UUFBQTdELGNBQUEsR0FBQThELENBQUE7UUFBQTlELGNBQUEsR0FBQU8sQ0FBQTtRQUNuQixPQUFPO1VBQ0x3RCxRQUFRLEVBQUUsT0FBTztVQUNqQkMsU0FBUyxFQUFFO1FBQ2IsQ0FBQztNQUNIO0lBQ0YsQ0FBQyxDQUNGO0lBQ0RDLG9CQUFvQixFQUFFO01BQ3BCQyxRQUFRLEVBQUU7SUFDWjtFQUNGO0FBQ0YsQ0FBQztBQUVELGVBQWU3RCxNQUFNIn0=