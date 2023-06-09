function cov_1fqrhh5kvq() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/RadioGroupWidget/index.ts";
  var hash = "76156e674fe5affd0ded190f08875e833c085cf4";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/RadioGroupWidget/index.ts",
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
    hash: "76156e674fe5affd0ded190f08875e833c085cf4"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1fqrhh5kvq = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1fqrhh5kvq();
import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_1fqrhh5kvq().s[0]++, {
  type: Widget.getWidgetType(),
  name: "Radio Group",
  iconSVG: IconSVG,
  needsMeta: true,
  features: {
    dynamicHeight: {
      sectionIndex: 3,
      active: true
    }
  },
  searchTags: ["choice"],
  defaults: {
    rows: 6,
    columns: 20,
    animateLoading: true,
    label: "Label",
    labelPosition: LabelPosition.Top,
    labelAlignment: Alignment.LEFT,
    labelTextSize: "0.875rem",
    labelWidth: 5,
    options: [{
      label: "Yes",
      value: "Y"
    }, {
      label: "No",
      value: "N"
    }],
    defaultOptionValue: "Y",
    isRequired: false,
    isDisabled: false,
    isInline: true,
    alignment: Alignment.LEFT,
    widgetName: "RadioGroup",
    version: 1
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
        cov_1fqrhh5kvq().f[0]++;
        cov_1fqrhh5kvq().s[1]++;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMWZxcmhoNWt2cSIsImFjdHVhbENvdmVyYWdlIiwiQWxpZ25tZW50IiwiTGFiZWxQb3NpdGlvbiIsIkljb25TVkciLCJXaWRnZXQiLCJDT05GSUciLCJzIiwidHlwZSIsImdldFdpZGdldFR5cGUiLCJuYW1lIiwiaWNvblNWRyIsIm5lZWRzTWV0YSIsImZlYXR1cmVzIiwiZHluYW1pY0hlaWdodCIsInNlY3Rpb25JbmRleCIsImFjdGl2ZSIsInNlYXJjaFRhZ3MiLCJkZWZhdWx0cyIsInJvd3MiLCJjb2x1bW5zIiwiYW5pbWF0ZUxvYWRpbmciLCJsYWJlbCIsImxhYmVsUG9zaXRpb24iLCJUb3AiLCJsYWJlbEFsaWdubWVudCIsIkxFRlQiLCJsYWJlbFRleHRTaXplIiwibGFiZWxXaWR0aCIsIm9wdGlvbnMiLCJ2YWx1ZSIsImRlZmF1bHRPcHRpb25WYWx1ZSIsImlzUmVxdWlyZWQiLCJpc0Rpc2FibGVkIiwiaXNJbmxpbmUiLCJhbGlnbm1lbnQiLCJ3aWRnZXROYW1lIiwidmVyc2lvbiIsInByb3BlcnRpZXMiLCJkZXJpdmVkIiwiZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAiLCJkZWZhdWx0IiwiZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAiLCJtZXRhIiwiZ2V0TWV0YVByb3BlcnRpZXNNYXAiLCJjb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb25maWciLCJjb250ZW50Q29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lQ29udGVudENvbmZpZyIsInN0eWxlQ29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lU3R5bGVDb25maWciLCJzdHlsZXNoZWV0Q29uZmlnIiwiZ2V0U3R5bGVzaGVldENvbmZpZyIsImF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiLCJhdXRvTGF5b3V0IiwiZGlzYWJsZWRQcm9wc0RlZmF1bHRzIiwiYXV0b0RpbWVuc2lvbiIsImhlaWdodCIsIndpZGdldFNpemUiLCJ2aWV3cG9ydE1pbldpZHRoIiwiY29uZmlndXJhdGlvbiIsImYiLCJtaW5XaWR0aCIsIm1pbkhlaWdodCIsImRpc2FibGVSZXNpemVIYW5kbGVzIiwidmVydGljYWwiXSwic291cmNlcyI6WyJpbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBbGlnbm1lbnQgfSBmcm9tIFwiQGJsdWVwcmludGpzL2NvcmVcIjtcbmltcG9ydCB7IExhYmVsUG9zaXRpb24gfSBmcm9tIFwiY29tcG9uZW50cy9jb25zdGFudHNcIjtcblxuaW1wb3J0IEljb25TVkcgZnJvbSBcIi4vaWNvbi5zdmdcIjtcbmltcG9ydCBXaWRnZXQgZnJvbSBcIi4vd2lkZ2V0XCI7XG5cbmV4cG9ydCBjb25zdCBDT05GSUcgPSB7XG4gIHR5cGU6IFdpZGdldC5nZXRXaWRnZXRUeXBlKCksXG4gIG5hbWU6IFwiUmFkaW8gR3JvdXBcIixcbiAgaWNvblNWRzogSWNvblNWRyxcbiAgbmVlZHNNZXRhOiB0cnVlLFxuICBmZWF0dXJlczoge1xuICAgIGR5bmFtaWNIZWlnaHQ6IHtcbiAgICAgIHNlY3Rpb25JbmRleDogMyxcbiAgICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICB9LFxuICB9LFxuICBzZWFyY2hUYWdzOiBbXCJjaG9pY2VcIl0sXG4gIGRlZmF1bHRzOiB7XG4gICAgcm93czogNixcbiAgICBjb2x1bW5zOiAyMCxcbiAgICBhbmltYXRlTG9hZGluZzogdHJ1ZSxcbiAgICBsYWJlbDogXCJMYWJlbFwiLFxuICAgIGxhYmVsUG9zaXRpb246IExhYmVsUG9zaXRpb24uVG9wLFxuICAgIGxhYmVsQWxpZ25tZW50OiBBbGlnbm1lbnQuTEVGVCxcbiAgICBsYWJlbFRleHRTaXplOiBcIjAuODc1cmVtXCIsXG4gICAgbGFiZWxXaWR0aDogNSxcbiAgICBvcHRpb25zOiBbXG4gICAgICB7IGxhYmVsOiBcIlllc1wiLCB2YWx1ZTogXCJZXCIgfSxcbiAgICAgIHsgbGFiZWw6IFwiTm9cIiwgdmFsdWU6IFwiTlwiIH0sXG4gICAgXSxcbiAgICBkZWZhdWx0T3B0aW9uVmFsdWU6IFwiWVwiLFxuICAgIGlzUmVxdWlyZWQ6IGZhbHNlLFxuICAgIGlzRGlzYWJsZWQ6IGZhbHNlLFxuICAgIGlzSW5saW5lOiB0cnVlLFxuICAgIGFsaWdubWVudDogQWxpZ25tZW50LkxFRlQsXG4gICAgd2lkZ2V0TmFtZTogXCJSYWRpb0dyb3VwXCIsXG4gICAgdmVyc2lvbjogMSxcbiAgfSxcbiAgcHJvcGVydGllczoge1xuICAgIGRlcml2ZWQ6IFdpZGdldC5nZXREZXJpdmVkUHJvcGVydGllc01hcCgpLFxuICAgIGRlZmF1bHQ6IFdpZGdldC5nZXREZWZhdWx0UHJvcGVydGllc01hcCgpLFxuICAgIG1ldGE6IFdpZGdldC5nZXRNZXRhUHJvcGVydGllc01hcCgpLFxuICAgIGNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbmZpZygpLFxuICAgIGNvbnRlbnRDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnKCksXG4gICAgc3R5bGVDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVTdHlsZUNvbmZpZygpLFxuICAgIHN0eWxlc2hlZXRDb25maWc6IFdpZGdldC5nZXRTdHlsZXNoZWV0Q29uZmlnKCksXG4gICAgYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnM6IFdpZGdldC5nZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucygpLFxuICB9LFxuICBhdXRvTGF5b3V0OiB7XG4gICAgZGVmYXVsdHM6IHtcbiAgICAgIGNvbHVtbnM6IDE0LFxuICAgICAgcm93czogNyxcbiAgICB9LFxuICAgIGRpc2FibGVkUHJvcHNEZWZhdWx0czoge1xuICAgICAgbGFiZWxQb3NpdGlvbjogTGFiZWxQb3NpdGlvbi5Ub3AsXG4gICAgfSxcbiAgICBhdXRvRGltZW5zaW9uOiB7XG4gICAgICBoZWlnaHQ6IHRydWUsXG4gICAgfSxcbiAgICB3aWRnZXRTaXplOiBbXG4gICAgICB7XG4gICAgICAgIHZpZXdwb3J0TWluV2lkdGg6IDAsXG4gICAgICAgIGNvbmZpZ3VyYXRpb246ICgpID0+IHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWluV2lkdGg6IFwiMjQwcHhcIixcbiAgICAgICAgICAgIG1pbkhlaWdodDogXCI3MHB4XCIsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSxcbiAgICBkaXNhYmxlUmVzaXplSGFuZGxlczoge1xuICAgICAgdmVydGljYWw6IHRydWUsXG4gICAgfSxcbiAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFdpZGdldDtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGNBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGNBQUE7QUFmWixTQUFTRSxTQUFTLFFBQVEsbUJBQW1CO0FBQzdDLFNBQVNDLGFBQWEsUUFBUSxzQkFBc0I7QUFFcEQsT0FBT0MsT0FBTyxNQUFNLFlBQVk7QUFDaEMsT0FBT0MsTUFBTSxNQUFNLFVBQVU7QUFFN0IsT0FBTyxNQUFNQyxNQUFNLElBQUFOLGNBQUEsR0FBQU8sQ0FBQSxPQUFHO0VBQ3BCQyxJQUFJLEVBQUVILE1BQU0sQ0FBQ0ksYUFBYSxDQUFDLENBQUM7RUFDNUJDLElBQUksRUFBRSxhQUFhO0VBQ25CQyxPQUFPLEVBQUVQLE9BQU87RUFDaEJRLFNBQVMsRUFBRSxJQUFJO0VBQ2ZDLFFBQVEsRUFBRTtJQUNSQyxhQUFhLEVBQUU7TUFDYkMsWUFBWSxFQUFFLENBQUM7TUFDZkMsTUFBTSxFQUFFO0lBQ1Y7RUFDRixDQUFDO0VBQ0RDLFVBQVUsRUFBRSxDQUFDLFFBQVEsQ0FBQztFQUN0QkMsUUFBUSxFQUFFO0lBQ1JDLElBQUksRUFBRSxDQUFDO0lBQ1BDLE9BQU8sRUFBRSxFQUFFO0lBQ1hDLGNBQWMsRUFBRSxJQUFJO0lBQ3BCQyxLQUFLLEVBQUUsT0FBTztJQUNkQyxhQUFhLEVBQUVwQixhQUFhLENBQUNxQixHQUFHO0lBQ2hDQyxjQUFjLEVBQUV2QixTQUFTLENBQUN3QixJQUFJO0lBQzlCQyxhQUFhLEVBQUUsVUFBVTtJQUN6QkMsVUFBVSxFQUFFLENBQUM7SUFDYkMsT0FBTyxFQUFFLENBQ1A7TUFBRVAsS0FBSyxFQUFFLEtBQUs7TUFBRVEsS0FBSyxFQUFFO0lBQUksQ0FBQyxFQUM1QjtNQUFFUixLQUFLLEVBQUUsSUFBSTtNQUFFUSxLQUFLLEVBQUU7SUFBSSxDQUFDLENBQzVCO0lBQ0RDLGtCQUFrQixFQUFFLEdBQUc7SUFDdkJDLFVBQVUsRUFBRSxLQUFLO0lBQ2pCQyxVQUFVLEVBQUUsS0FBSztJQUNqQkMsUUFBUSxFQUFFLElBQUk7SUFDZEMsU0FBUyxFQUFFakMsU0FBUyxDQUFDd0IsSUFBSTtJQUN6QlUsVUFBVSxFQUFFLFlBQVk7SUFDeEJDLE9BQU8sRUFBRTtFQUNYLENBQUM7RUFDREMsVUFBVSxFQUFFO0lBQ1ZDLE9BQU8sRUFBRWxDLE1BQU0sQ0FBQ21DLHVCQUF1QixDQUFDLENBQUM7SUFDekNDLE9BQU8sRUFBRXBDLE1BQU0sQ0FBQ3FDLHVCQUF1QixDQUFDLENBQUM7SUFDekNDLElBQUksRUFBRXRDLE1BQU0sQ0FBQ3VDLG9CQUFvQixDQUFDLENBQUM7SUFDbkNDLE1BQU0sRUFBRXhDLE1BQU0sQ0FBQ3lDLHFCQUFxQixDQUFDLENBQUM7SUFDdENDLGFBQWEsRUFBRTFDLE1BQU0sQ0FBQzJDLDRCQUE0QixDQUFDLENBQUM7SUFDcERDLFdBQVcsRUFBRTVDLE1BQU0sQ0FBQzZDLDBCQUEwQixDQUFDLENBQUM7SUFDaERDLGdCQUFnQixFQUFFOUMsTUFBTSxDQUFDK0MsbUJBQW1CLENBQUMsQ0FBQztJQUM5Q0MsdUJBQXVCLEVBQUVoRCxNQUFNLENBQUNpRCwwQkFBMEIsQ0FBQztFQUM3RCxDQUFDO0VBQ0RDLFVBQVUsRUFBRTtJQUNWckMsUUFBUSxFQUFFO01BQ1JFLE9BQU8sRUFBRSxFQUFFO01BQ1hELElBQUksRUFBRTtJQUNSLENBQUM7SUFDRHFDLHFCQUFxQixFQUFFO01BQ3JCakMsYUFBYSxFQUFFcEIsYUFBYSxDQUFDcUI7SUFDL0IsQ0FBQztJQUNEaUMsYUFBYSxFQUFFO01BQ2JDLE1BQU0sRUFBRTtJQUNWLENBQUM7SUFDREMsVUFBVSxFQUFFLENBQ1Y7TUFDRUMsZ0JBQWdCLEVBQUUsQ0FBQztNQUNuQkMsYUFBYSxFQUFFQSxDQUFBLEtBQU07UUFBQTdELGNBQUEsR0FBQThELENBQUE7UUFBQTlELGNBQUEsR0FBQU8sQ0FBQTtRQUNuQixPQUFPO1VBQ0x3RCxRQUFRLEVBQUUsT0FBTztVQUNqQkMsU0FBUyxFQUFFO1FBQ2IsQ0FBQztNQUNIO0lBQ0YsQ0FBQyxDQUNGO0lBQ0RDLG9CQUFvQixFQUFFO01BQ3BCQyxRQUFRLEVBQUU7SUFDWjtFQUNGO0FBQ0YsQ0FBQztBQUVELGVBQWU3RCxNQUFNIn0=