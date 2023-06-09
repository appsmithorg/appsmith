function cov_2pl1b930sx() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/PhoneInputWidget/index.ts";
  var hash = "599250cbf80b8bb879da91cbe122cb9a725079cb";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/PhoneInputWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 11,
          column: 22
        },
        end: {
          line: 71,
          column: 1
        }
      },
      "1": {
        start: {
          line: 61,
          column: 10
        },
        end: {
          line: 63,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 60,
            column: 23
          },
          end: {
            line: 60,
            column: 24
          }
        },
        loc: {
          start: {
            line: 60,
            column: 29
          },
          end: {
            line: 64,
            column: 9
          }
        },
        line: 60
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
    hash: "599250cbf80b8bb879da91cbe122cb9a725079cb"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_2pl1b930sx = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_2pl1b930sx();
import { LabelPosition } from "components/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { DynamicHeight } from "utils/WidgetFeatures";
import { CONFIG as BaseConfig } from "widgets/BaseInputWidget";
import { getDefaultISDCode } from "./component/ISDCodeDropdown";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_2pl1b930sx().s[0]++, {
  features: {
    dynamicHeight: {
      sectionIndex: 3,
      defaultValue: DynamicHeight.FIXED,
      active: true
    }
  },
  type: Widget.getWidgetType(),
  name: "Phone Input",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["call"],
  defaults: {
    ...BaseConfig.defaults,
    widgetName: "PhoneInput",
    version: 1,
    rows: 7,
    labelPosition: LabelPosition.Top,
    defaultDialCode: getDefaultISDCode().dial_code,
    allowDialCodeChange: false,
    allowFormatting: true,
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
        cov_2pl1b930sx().f[0]++;
        cov_2pl1b930sx().s[1]++;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMnBsMWI5MzBzeCIsImFjdHVhbENvdmVyYWdlIiwiTGFiZWxQb3NpdGlvbiIsIkZJTExfV0lER0VUX01JTl9XSURUSCIsIlJlc3BvbnNpdmVCZWhhdmlvciIsIkR5bmFtaWNIZWlnaHQiLCJDT05GSUciLCJCYXNlQ29uZmlnIiwiZ2V0RGVmYXVsdElTRENvZGUiLCJJY29uU1ZHIiwiV2lkZ2V0IiwicyIsImZlYXR1cmVzIiwiZHluYW1pY0hlaWdodCIsInNlY3Rpb25JbmRleCIsImRlZmF1bHRWYWx1ZSIsIkZJWEVEIiwiYWN0aXZlIiwidHlwZSIsImdldFdpZGdldFR5cGUiLCJuYW1lIiwiaWNvblNWRyIsIm5lZWRzTWV0YSIsInNlYXJjaFRhZ3MiLCJkZWZhdWx0cyIsIndpZGdldE5hbWUiLCJ2ZXJzaW9uIiwicm93cyIsImxhYmVsUG9zaXRpb24iLCJUb3AiLCJkZWZhdWx0RGlhbENvZGUiLCJkaWFsX2NvZGUiLCJhbGxvd0RpYWxDb2RlQ2hhbmdlIiwiYWxsb3dGb3JtYXR0aW5nIiwicmVzcG9uc2l2ZUJlaGF2aW9yIiwiRmlsbCIsIm1pbldpZHRoIiwicHJvcGVydGllcyIsImRlcml2ZWQiLCJnZXREZXJpdmVkUHJvcGVydGllc01hcCIsImRlZmF1bHQiLCJnZXREZWZhdWx0UHJvcGVydGllc01hcCIsIm1ldGEiLCJnZXRNZXRhUHJvcGVydGllc01hcCIsImNvbmZpZyIsImdldFByb3BlcnR5UGFuZUNvbmZpZyIsImNvbnRlbnRDb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnIiwic3R5bGVDb25maWciLCJnZXRQcm9wZXJ0eVBhbmVTdHlsZUNvbmZpZyIsInN0eWxlc2hlZXRDb25maWciLCJnZXRTdHlsZXNoZWV0Q29uZmlnIiwiYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiLCJnZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucyIsImF1dG9MYXlvdXQiLCJkaXNhYmxlZFByb3BzRGVmYXVsdHMiLCJsYWJlbFRleHRTaXplIiwiYXV0b0RpbWVuc2lvbiIsImhlaWdodCIsIndpZGdldFNpemUiLCJ2aWV3cG9ydE1pbldpZHRoIiwiY29uZmlndXJhdGlvbiIsImYiLCJkaXNhYmxlUmVzaXplSGFuZGxlcyIsInZlcnRpY2FsIl0sInNvdXJjZXMiOlsiaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTGFiZWxQb3NpdGlvbiB9IGZyb20gXCJjb21wb25lbnRzL2NvbnN0YW50c1wiO1xuaW1wb3J0IHsgRklMTF9XSURHRVRfTUlOX1dJRFRIIH0gZnJvbSBcImNvbnN0YW50cy9taW5XaWR0aENvbnN0YW50c1wiO1xuaW1wb3J0IHsgUmVzcG9uc2l2ZUJlaGF2aW9yIH0gZnJvbSBcInV0aWxzL2F1dG9MYXlvdXQvY29uc3RhbnRzXCI7XG5pbXBvcnQgeyBEeW5hbWljSGVpZ2h0IH0gZnJvbSBcInV0aWxzL1dpZGdldEZlYXR1cmVzXCI7XG5pbXBvcnQgeyBDT05GSUcgYXMgQmFzZUNvbmZpZyB9IGZyb20gXCJ3aWRnZXRzL0Jhc2VJbnB1dFdpZGdldFwiO1xuXG5pbXBvcnQgeyBnZXREZWZhdWx0SVNEQ29kZSB9IGZyb20gXCIuL2NvbXBvbmVudC9JU0RDb2RlRHJvcGRvd25cIjtcbmltcG9ydCBJY29uU1ZHIGZyb20gXCIuL2ljb24uc3ZnXCI7XG5pbXBvcnQgV2lkZ2V0IGZyb20gXCIuL3dpZGdldFwiO1xuXG5leHBvcnQgY29uc3QgQ09ORklHID0ge1xuICBmZWF0dXJlczoge1xuICAgIGR5bmFtaWNIZWlnaHQ6IHtcbiAgICAgIHNlY3Rpb25JbmRleDogMyxcbiAgICAgIGRlZmF1bHRWYWx1ZTogRHluYW1pY0hlaWdodC5GSVhFRCxcbiAgICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICB9LFxuICB9LFxuICB0eXBlOiBXaWRnZXQuZ2V0V2lkZ2V0VHlwZSgpLFxuICBuYW1lOiBcIlBob25lIElucHV0XCIsXG4gIGljb25TVkc6IEljb25TVkcsXG4gIG5lZWRzTWV0YTogdHJ1ZSxcbiAgc2VhcmNoVGFnczogW1wiY2FsbFwiXSxcbiAgZGVmYXVsdHM6IHtcbiAgICAuLi5CYXNlQ29uZmlnLmRlZmF1bHRzLFxuICAgIHdpZGdldE5hbWU6IFwiUGhvbmVJbnB1dFwiLFxuICAgIHZlcnNpb246IDEsXG4gICAgcm93czogNyxcbiAgICBsYWJlbFBvc2l0aW9uOiBMYWJlbFBvc2l0aW9uLlRvcCxcbiAgICBkZWZhdWx0RGlhbENvZGU6IGdldERlZmF1bHRJU0RDb2RlKCkuZGlhbF9jb2RlLFxuICAgIGFsbG93RGlhbENvZGVDaGFuZ2U6IGZhbHNlLFxuICAgIGFsbG93Rm9ybWF0dGluZzogdHJ1ZSxcbiAgICByZXNwb25zaXZlQmVoYXZpb3I6IFJlc3BvbnNpdmVCZWhhdmlvci5GaWxsLFxuICAgIG1pbldpZHRoOiBGSUxMX1dJREdFVF9NSU5fV0lEVEgsXG4gIH0sXG4gIHByb3BlcnRpZXM6IHtcbiAgICBkZXJpdmVkOiBXaWRnZXQuZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAoKSxcbiAgICBkZWZhdWx0OiBXaWRnZXQuZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAoKSxcbiAgICBtZXRhOiBXaWRnZXQuZ2V0TWV0YVByb3BlcnRpZXNNYXAoKSxcbiAgICBjb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVDb25maWcoKSxcbiAgICBjb250ZW50Q29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lQ29udGVudENvbmZpZygpLFxuICAgIHN0eWxlQ29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lU3R5bGVDb25maWcoKSxcbiAgICBzdHlsZXNoZWV0Q29uZmlnOiBXaWRnZXQuZ2V0U3R5bGVzaGVldENvbmZpZygpLFxuICAgIGF1dG9jb21wbGV0ZURlZmluaXRpb25zOiBXaWRnZXQuZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMoKSxcbiAgfSxcbiAgYXV0b0xheW91dDoge1xuICAgIGRpc2FibGVkUHJvcHNEZWZhdWx0czoge1xuICAgICAgbGFiZWxQb3NpdGlvbjogTGFiZWxQb3NpdGlvbi5Ub3AsXG4gICAgICBsYWJlbFRleHRTaXplOiBcIjAuODc1cmVtXCIsXG4gICAgfSxcbiAgICBkZWZhdWx0czoge1xuICAgICAgcm93czogNi42LFxuICAgIH0sXG4gICAgYXV0b0RpbWVuc2lvbjoge1xuICAgICAgaGVpZ2h0OiB0cnVlLFxuICAgIH0sXG4gICAgd2lkZ2V0U2l6ZTogW1xuICAgICAge1xuICAgICAgICB2aWV3cG9ydE1pbldpZHRoOiAwLFxuICAgICAgICBjb25maWd1cmF0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1pbldpZHRoOiBcIjE2MHB4XCIsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSxcbiAgICBkaXNhYmxlUmVzaXplSGFuZGxlczoge1xuICAgICAgdmVydGljYWw6IHRydWUsXG4gICAgfSxcbiAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFdpZGdldDtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGNBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGNBQUE7QUFmWixTQUFTRSxhQUFhLFFBQVEsc0JBQXNCO0FBQ3BELFNBQVNDLHFCQUFxQixRQUFRLDZCQUE2QjtBQUNuRSxTQUFTQyxrQkFBa0IsUUFBUSw0QkFBNEI7QUFDL0QsU0FBU0MsYUFBYSxRQUFRLHNCQUFzQjtBQUNwRCxTQUFTQyxNQUFNLElBQUlDLFVBQVUsUUFBUSx5QkFBeUI7QUFFOUQsU0FBU0MsaUJBQWlCLFFBQVEsNkJBQTZCO0FBQy9ELE9BQU9DLE9BQU8sTUFBTSxZQUFZO0FBQ2hDLE9BQU9DLE1BQU0sTUFBTSxVQUFVO0FBRTdCLE9BQU8sTUFBTUosTUFBTSxJQUFBTixjQUFBLEdBQUFXLENBQUEsT0FBRztFQUNwQkMsUUFBUSxFQUFFO0lBQ1JDLGFBQWEsRUFBRTtNQUNiQyxZQUFZLEVBQUUsQ0FBQztNQUNmQyxZQUFZLEVBQUVWLGFBQWEsQ0FBQ1csS0FBSztNQUNqQ0MsTUFBTSxFQUFFO0lBQ1Y7RUFDRixDQUFDO0VBQ0RDLElBQUksRUFBRVIsTUFBTSxDQUFDUyxhQUFhLENBQUMsQ0FBQztFQUM1QkMsSUFBSSxFQUFFLGFBQWE7RUFDbkJDLE9BQU8sRUFBRVosT0FBTztFQUNoQmEsU0FBUyxFQUFFLElBQUk7RUFDZkMsVUFBVSxFQUFFLENBQUMsTUFBTSxDQUFDO0VBQ3BCQyxRQUFRLEVBQUU7SUFDUixHQUFHakIsVUFBVSxDQUFDaUIsUUFBUTtJQUN0QkMsVUFBVSxFQUFFLFlBQVk7SUFDeEJDLE9BQU8sRUFBRSxDQUFDO0lBQ1ZDLElBQUksRUFBRSxDQUFDO0lBQ1BDLGFBQWEsRUFBRTFCLGFBQWEsQ0FBQzJCLEdBQUc7SUFDaENDLGVBQWUsRUFBRXRCLGlCQUFpQixDQUFDLENBQUMsQ0FBQ3VCLFNBQVM7SUFDOUNDLG1CQUFtQixFQUFFLEtBQUs7SUFDMUJDLGVBQWUsRUFBRSxJQUFJO0lBQ3JCQyxrQkFBa0IsRUFBRTlCLGtCQUFrQixDQUFDK0IsSUFBSTtJQUMzQ0MsUUFBUSxFQUFFakM7RUFDWixDQUFDO0VBQ0RrQyxVQUFVLEVBQUU7SUFDVkMsT0FBTyxFQUFFNUIsTUFBTSxDQUFDNkIsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsT0FBTyxFQUFFOUIsTUFBTSxDQUFDK0IsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsSUFBSSxFQUFFaEMsTUFBTSxDQUFDaUMsb0JBQW9CLENBQUMsQ0FBQztJQUNuQ0MsTUFBTSxFQUFFbEMsTUFBTSxDQUFDbUMscUJBQXFCLENBQUMsQ0FBQztJQUN0Q0MsYUFBYSxFQUFFcEMsTUFBTSxDQUFDcUMsNEJBQTRCLENBQUMsQ0FBQztJQUNwREMsV0FBVyxFQUFFdEMsTUFBTSxDQUFDdUMsMEJBQTBCLENBQUMsQ0FBQztJQUNoREMsZ0JBQWdCLEVBQUV4QyxNQUFNLENBQUN5QyxtQkFBbUIsQ0FBQyxDQUFDO0lBQzlDQyx1QkFBdUIsRUFBRTFDLE1BQU0sQ0FBQzJDLDBCQUEwQixDQUFDO0VBQzdELENBQUM7RUFDREMsVUFBVSxFQUFFO0lBQ1ZDLHFCQUFxQixFQUFFO01BQ3JCM0IsYUFBYSxFQUFFMUIsYUFBYSxDQUFDMkIsR0FBRztNQUNoQzJCLGFBQWEsRUFBRTtJQUNqQixDQUFDO0lBQ0RoQyxRQUFRLEVBQUU7TUFDUkcsSUFBSSxFQUFFO0lBQ1IsQ0FBQztJQUNEOEIsYUFBYSxFQUFFO01BQ2JDLE1BQU0sRUFBRTtJQUNWLENBQUM7SUFDREMsVUFBVSxFQUFFLENBQ1Y7TUFDRUMsZ0JBQWdCLEVBQUUsQ0FBQztNQUNuQkMsYUFBYSxFQUFFQSxDQUFBLEtBQU07UUFBQTdELGNBQUEsR0FBQThELENBQUE7UUFBQTlELGNBQUEsR0FBQVcsQ0FBQTtRQUNuQixPQUFPO1VBQ0x5QixRQUFRLEVBQUU7UUFDWixDQUFDO01BQ0g7SUFDRixDQUFDLENBQ0Y7SUFDRDJCLG9CQUFvQixFQUFFO01BQ3BCQyxRQUFRLEVBQUU7SUFDWjtFQUNGO0FBQ0YsQ0FBQztBQUVELGVBQWV0RCxNQUFNIn0=