function cov_lkv9yyp01() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/DatePickerWidget2/index.ts";
  var hash = "1ee3a531b0ba045b1243f78c4f5c6830b4a686cc";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/DatePickerWidget2/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 12,
          column: 22
        },
        end: {
          line: 85,
          column: 1
        }
      },
      "1": {
        start: {
          line: 75,
          column: 10
        },
        end: {
          line: 77,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 74,
            column: 23
          },
          end: {
            line: 74,
            column: 24
          }
        },
        loc: {
          start: {
            line: 74,
            column: 29
          },
          end: {
            line: 78,
            column: 9
          }
        },
        line: 74
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
    hash: "1ee3a531b0ba045b1243f78c4f5c6830b4a686cc"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_lkv9yyp01 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_lkv9yyp01();
import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import moment from "moment";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { DynamicHeight } from "utils/WidgetFeatures";
import { TimePrecision } from "./constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_lkv9yyp01().s[0]++, {
  features: {
    dynamicHeight: {
      sectionIndex: 3,
      defaultValue: DynamicHeight.FIXED,
      active: true
    }
  },
  type: Widget.getWidgetType(),
  name: "DatePicker",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["calendar"],
  defaults: {
    isDisabled: false,
    datePickerType: "DATE_PICKER",
    rows: 7,
    label: "Label",
    labelPosition: LabelPosition.Top,
    labelAlignment: Alignment.LEFT,
    labelWidth: 5,
    labelTextSize: "0.875rem",
    dateFormat: "YYYY-MM-DD HH:mm",
    columns: 20,
    widgetName: "DatePicker",
    defaultDate: moment().toISOString(),
    minDate: "1920-12-31T18:30:00.000Z",
    maxDate: "2121-12-31T18:29:00.000Z",
    version: 2,
    isRequired: false,
    closeOnSelection: true,
    shortcuts: false,
    firstDayOfWeek: 0,
    timePrecision: TimePrecision.MINUTE,
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
        cov_lkv9yyp01().f[0]++;
        cov_lkv9yyp01().s[1]++;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfbGt2OXl5cDAxIiwiYWN0dWFsQ292ZXJhZ2UiLCJBbGlnbm1lbnQiLCJMYWJlbFBvc2l0aW9uIiwiRklMTF9XSURHRVRfTUlOX1dJRFRIIiwibW9tZW50IiwiUmVzcG9uc2l2ZUJlaGF2aW9yIiwiRHluYW1pY0hlaWdodCIsIlRpbWVQcmVjaXNpb24iLCJJY29uU1ZHIiwiV2lkZ2V0IiwiQ09ORklHIiwicyIsImZlYXR1cmVzIiwiZHluYW1pY0hlaWdodCIsInNlY3Rpb25JbmRleCIsImRlZmF1bHRWYWx1ZSIsIkZJWEVEIiwiYWN0aXZlIiwidHlwZSIsImdldFdpZGdldFR5cGUiLCJuYW1lIiwiaWNvblNWRyIsIm5lZWRzTWV0YSIsInNlYXJjaFRhZ3MiLCJkZWZhdWx0cyIsImlzRGlzYWJsZWQiLCJkYXRlUGlja2VyVHlwZSIsInJvd3MiLCJsYWJlbCIsImxhYmVsUG9zaXRpb24iLCJUb3AiLCJsYWJlbEFsaWdubWVudCIsIkxFRlQiLCJsYWJlbFdpZHRoIiwibGFiZWxUZXh0U2l6ZSIsImRhdGVGb3JtYXQiLCJjb2x1bW5zIiwid2lkZ2V0TmFtZSIsImRlZmF1bHREYXRlIiwidG9JU09TdHJpbmciLCJtaW5EYXRlIiwibWF4RGF0ZSIsInZlcnNpb24iLCJpc1JlcXVpcmVkIiwiY2xvc2VPblNlbGVjdGlvbiIsInNob3J0Y3V0cyIsImZpcnN0RGF5T2ZXZWVrIiwidGltZVByZWNpc2lvbiIsIk1JTlVURSIsImFuaW1hdGVMb2FkaW5nIiwicmVzcG9uc2l2ZUJlaGF2aW9yIiwiRmlsbCIsIm1pbldpZHRoIiwicHJvcGVydGllcyIsImRlcml2ZWQiLCJnZXREZXJpdmVkUHJvcGVydGllc01hcCIsImRlZmF1bHQiLCJnZXREZWZhdWx0UHJvcGVydGllc01hcCIsIm1ldGEiLCJnZXRNZXRhUHJvcGVydGllc01hcCIsImNvbmZpZyIsImdldFByb3BlcnR5UGFuZUNvbmZpZyIsImNvbnRlbnRDb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnIiwic3R5bGVDb25maWciLCJnZXRQcm9wZXJ0eVBhbmVTdHlsZUNvbmZpZyIsInN0eWxlc2hlZXRDb25maWciLCJnZXRTdHlsZXNoZWV0Q29uZmlnIiwiYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiLCJnZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucyIsImF1dG9MYXlvdXQiLCJkaXNhYmxlZFByb3BzRGVmYXVsdHMiLCJhdXRvRGltZW5zaW9uIiwiaGVpZ2h0Iiwid2lkZ2V0U2l6ZSIsInZpZXdwb3J0TWluV2lkdGgiLCJjb25maWd1cmF0aW9uIiwiZiIsImRpc2FibGVSZXNpemVIYW5kbGVzIiwidmVydGljYWwiXSwic291cmNlcyI6WyJpbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBbGlnbm1lbnQgfSBmcm9tIFwiQGJsdWVwcmludGpzL2NvcmVcIjtcbmltcG9ydCB7IExhYmVsUG9zaXRpb24gfSBmcm9tIFwiY29tcG9uZW50cy9jb25zdGFudHNcIjtcbmltcG9ydCB7IEZJTExfV0lER0VUX01JTl9XSURUSCB9IGZyb20gXCJjb25zdGFudHMvbWluV2lkdGhDb25zdGFudHNcIjtcbmltcG9ydCBtb21lbnQgZnJvbSBcIm1vbWVudFwiO1xuaW1wb3J0IHsgUmVzcG9uc2l2ZUJlaGF2aW9yIH0gZnJvbSBcInV0aWxzL2F1dG9MYXlvdXQvY29uc3RhbnRzXCI7XG5pbXBvcnQgeyBEeW5hbWljSGVpZ2h0IH0gZnJvbSBcInV0aWxzL1dpZGdldEZlYXR1cmVzXCI7XG5cbmltcG9ydCB7IFRpbWVQcmVjaXNpb24gfSBmcm9tIFwiLi9jb25zdGFudHNcIjtcbmltcG9ydCBJY29uU1ZHIGZyb20gXCIuL2ljb24uc3ZnXCI7XG5pbXBvcnQgV2lkZ2V0IGZyb20gXCIuL3dpZGdldFwiO1xuXG5leHBvcnQgY29uc3QgQ09ORklHID0ge1xuICBmZWF0dXJlczoge1xuICAgIGR5bmFtaWNIZWlnaHQ6IHtcbiAgICAgIHNlY3Rpb25JbmRleDogMyxcbiAgICAgIGRlZmF1bHRWYWx1ZTogRHluYW1pY0hlaWdodC5GSVhFRCxcbiAgICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICB9LFxuICB9LFxuICB0eXBlOiBXaWRnZXQuZ2V0V2lkZ2V0VHlwZSgpLFxuICBuYW1lOiBcIkRhdGVQaWNrZXJcIixcbiAgaWNvblNWRzogSWNvblNWRyxcbiAgbmVlZHNNZXRhOiB0cnVlLFxuICBzZWFyY2hUYWdzOiBbXCJjYWxlbmRhclwiXSxcbiAgZGVmYXVsdHM6IHtcbiAgICBpc0Rpc2FibGVkOiBmYWxzZSxcbiAgICBkYXRlUGlja2VyVHlwZTogXCJEQVRFX1BJQ0tFUlwiLFxuICAgIHJvd3M6IDcsXG4gICAgbGFiZWw6IFwiTGFiZWxcIixcbiAgICBsYWJlbFBvc2l0aW9uOiBMYWJlbFBvc2l0aW9uLlRvcCxcbiAgICBsYWJlbEFsaWdubWVudDogQWxpZ25tZW50LkxFRlQsXG4gICAgbGFiZWxXaWR0aDogNSxcbiAgICBsYWJlbFRleHRTaXplOiBcIjAuODc1cmVtXCIsXG4gICAgZGF0ZUZvcm1hdDogXCJZWVlZLU1NLUREIEhIOm1tXCIsXG4gICAgY29sdW1uczogMjAsXG4gICAgd2lkZ2V0TmFtZTogXCJEYXRlUGlja2VyXCIsXG4gICAgZGVmYXVsdERhdGU6IG1vbWVudCgpLnRvSVNPU3RyaW5nKCksXG4gICAgbWluRGF0ZTogXCIxOTIwLTEyLTMxVDE4OjMwOjAwLjAwMFpcIixcbiAgICBtYXhEYXRlOiBcIjIxMjEtMTItMzFUMTg6Mjk6MDAuMDAwWlwiLFxuICAgIHZlcnNpb246IDIsXG4gICAgaXNSZXF1aXJlZDogZmFsc2UsXG4gICAgY2xvc2VPblNlbGVjdGlvbjogdHJ1ZSxcbiAgICBzaG9ydGN1dHM6IGZhbHNlLFxuICAgIGZpcnN0RGF5T2ZXZWVrOiAwLFxuICAgIHRpbWVQcmVjaXNpb246IFRpbWVQcmVjaXNpb24uTUlOVVRFLFxuICAgIGFuaW1hdGVMb2FkaW5nOiB0cnVlLFxuICAgIHJlc3BvbnNpdmVCZWhhdmlvcjogUmVzcG9uc2l2ZUJlaGF2aW9yLkZpbGwsXG4gICAgbWluV2lkdGg6IEZJTExfV0lER0VUX01JTl9XSURUSCxcbiAgfSxcbiAgcHJvcGVydGllczoge1xuICAgIGRlcml2ZWQ6IFdpZGdldC5nZXREZXJpdmVkUHJvcGVydGllc01hcCgpLFxuICAgIGRlZmF1bHQ6IFdpZGdldC5nZXREZWZhdWx0UHJvcGVydGllc01hcCgpLFxuICAgIG1ldGE6IFdpZGdldC5nZXRNZXRhUHJvcGVydGllc01hcCgpLFxuICAgIGNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbmZpZygpLFxuICAgIGNvbnRlbnRDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnKCksXG4gICAgc3R5bGVDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVTdHlsZUNvbmZpZygpLFxuICAgIHN0eWxlc2hlZXRDb25maWc6IFdpZGdldC5nZXRTdHlsZXNoZWV0Q29uZmlnKCksXG4gICAgYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnM6IFdpZGdldC5nZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucygpLFxuICB9LFxuICBhdXRvTGF5b3V0OiB7XG4gICAgZGlzYWJsZWRQcm9wc0RlZmF1bHRzOiB7XG4gICAgICBsYWJlbFBvc2l0aW9uOiBMYWJlbFBvc2l0aW9uLlRvcCxcbiAgICAgIGxhYmVsVGV4dFNpemU6IFwiMC44NzVyZW1cIixcbiAgICB9LFxuICAgIGRlZmF1bHRzOiB7XG4gICAgICByb3dzOiA2LjYsXG4gICAgfSxcbiAgICBhdXRvRGltZW5zaW9uOiB7XG4gICAgICBoZWlnaHQ6IHRydWUsXG4gICAgfSxcbiAgICB3aWRnZXRTaXplOiBbXG4gICAgICB7XG4gICAgICAgIHZpZXdwb3J0TWluV2lkdGg6IDAsXG4gICAgICAgIGNvbmZpZ3VyYXRpb246ICgpID0+IHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWluV2lkdGg6IFwiMTIwcHhcIixcbiAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdLFxuICAgIGRpc2FibGVSZXNpemVIYW5kbGVzOiB7XG4gICAgICB2ZXJ0aWNhbDogdHJ1ZSxcbiAgICB9LFxuICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgV2lkZ2V0O1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsYUFBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsYUFBQTtBQWZaLFNBQVNFLFNBQVMsUUFBUSxtQkFBbUI7QUFDN0MsU0FBU0MsYUFBYSxRQUFRLHNCQUFzQjtBQUNwRCxTQUFTQyxxQkFBcUIsUUFBUSw2QkFBNkI7QUFDbkUsT0FBT0MsTUFBTSxNQUFNLFFBQVE7QUFDM0IsU0FBU0Msa0JBQWtCLFFBQVEsNEJBQTRCO0FBQy9ELFNBQVNDLGFBQWEsUUFBUSxzQkFBc0I7QUFFcEQsU0FBU0MsYUFBYSxRQUFRLGFBQWE7QUFDM0MsT0FBT0MsT0FBTyxNQUFNLFlBQVk7QUFDaEMsT0FBT0MsTUFBTSxNQUFNLFVBQVU7QUFFN0IsT0FBTyxNQUFNQyxNQUFNLElBQUFYLGFBQUEsR0FBQVksQ0FBQSxPQUFHO0VBQ3BCQyxRQUFRLEVBQUU7SUFDUkMsYUFBYSxFQUFFO01BQ2JDLFlBQVksRUFBRSxDQUFDO01BQ2ZDLFlBQVksRUFBRVQsYUFBYSxDQUFDVSxLQUFLO01BQ2pDQyxNQUFNLEVBQUU7SUFDVjtFQUNGLENBQUM7RUFDREMsSUFBSSxFQUFFVCxNQUFNLENBQUNVLGFBQWEsQ0FBQyxDQUFDO0VBQzVCQyxJQUFJLEVBQUUsWUFBWTtFQUNsQkMsT0FBTyxFQUFFYixPQUFPO0VBQ2hCYyxTQUFTLEVBQUUsSUFBSTtFQUNmQyxVQUFVLEVBQUUsQ0FBQyxVQUFVLENBQUM7RUFDeEJDLFFBQVEsRUFBRTtJQUNSQyxVQUFVLEVBQUUsS0FBSztJQUNqQkMsY0FBYyxFQUFFLGFBQWE7SUFDN0JDLElBQUksRUFBRSxDQUFDO0lBQ1BDLEtBQUssRUFBRSxPQUFPO0lBQ2RDLGFBQWEsRUFBRTNCLGFBQWEsQ0FBQzRCLEdBQUc7SUFDaENDLGNBQWMsRUFBRTlCLFNBQVMsQ0FBQytCLElBQUk7SUFDOUJDLFVBQVUsRUFBRSxDQUFDO0lBQ2JDLGFBQWEsRUFBRSxVQUFVO0lBQ3pCQyxVQUFVLEVBQUUsa0JBQWtCO0lBQzlCQyxPQUFPLEVBQUUsRUFBRTtJQUNYQyxVQUFVLEVBQUUsWUFBWTtJQUN4QkMsV0FBVyxFQUFFbEMsTUFBTSxDQUFDLENBQUMsQ0FBQ21DLFdBQVcsQ0FBQyxDQUFDO0lBQ25DQyxPQUFPLEVBQUUsMEJBQTBCO0lBQ25DQyxPQUFPLEVBQUUsMEJBQTBCO0lBQ25DQyxPQUFPLEVBQUUsQ0FBQztJQUNWQyxVQUFVLEVBQUUsS0FBSztJQUNqQkMsZ0JBQWdCLEVBQUUsSUFBSTtJQUN0QkMsU0FBUyxFQUFFLEtBQUs7SUFDaEJDLGNBQWMsRUFBRSxDQUFDO0lBQ2pCQyxhQUFhLEVBQUV4QyxhQUFhLENBQUN5QyxNQUFNO0lBQ25DQyxjQUFjLEVBQUUsSUFBSTtJQUNwQkMsa0JBQWtCLEVBQUU3QyxrQkFBa0IsQ0FBQzhDLElBQUk7SUFDM0NDLFFBQVEsRUFBRWpEO0VBQ1osQ0FBQztFQUNEa0QsVUFBVSxFQUFFO0lBQ1ZDLE9BQU8sRUFBRTdDLE1BQU0sQ0FBQzhDLHVCQUF1QixDQUFDLENBQUM7SUFDekNDLE9BQU8sRUFBRS9DLE1BQU0sQ0FBQ2dELHVCQUF1QixDQUFDLENBQUM7SUFDekNDLElBQUksRUFBRWpELE1BQU0sQ0FBQ2tELG9CQUFvQixDQUFDLENBQUM7SUFDbkNDLE1BQU0sRUFBRW5ELE1BQU0sQ0FBQ29ELHFCQUFxQixDQUFDLENBQUM7SUFDdENDLGFBQWEsRUFBRXJELE1BQU0sQ0FBQ3NELDRCQUE0QixDQUFDLENBQUM7SUFDcERDLFdBQVcsRUFBRXZELE1BQU0sQ0FBQ3dELDBCQUEwQixDQUFDLENBQUM7SUFDaERDLGdCQUFnQixFQUFFekQsTUFBTSxDQUFDMEQsbUJBQW1CLENBQUMsQ0FBQztJQUM5Q0MsdUJBQXVCLEVBQUUzRCxNQUFNLENBQUM0RCwwQkFBMEIsQ0FBQztFQUM3RCxDQUFDO0VBQ0RDLFVBQVUsRUFBRTtJQUNWQyxxQkFBcUIsRUFBRTtNQUNyQjFDLGFBQWEsRUFBRTNCLGFBQWEsQ0FBQzRCLEdBQUc7TUFDaENJLGFBQWEsRUFBRTtJQUNqQixDQUFDO0lBQ0RWLFFBQVEsRUFBRTtNQUNSRyxJQUFJLEVBQUU7SUFDUixDQUFDO0lBQ0Q2QyxhQUFhLEVBQUU7TUFDYkMsTUFBTSxFQUFFO0lBQ1YsQ0FBQztJQUNEQyxVQUFVLEVBQUUsQ0FDVjtNQUNFQyxnQkFBZ0IsRUFBRSxDQUFDO01BQ25CQyxhQUFhLEVBQUVBLENBQUEsS0FBTTtRQUFBN0UsYUFBQSxHQUFBOEUsQ0FBQTtRQUFBOUUsYUFBQSxHQUFBWSxDQUFBO1FBQ25CLE9BQU87VUFDTHlDLFFBQVEsRUFBRTtRQUNaLENBQUM7TUFDSDtJQUNGLENBQUMsQ0FDRjtJQUNEMEIsb0JBQW9CLEVBQUU7TUFDcEJDLFFBQVEsRUFBRTtJQUNaO0VBQ0Y7QUFDRixDQUFDO0FBRUQsZUFBZXRFLE1BQU0ifQ==