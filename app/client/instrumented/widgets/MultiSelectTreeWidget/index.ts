function cov_7eormk0n7() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/MultiSelectTreeWidget/index.ts";
  var hash = "f9b4eab08e3b363f0e8010f299910294dcf02fa2";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/MultiSelectTreeWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 10,
          column: 22
        },
        end: {
          line: 99,
          column: 1
        }
      },
      "1": {
        start: {
          line: 89,
          column: 10
        },
        end: {
          line: 91,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 88,
            column: 23
          },
          end: {
            line: 88,
            column: 24
          }
        },
        loc: {
          start: {
            line: 88,
            column: 29
          },
          end: {
            line: 92,
            column: 9
          }
        },
        line: 88
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
    hash: "f9b4eab08e3b363f0e8010f299910294dcf02fa2"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_7eormk0n7 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_7eormk0n7();
import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { DynamicHeight } from "utils/WidgetFeatures";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_7eormk0n7().s[0]++, {
  features: {
    dynamicHeight: {
      sectionIndex: 3,
      defaultValue: DynamicHeight.FIXED,
      active: true
    }
  },
  type: Widget.getWidgetType(),
  name: "Multi TreeSelect",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["dropdown"],
  defaults: {
    rows: 7,
    columns: 20,
    mode: "SHOW_ALL",
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
    widgetName: "MultiTreeSelect",
    defaultOptionValue: ["GREEN"],
    version: 1,
    isVisible: true,
    isRequired: false,
    isDisabled: false,
    allowClear: false,
    expandAll: false,
    placeholderText: "Select option(s)",
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
        cov_7eormk0n7().f[0]++;
        cov_7eormk0n7().s[1]++;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfN2Vvcm1rMG43IiwiYWN0dWFsQ292ZXJhZ2UiLCJBbGlnbm1lbnQiLCJMYWJlbFBvc2l0aW9uIiwiRklMTF9XSURHRVRfTUlOX1dJRFRIIiwiUmVzcG9uc2l2ZUJlaGF2aW9yIiwiRHluYW1pY0hlaWdodCIsIkljb25TVkciLCJXaWRnZXQiLCJDT05GSUciLCJzIiwiZmVhdHVyZXMiLCJkeW5hbWljSGVpZ2h0Iiwic2VjdGlvbkluZGV4IiwiZGVmYXVsdFZhbHVlIiwiRklYRUQiLCJhY3RpdmUiLCJ0eXBlIiwiZ2V0V2lkZ2V0VHlwZSIsIm5hbWUiLCJpY29uU1ZHIiwibmVlZHNNZXRhIiwic2VhcmNoVGFncyIsImRlZmF1bHRzIiwicm93cyIsImNvbHVtbnMiLCJtb2RlIiwiYW5pbWF0ZUxvYWRpbmciLCJvcHRpb25zIiwibGFiZWwiLCJ2YWx1ZSIsImNoaWxkcmVuIiwid2lkZ2V0TmFtZSIsImRlZmF1bHRPcHRpb25WYWx1ZSIsInZlcnNpb24iLCJpc1Zpc2libGUiLCJpc1JlcXVpcmVkIiwiaXNEaXNhYmxlZCIsImFsbG93Q2xlYXIiLCJleHBhbmRBbGwiLCJwbGFjZWhvbGRlclRleHQiLCJsYWJlbFRleHQiLCJsYWJlbFBvc2l0aW9uIiwiVG9wIiwibGFiZWxBbGlnbm1lbnQiLCJMRUZUIiwibGFiZWxXaWR0aCIsImxhYmVsVGV4dFNpemUiLCJyZXNwb25zaXZlQmVoYXZpb3IiLCJGaWxsIiwibWluV2lkdGgiLCJwcm9wZXJ0aWVzIiwiZGVyaXZlZCIsImdldERlcml2ZWRQcm9wZXJ0aWVzTWFwIiwiZGVmYXVsdCIsImdldERlZmF1bHRQcm9wZXJ0aWVzTWFwIiwibWV0YSIsImdldE1ldGFQcm9wZXJ0aWVzTWFwIiwiY29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lQ29uZmlnIiwiY29udGVudENvbmZpZyIsImdldFByb3BlcnR5UGFuZUNvbnRlbnRDb25maWciLCJzdHlsZUNvbmZpZyIsImdldFByb3BlcnR5UGFuZVN0eWxlQ29uZmlnIiwic3R5bGVzaGVldENvbmZpZyIsImdldFN0eWxlc2hlZXRDb25maWciLCJhdXRvY29tcGxldGVEZWZpbml0aW9ucyIsImdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiYXV0b0xheW91dCIsImRpc2FibGVkUHJvcHNEZWZhdWx0cyIsImF1dG9EaW1lbnNpb24iLCJoZWlnaHQiLCJ3aWRnZXRTaXplIiwidmlld3BvcnRNaW5XaWR0aCIsImNvbmZpZ3VyYXRpb24iLCJmIiwiZGlzYWJsZVJlc2l6ZUhhbmRsZXMiLCJ2ZXJ0aWNhbCJdLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFsaWdubWVudCB9IGZyb20gXCJAYmx1ZXByaW50anMvY29yZVwiO1xuaW1wb3J0IHsgTGFiZWxQb3NpdGlvbiB9IGZyb20gXCJjb21wb25lbnRzL2NvbnN0YW50c1wiO1xuaW1wb3J0IHsgRklMTF9XSURHRVRfTUlOX1dJRFRIIH0gZnJvbSBcImNvbnN0YW50cy9taW5XaWR0aENvbnN0YW50c1wiO1xuaW1wb3J0IHsgUmVzcG9uc2l2ZUJlaGF2aW9yIH0gZnJvbSBcInV0aWxzL2F1dG9MYXlvdXQvY29uc3RhbnRzXCI7XG5pbXBvcnQgeyBEeW5hbWljSGVpZ2h0IH0gZnJvbSBcInV0aWxzL1dpZGdldEZlYXR1cmVzXCI7XG5cbmltcG9ydCBJY29uU1ZHIGZyb20gXCIuL2ljb24uc3ZnXCI7XG5pbXBvcnQgV2lkZ2V0IGZyb20gXCIuL3dpZGdldFwiO1xuXG5leHBvcnQgY29uc3QgQ09ORklHID0ge1xuICBmZWF0dXJlczoge1xuICAgIGR5bmFtaWNIZWlnaHQ6IHtcbiAgICAgIHNlY3Rpb25JbmRleDogMyxcbiAgICAgIGRlZmF1bHRWYWx1ZTogRHluYW1pY0hlaWdodC5GSVhFRCxcbiAgICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICB9LFxuICB9LFxuICB0eXBlOiBXaWRnZXQuZ2V0V2lkZ2V0VHlwZSgpLFxuICBuYW1lOiBcIk11bHRpIFRyZWVTZWxlY3RcIixcbiAgaWNvblNWRzogSWNvblNWRyxcbiAgbmVlZHNNZXRhOiB0cnVlLFxuICBzZWFyY2hUYWdzOiBbXCJkcm9wZG93blwiXSxcbiAgZGVmYXVsdHM6IHtcbiAgICByb3dzOiA3LFxuICAgIGNvbHVtbnM6IDIwLFxuICAgIG1vZGU6IFwiU0hPV19BTExcIixcbiAgICBhbmltYXRlTG9hZGluZzogdHJ1ZSxcbiAgICBvcHRpb25zOiBbXG4gICAgICB7XG4gICAgICAgIGxhYmVsOiBcIkJsdWVcIixcbiAgICAgICAgdmFsdWU6IFwiQkxVRVwiLFxuICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiBcIkRhcmsgQmx1ZVwiLFxuICAgICAgICAgICAgdmFsdWU6IFwiREFSSyBCTFVFXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogXCJMaWdodCBCbHVlXCIsXG4gICAgICAgICAgICB2YWx1ZTogXCJMSUdIVCBCTFVFXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICB7IGxhYmVsOiBcIkdyZWVuXCIsIHZhbHVlOiBcIkdSRUVOXCIgfSxcbiAgICAgIHsgbGFiZWw6IFwiUmVkXCIsIHZhbHVlOiBcIlJFRFwiIH0sXG4gICAgXSxcbiAgICB3aWRnZXROYW1lOiBcIk11bHRpVHJlZVNlbGVjdFwiLFxuICAgIGRlZmF1bHRPcHRpb25WYWx1ZTogW1wiR1JFRU5cIl0sXG4gICAgdmVyc2lvbjogMSxcbiAgICBpc1Zpc2libGU6IHRydWUsXG4gICAgaXNSZXF1aXJlZDogZmFsc2UsXG4gICAgaXNEaXNhYmxlZDogZmFsc2UsXG4gICAgYWxsb3dDbGVhcjogZmFsc2UsXG4gICAgZXhwYW5kQWxsOiBmYWxzZSxcbiAgICBwbGFjZWhvbGRlclRleHQ6IFwiU2VsZWN0IG9wdGlvbihzKVwiLFxuICAgIGxhYmVsVGV4dDogXCJMYWJlbFwiLFxuICAgIGxhYmVsUG9zaXRpb246IExhYmVsUG9zaXRpb24uVG9wLFxuICAgIGxhYmVsQWxpZ25tZW50OiBBbGlnbm1lbnQuTEVGVCxcbiAgICBsYWJlbFdpZHRoOiA1LFxuICAgIGxhYmVsVGV4dFNpemU6IFwiMC44NzVyZW1cIixcbiAgICByZXNwb25zaXZlQmVoYXZpb3I6IFJlc3BvbnNpdmVCZWhhdmlvci5GaWxsLFxuICAgIG1pbldpZHRoOiBGSUxMX1dJREdFVF9NSU5fV0lEVEgsXG4gIH0sXG5cbiAgcHJvcGVydGllczoge1xuICAgIGRlcml2ZWQ6IFdpZGdldC5nZXREZXJpdmVkUHJvcGVydGllc01hcCgpLFxuICAgIGRlZmF1bHQ6IFdpZGdldC5nZXREZWZhdWx0UHJvcGVydGllc01hcCgpLFxuICAgIG1ldGE6IFdpZGdldC5nZXRNZXRhUHJvcGVydGllc01hcCgpLFxuICAgIGNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbmZpZygpLFxuICAgIGNvbnRlbnRDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnKCksXG4gICAgc3R5bGVDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVTdHlsZUNvbmZpZygpLFxuICAgIHN0eWxlc2hlZXRDb25maWc6IFdpZGdldC5nZXRTdHlsZXNoZWV0Q29uZmlnKCksXG4gICAgYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnM6IFdpZGdldC5nZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucygpLFxuICB9LFxuICBhdXRvTGF5b3V0OiB7XG4gICAgZGlzYWJsZWRQcm9wc0RlZmF1bHRzOiB7XG4gICAgICBsYWJlbFBvc2l0aW9uOiBMYWJlbFBvc2l0aW9uLlRvcCxcbiAgICAgIGxhYmVsVGV4dFNpemU6IFwiMC44NzVyZW1cIixcbiAgICB9LFxuICAgIGRlZmF1bHRzOiB7XG4gICAgICByb3dzOiA2LjYsXG4gICAgfSxcbiAgICBhdXRvRGltZW5zaW9uOiB7XG4gICAgICBoZWlnaHQ6IHRydWUsXG4gICAgfSxcbiAgICB3aWRnZXRTaXplOiBbXG4gICAgICB7XG4gICAgICAgIHZpZXdwb3J0TWluV2lkdGg6IDAsXG4gICAgICAgIGNvbmZpZ3VyYXRpb246ICgpID0+IHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWluV2lkdGg6IFwiMTYwcHhcIixcbiAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdLFxuICAgIGRpc2FibGVSZXNpemVIYW5kbGVzOiB7XG4gICAgICB2ZXJ0aWNhbDogdHJ1ZSxcbiAgICB9LFxuICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgV2lkZ2V0O1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsYUFBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsYUFBQTtBQWZaLFNBQVNFLFNBQVMsUUFBUSxtQkFBbUI7QUFDN0MsU0FBU0MsYUFBYSxRQUFRLHNCQUFzQjtBQUNwRCxTQUFTQyxxQkFBcUIsUUFBUSw2QkFBNkI7QUFDbkUsU0FBU0Msa0JBQWtCLFFBQVEsNEJBQTRCO0FBQy9ELFNBQVNDLGFBQWEsUUFBUSxzQkFBc0I7QUFFcEQsT0FBT0MsT0FBTyxNQUFNLFlBQVk7QUFDaEMsT0FBT0MsTUFBTSxNQUFNLFVBQVU7QUFFN0IsT0FBTyxNQUFNQyxNQUFNLElBQUFULGFBQUEsR0FBQVUsQ0FBQSxPQUFHO0VBQ3BCQyxRQUFRLEVBQUU7SUFDUkMsYUFBYSxFQUFFO01BQ2JDLFlBQVksRUFBRSxDQUFDO01BQ2ZDLFlBQVksRUFBRVIsYUFBYSxDQUFDUyxLQUFLO01BQ2pDQyxNQUFNLEVBQUU7SUFDVjtFQUNGLENBQUM7RUFDREMsSUFBSSxFQUFFVCxNQUFNLENBQUNVLGFBQWEsQ0FBQyxDQUFDO0VBQzVCQyxJQUFJLEVBQUUsa0JBQWtCO0VBQ3hCQyxPQUFPLEVBQUViLE9BQU87RUFDaEJjLFNBQVMsRUFBRSxJQUFJO0VBQ2ZDLFVBQVUsRUFBRSxD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