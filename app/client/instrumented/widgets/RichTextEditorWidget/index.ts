function cov_t7gn45530() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/RichTextEditorWidget/index.ts";
  var hash = "caa5a32137943bd92e2cdc4b96ca909c21f75644";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/RichTextEditorWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 10,
          column: 22
        },
        end: {
          line: 65,
          column: 1
        }
      },
      "1": {
        start: {
          line: 57,
          column: 10
        },
        end: {
          line: 60,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 56,
            column: 23
          },
          end: {
            line: 56,
            column: 24
          }
        },
        loc: {
          start: {
            line: 56,
            column: 29
          },
          end: {
            line: 61,
            column: 9
          }
        },
        line: 56
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
    hash: "caa5a32137943bd92e2cdc4b96ca909c21f75644"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_t7gn45530 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_t7gn45530();
import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { DynamicHeight } from "utils/WidgetFeatures";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_t7gn45530().s[0]++, {
  type: Widget.getWidgetType(),
  name: "Rich Text Editor",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["input", "rte"],
  features: {
    dynamicHeight: {
      sectionIndex: 3,
      defaultValue: DynamicHeight.FIXED,
      active: true
    }
  },
  defaults: {
    defaultText: "This is the initial <b>content</b> of the editor",
    rows: 20,
    columns: 24,
    animateLoading: true,
    isDisabled: false,
    isVisible: true,
    isRequired: false,
    widgetName: "RichTextEditor",
    isDefaultClickDisabled: true,
    inputType: "html",
    labelText: "Label",
    labelPosition: LabelPosition.Top,
    labelAlignment: Alignment.LEFT,
    labelWidth: 5,
    version: 1,
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
    widgetSize: [{
      viewportMinWidth: 0,
      configuration: () => {
        cov_t7gn45530().f[0]++;
        cov_t7gn45530().s[1]++;
        return {
          minWidth: "280px",
          minHeight: "300px"
        };
      }
    }]
  }
});
export default Widget;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfdDdnbjQ1NTMwIiwiYWN0dWFsQ292ZXJhZ2UiLCJBbGlnbm1lbnQiLCJMYWJlbFBvc2l0aW9uIiwiRklMTF9XSURHRVRfTUlOX1dJRFRIIiwiUmVzcG9uc2l2ZUJlaGF2aW9yIiwiRHluYW1pY0hlaWdodCIsIkljb25TVkciLCJXaWRnZXQiLCJDT05GSUciLCJzIiwidHlwZSIsImdldFdpZGdldFR5cGUiLCJuYW1lIiwiaWNvblNWRyIsIm5lZWRzTWV0YSIsInNlYXJjaFRhZ3MiLCJmZWF0dXJlcyIsImR5bmFtaWNIZWlnaHQiLCJzZWN0aW9uSW5kZXgiLCJkZWZhdWx0VmFsdWUiLCJGSVhFRCIsImFjdGl2ZSIsImRlZmF1bHRzIiwiZGVmYXVsdFRleHQiLCJyb3dzIiwiY29sdW1ucyIsImFuaW1hdGVMb2FkaW5nIiwiaXNEaXNhYmxlZCIsImlzVmlzaWJsZSIsImlzUmVxdWlyZWQiLCJ3aWRnZXROYW1lIiwiaXNEZWZhdWx0Q2xpY2tEaXNhYmxlZCIsImlucHV0VHlwZSIsImxhYmVsVGV4dCIsImxhYmVsUG9zaXRpb24iLCJUb3AiLCJsYWJlbEFsaWdubWVudCIsIkxFRlQiLCJsYWJlbFdpZHRoIiwidmVyc2lvbiIsInJlc3BvbnNpdmVCZWhhdmlvciIsIkZpbGwiLCJtaW5XaWR0aCIsInByb3BlcnRpZXMiLCJkZXJpdmVkIiwiZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAiLCJkZWZhdWx0IiwiZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAiLCJtZXRhIiwiZ2V0TWV0YVByb3BlcnRpZXNNYXAiLCJjb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb25maWciLCJjb250ZW50Q29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lQ29udGVudENvbmZpZyIsInN0eWxlQ29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lU3R5bGVDb25maWciLCJzdHlsZXNoZWV0Q29uZmlnIiwiZ2V0U3R5bGVzaGVldENvbmZpZyIsImF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiLCJhdXRvTGF5b3V0Iiwid2lkZ2V0U2l6ZSIsInZpZXdwb3J0TWluV2lkdGgiLCJjb25maWd1cmF0aW9uIiwiZiIsIm1pbkhlaWdodCJdLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFsaWdubWVudCB9IGZyb20gXCJAYmx1ZXByaW50anMvY29yZVwiO1xuaW1wb3J0IHsgTGFiZWxQb3NpdGlvbiB9IGZyb20gXCJjb21wb25lbnRzL2NvbnN0YW50c1wiO1xuaW1wb3J0IHsgRklMTF9XSURHRVRfTUlOX1dJRFRIIH0gZnJvbSBcImNvbnN0YW50cy9taW5XaWR0aENvbnN0YW50c1wiO1xuaW1wb3J0IHsgUmVzcG9uc2l2ZUJlaGF2aW9yIH0gZnJvbSBcInV0aWxzL2F1dG9MYXlvdXQvY29uc3RhbnRzXCI7XG5pbXBvcnQgeyBEeW5hbWljSGVpZ2h0IH0gZnJvbSBcInV0aWxzL1dpZGdldEZlYXR1cmVzXCI7XG5cbmltcG9ydCBJY29uU1ZHIGZyb20gXCIuL2ljb24uc3ZnXCI7XG5pbXBvcnQgV2lkZ2V0IGZyb20gXCIuL3dpZGdldFwiO1xuXG5leHBvcnQgY29uc3QgQ09ORklHID0ge1xuICB0eXBlOiBXaWRnZXQuZ2V0V2lkZ2V0VHlwZSgpLFxuICBuYW1lOiBcIlJpY2ggVGV4dCBFZGl0b3JcIixcbiAgaWNvblNWRzogSWNvblNWRyxcbiAgbmVlZHNNZXRhOiB0cnVlLFxuICBzZWFyY2hUYWdzOiBbXCJpbnB1dFwiLCBcInJ0ZVwiXSxcbiAgZmVhdHVyZXM6IHtcbiAgICBkeW5hbWljSGVpZ2h0OiB7XG4gICAgICBzZWN0aW9uSW5kZXg6IDMsXG4gICAgICBkZWZhdWx0VmFsdWU6IER5bmFtaWNIZWlnaHQuRklYRUQsXG4gICAgICBhY3RpdmU6IHRydWUsXG4gICAgfSxcbiAgfSxcbiAgZGVmYXVsdHM6IHtcbiAgICBkZWZhdWx0VGV4dDogXCJUaGlzIGlzIHRoZSBpbml0aWFsIDxiPmNvbnRlbnQ8L2I+IG9mIHRoZSBlZGl0b3JcIixcbiAgICByb3dzOiAyMCxcbiAgICBjb2x1bW5zOiAyNCxcbiAgICBhbmltYXRlTG9hZGluZzogdHJ1ZSxcbiAgICBpc0Rpc2FibGVkOiBmYWxzZSxcbiAgICBpc1Zpc2libGU6IHRydWUsXG4gICAgaXNSZXF1aXJlZDogZmFsc2UsXG4gICAgd2lkZ2V0TmFtZTogXCJSaWNoVGV4dEVkaXRvclwiLFxuICAgIGlzRGVmYXVsdENsaWNrRGlzYWJsZWQ6IHRydWUsXG4gICAgaW5wdXRUeXBlOiBcImh0bWxcIixcbiAgICBsYWJlbFRleHQ6IFwiTGFiZWxcIixcbiAgICBsYWJlbFBvc2l0aW9uOiBMYWJlbFBvc2l0aW9uLlRvcCxcbiAgICBsYWJlbEFsaWdubWVudDogQWxpZ25tZW50LkxFRlQsXG4gICAgbGFiZWxXaWR0aDogNSxcbiAgICB2ZXJzaW9uOiAxLFxuICAgIHJlc3BvbnNpdmVCZWhhdmlvcjogUmVzcG9uc2l2ZUJlaGF2aW9yLkZpbGwsXG4gICAgbWluV2lkdGg6IEZJTExfV0lER0VUX01JTl9XSURUSCxcbiAgfSxcbiAgcHJvcGVydGllczoge1xuICAgIGRlcml2ZWQ6IFdpZGdldC5nZXREZXJpdmVkUHJvcGVydGllc01hcCgpLFxuICAgIGRlZmF1bHQ6IFdpZGdldC5nZXREZWZhdWx0UHJvcGVydGllc01hcCgpLFxuICAgIG1ldGE6IFdpZGdldC5nZXRNZXRhUHJvcGVydGllc01hcCgpLFxuICAgIGNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbmZpZygpLFxuICAgIGNvbnRlbnRDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnKCksXG4gICAgc3R5bGVDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVTdHlsZUNvbmZpZygpLFxuICAgIHN0eWxlc2hlZXRDb25maWc6IFdpZGdldC5nZXRTdHlsZXNoZWV0Q29uZmlnKCksXG4gICAgYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnM6IFdpZGdldC5nZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucygpLFxuICB9LFxuICBhdXRvTGF5b3V0OiB7XG4gICAgd2lkZ2V0U2l6ZTogW1xuICAgICAge1xuICAgICAgICB2aWV3cG9ydE1pbldpZHRoOiAwLFxuICAgICAgICBjb25maWd1cmF0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1pbldpZHRoOiBcIjI4MHB4XCIsXG4gICAgICAgICAgICBtaW5IZWlnaHQ6IFwiMzAwcHhcIixcbiAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdLFxuICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgV2lkZ2V0O1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsYUFBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsYUFBQTtBQWZaLFNBQVNFLFNBQVMsUUFBUSxtQkFBbUI7QUFDN0MsU0FBU0MsYUFBYSxRQUFRLHNCQUFzQjtBQUNwRCxTQUFTQyxxQkFBcUIsUUFBUSw2QkFBNkI7QUFDbkUsU0FBU0Msa0JBQWtCLFFBQVEsNEJBQTRCO0FBQy9ELFNBQVNDLGFBQWEsUUFBUSxzQkFBc0I7QUFFcEQsT0FBT0MsT0FBTyxNQUFNLFlBQVk7QUFDaEMsT0FBT0MsTUFBTSxNQUFNLFVBQVU7QUFFN0IsT0FBTyxNQUFNQyxNQUFNLElBQUFULGFBQUEsR0FBQVUsQ0FBQSxPQUFHO0VBQ3BCQyxJQUFJLEVBQUVILE1BQU0sQ0FBQ0ksYUFBYSxDQUFDLENBQUM7RUFDNUJDLElBQUksRUFBRSxrQkFBa0I7RUFDeEJDLE9BQU8sRUFBRVAsT0FBTztFQUNoQlEsU0FBUyxFQUFFLElBQUk7RUFDZkMsVUFBVSxFQUFFLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQztFQUM1QkMsUUFBUSxFQUFFO0lBQ1JDLGFBQWEsRUFBRTtNQUNiQyxZQUFZLEVBQUUsQ0FBQztNQUNmQyxZQUFZLEVBQUVkLGFBQWEsQ0FBQ2UsS0FBSztNQUNqQ0MsTUFBTSxFQUFFO0lBQ1Y7RUFDRixDQUFDO0VBQ0RDLFFBQVEsRUFBRTtJQUNSQyxXQUFXLEVBQUUsa0RBQWtEO0lBQy9EQyxJQUFJLEVBQUUsRUFBRTtJQUNSQyxPQUFPLEVBQUUsRUFBRTtJQUNYQyxjQUFjLEVBQUUsSUFBSTtJQUNwQkMsVUFBVSxFQUFFLEtBQUs7SUFDakJDLFNBQVMsRUFBRSxJQUFJO0lBQ2ZDLFVBQVUsRUFBRSxLQUFLO0lBQ2pCQyxVQUFVLEVBQUUsZ0JBQWdCO0lBQzVCQyxzQkFBc0IsRUFBRSxJQUFJO0lBQzVCQyxTQUFTLEVBQUUsTUFBTTtJQUNqQkMsU0FBUyxFQUFFLE9BQU87SUFDbEJDLGFBQWEsRUFBRWhDLGFBQWEsQ0FBQ2lDLEdBQUc7SUFDaENDLGNBQWMsRUFBRW5DLFNBQVMsQ0FBQ29DLElBQUk7SUFDOUJDLFVBQVUsRUFBRSxDQUFDO0lBQ2JDLE9BQU8sRUFBRSxDQUFDO0lBQ1ZDLGtCQUFrQixFQUFFcEMsa0JBQWtCLENBQUNxQyxJQUFJO0lBQzNDQyxRQUFRLEVBQUV2QztFQUNaLENBQUM7RUFDRHdDLFVBQVUsRUFBRTtJQUNWQyxPQUFPLEVBQUVyQyxNQUFNLENBQUNzQyx1QkFBdUIsQ0FBQyxDQUFDO0lBQ3pDQyxPQUFPLEVBQUV2QyxNQUFNLENBQUN3Qyx1QkFBdUIsQ0FBQyxDQUFDO0lBQ3pDQyxJQUFJLEVBQUV6QyxNQUFNLENBQUMwQyxvQkFBb0IsQ0FBQyxDQUFDO0lBQ25DQyxNQUFNLEVBQUUzQyxNQUFNLENBQUM0QyxxQkFBcUIsQ0FBQyxDQUFDO0lBQ3RDQyxhQUFhLEVBQUU3QyxNQUFNLENBQUM4Qyw0QkFBNEIsQ0FBQyxDQUFDO0lBQ3BEQyxXQUFXLEVBQUUvQyxNQUFNLENBQUNnRCwwQkFBMEIsQ0FBQyxDQUFDO0lBQ2hEQyxnQkFBZ0IsRUFBRWpELE1BQU0sQ0FBQ2tELG1CQUFtQixDQUFDLENBQUM7SUFDOUNDLHVCQUF1QixFQUFFbkQsTUFBTSxDQUFDb0QsMEJBQTBCLENBQUM7RUFDN0QsQ0FBQztFQUNEQyxVQUFVLEVBQUU7SUFDVkMsVUFBVSxFQUFFLENBQ1Y7TUFDRUMsZ0JBQWdCLEVBQUUsQ0FBQztNQUNuQkMsYUFBYSxFQUFFQSxDQUFBLEtBQU07UUFBQWhFLGFBQUEsR0FBQWlFLENBQUE7UUFBQWpFLGFBQUEsR0FBQVUsQ0FBQTtRQUNuQixPQUFPO1VBQ0xpQyxRQUFRLEVBQUUsT0FBTztVQUNqQnVCLFNBQVMsRUFBRTtRQUNiLENBQUM7TUFDSDtJQUNGLENBQUM7RUFFTDtBQUNGLENBQUM7QUFFRCxlQUFlMUQsTUFBTSJ9