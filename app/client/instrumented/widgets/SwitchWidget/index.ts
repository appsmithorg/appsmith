function cov_217howmwpi() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/SwitchWidget/index.ts";
  var hash = "7a78bdd4c439abdaf8faf4c5eeeb8d2a22c9492c";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/SwitchWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 8,
          column: 22
        },
        end: {
          line: 62,
          column: 1
        }
      },
      "1": {
        start: {
          line: 51,
          column: 10
        },
        end: {
          line: 54,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 50,
            column: 23
          },
          end: {
            line: 50,
            column: 24
          }
        },
        loc: {
          start: {
            line: 50,
            column: 29
          },
          end: {
            line: 55,
            column: 9
          }
        },
        line: 50
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
    hash: "7a78bdd4c439abdaf8faf4c5eeeb8d2a22c9492c"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_217howmwpi = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_217howmwpi();
import { LabelPosition } from "components/constants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { AlignWidgetTypes } from "widgets/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_217howmwpi().s[0]++, {
  features: {
    dynamicHeight: {
      sectionIndex: 1,
      active: true
    }
  },
  type: Widget.getWidgetType(),
  name: "Switch",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["boolean"],
  defaults: {
    label: "Label",
    rows: 4,
    columns: 12,
    defaultSwitchState: true,
    widgetName: "Switch",
    alignWidget: AlignWidgetTypes.LEFT,
    labelPosition: LabelPosition.Left,
    version: 1,
    isDisabled: false,
    animateLoading: true,
    responsiveBehavior: ResponsiveBehavior.Fill
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
        cov_217howmwpi().f[0]++;
        cov_217howmwpi().s[1]++;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMjE3aG93bXdwaSIsImFjdHVhbENvdmVyYWdlIiwiTGFiZWxQb3NpdGlvbiIsIlJlc3BvbnNpdmVCZWhhdmlvciIsIkFsaWduV2lkZ2V0VHlwZXMiLCJJY29uU1ZHIiwiV2lkZ2V0IiwiQ09ORklHIiwicyIsImZlYXR1cmVzIiwiZHluYW1pY0hlaWdodCIsInNlY3Rpb25JbmRleCIsImFjdGl2ZSIsInR5cGUiLCJnZXRXaWRnZXRUeXBlIiwibmFtZSIsImljb25TVkciLCJuZWVkc01ldGEiLCJzZWFyY2hUYWdzIiwiZGVmYXVsdHMiLCJsYWJlbCIsInJvd3MiLCJjb2x1bW5zIiwiZGVmYXVsdFN3aXRjaFN0YXRlIiwid2lkZ2V0TmFtZSIsImFsaWduV2lkZ2V0IiwiTEVGVCIsImxhYmVsUG9zaXRpb24iLCJMZWZ0IiwidmVyc2lvbiIsImlzRGlzYWJsZWQiLCJhbmltYXRlTG9hZGluZyIsInJlc3BvbnNpdmVCZWhhdmlvciIsIkZpbGwiLCJwcm9wZXJ0aWVzIiwiZGVyaXZlZCIsImdldERlcml2ZWRQcm9wZXJ0aWVzTWFwIiwiZGVmYXVsdCIsImdldERlZmF1bHRQcm9wZXJ0aWVzTWFwIiwibWV0YSIsImdldE1ldGFQcm9wZXJ0aWVzTWFwIiwiY29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lQ29uZmlnIiwiY29udGVudENvbmZpZyIsImdldFByb3BlcnR5UGFuZUNvbnRlbnRDb25maWciLCJzdHlsZUNvbmZpZyIsImdldFByb3BlcnR5UGFuZVN0eWxlQ29uZmlnIiwic3R5bGVzaGVldENvbmZpZyIsImdldFN0eWxlc2hlZXRDb25maWciLCJhdXRvY29tcGxldGVEZWZpbml0aW9ucyIsImdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiYXV0b0xheW91dCIsImRpc2FibGVkUHJvcHNEZWZhdWx0cyIsImxhYmVsVGV4dFNpemUiLCJ3aWRnZXRTaXplIiwidmlld3BvcnRNaW5XaWR0aCIsImNvbmZpZ3VyYXRpb24iLCJmIiwibWluV2lkdGgiLCJtaW5IZWlnaHQiLCJkaXNhYmxlUmVzaXplSGFuZGxlcyIsInZlcnRpY2FsIl0sInNvdXJjZXMiOlsiaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTGFiZWxQb3NpdGlvbiB9IGZyb20gXCJjb21wb25lbnRzL2NvbnN0YW50c1wiO1xuaW1wb3J0IHsgUmVzcG9uc2l2ZUJlaGF2aW9yIH0gZnJvbSBcInV0aWxzL2F1dG9MYXlvdXQvY29uc3RhbnRzXCI7XG5pbXBvcnQgeyBBbGlnbldpZGdldFR5cGVzIH0gZnJvbSBcIndpZGdldHMvY29uc3RhbnRzXCI7XG5cbmltcG9ydCBJY29uU1ZHIGZyb20gXCIuL2ljb24uc3ZnXCI7XG5pbXBvcnQgV2lkZ2V0IGZyb20gXCIuL3dpZGdldFwiO1xuXG5leHBvcnQgY29uc3QgQ09ORklHID0ge1xuICBmZWF0dXJlczoge1xuICAgIGR5bmFtaWNIZWlnaHQ6IHtcbiAgICAgIHNlY3Rpb25JbmRleDogMSxcbiAgICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICB9LFxuICB9LFxuICB0eXBlOiBXaWRnZXQuZ2V0V2lkZ2V0VHlwZSgpLFxuICBuYW1lOiBcIlN3aXRjaFwiLFxuICBpY29uU1ZHOiBJY29uU1ZHLFxuICBuZWVkc01ldGE6IHRydWUsXG4gIHNlYXJjaFRhZ3M6IFtcImJvb2xlYW5cIl0sXG4gIGRlZmF1bHRzOiB7XG4gICAgbGFiZWw6IFwiTGFiZWxcIixcbiAgICByb3dzOiA0LFxuICAgIGNvbHVtbnM6IDEyLFxuICAgIGRlZmF1bHRTd2l0Y2hTdGF0ZTogdHJ1ZSxcbiAgICB3aWRnZXROYW1lOiBcIlN3aXRjaFwiLFxuICAgIGFsaWduV2lkZ2V0OiBBbGlnbldpZGdldFR5cGVzLkxFRlQsXG4gICAgbGFiZWxQb3NpdGlvbjogTGFiZWxQb3NpdGlvbi5MZWZ0LFxuICAgIHZlcnNpb246IDEsXG4gICAgaXNEaXNhYmxlZDogZmFsc2UsXG4gICAgYW5pbWF0ZUxvYWRpbmc6IHRydWUsXG4gICAgcmVzcG9uc2l2ZUJlaGF2aW9yOiBSZXNwb25zaXZlQmVoYXZpb3IuRmlsbCxcbiAgfSxcbiAgcHJvcGVydGllczoge1xuICAgIGRlcml2ZWQ6IFdpZGdldC5nZXREZXJpdmVkUHJvcGVydGllc01hcCgpLFxuICAgIGRlZmF1bHQ6IFdpZGdldC5nZXREZWZhdWx0UHJvcGVydGllc01hcCgpLFxuICAgIG1ldGE6IFdpZGdldC5nZXRNZXRhUHJvcGVydGllc01hcCgpLFxuICAgIGNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbmZpZygpLFxuICAgIGNvbnRlbnRDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnKCksXG4gICAgc3R5bGVDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVTdHlsZUNvbmZpZygpLFxuICAgIHN0eWxlc2hlZXRDb25maWc6IFdpZGdldC5nZXRTdHlsZXNoZWV0Q29uZmlnKCksXG4gICAgYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnM6IFdpZGdldC5nZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucygpLFxuICB9LFxuICBhdXRvTGF5b3V0OiB7XG4gICAgZGlzYWJsZWRQcm9wc0RlZmF1bHRzOiB7XG4gICAgICBsYWJlbFRleHRTaXplOiBcIjAuODc1cmVtXCIsXG4gICAgfSxcbiAgICB3aWRnZXRTaXplOiBbXG4gICAgICB7XG4gICAgICAgIHZpZXdwb3J0TWluV2lkdGg6IDAsXG4gICAgICAgIGNvbmZpZ3VyYXRpb246ICgpID0+IHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWluV2lkdGg6IFwiMTIwcHhcIixcbiAgICAgICAgICAgIG1pbkhlaWdodDogXCI0MHB4XCIsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSxcbiAgICBkaXNhYmxlUmVzaXplSGFuZGxlczoge1xuICAgICAgdmVydGljYWw6IHRydWUsXG4gICAgfSxcbiAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFdpZGdldDtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGNBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGNBQUE7QUFmWixTQUFTRSxhQUFhLFFBQVEsc0JBQXNCO0FBQ3BELFNBQVNDLGtCQUFrQixRQUFRLDRCQUE0QjtBQUMvRCxTQUFTQyxnQkFBZ0IsUUFBUSxtQkFBbUI7QUFFcEQsT0FBT0MsT0FBTyxNQUFNLFlBQVk7QUFDaEMsT0FBT0MsTUFBTSxNQUFNLFVBQVU7QUFFN0IsT0FBTyxNQUFNQyxNQUFNLElBQUFQLGNBQUEsR0FBQVEsQ0FBQSxPQUFHO0VBQ3BCQyxRQUFRLEVBQUU7SUFDUkMsYUFBYSxFQUFFO01BQ2JDLFlBQVksRUFBRSxDQUFDO01BQ2ZDLE1BQU0sRUFBRTtJQUNWO0VBQ0YsQ0FBQztFQUNEQyxJQUFJLEVBQUVQLE1BQU0sQ0FBQ1EsYUFBYSxDQUFDLENBQUM7RUFDNUJDLElBQUksRUFBRSxRQUFRO0VBQ2RDLE9BQU8sRUFBRVgsT0FBTztFQUNoQlksU0FBUyxFQUFFLElBQUk7RUFDZkMsVUFBVSxFQUFFLENBQUMsU0FBUyxDQUFDO0VBQ3ZCQyxRQUFRLEVBQUU7SUFDUkMsS0FBSyxFQUFFLE9BQU87SUFDZEMsSUFBSSxFQUFFLENBQUM7SUFDUEMsT0FBTyxFQUFFLEVBQUU7SUFDWEMsa0JBQWtCLEVBQUUsSUFBSTtJQUN4QkMsVUFBVSxFQUFFLFFBQVE7SUFDcEJDLFdBQVcsRUFBRXJCLGdCQUFnQixDQUFDc0IsSUFBSTtJQUNsQ0MsYUFBYSxFQUFFekIsYUFBYSxDQUFDMEIsSUFBSTtJQUNqQ0MsT0FBTyxFQUFFLENBQUM7SUFDVkMsVUFBVSxFQUFFLEtBQUs7SUFDakJDLGNBQWMsRUFBRSxJQUFJO0lBQ3BCQyxrQkFBa0IsRUFBRTdCLGtCQUFrQixDQUFDOEI7RUFDekMsQ0FBQztFQUNEQyxVQUFVLEVBQUU7SUFDVkMsT0FBTyxFQUFFN0IsTUFBTSxDQUFDOEIsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsT0FBTyxFQUFFL0IsTUFBTSxDQUFDZ0MsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsSUFBSSxFQUFFakMsTUFBTSxDQUFDa0Msb0JBQW9CLENBQUMsQ0FBQztJQUNuQ0MsTUFBTSxFQUFFbkMsTUFBTSxDQUFDb0MscUJBQXFCLENBQUMsQ0FBQztJQUN0Q0MsYUFBYSxFQUFFckMsTUFBTSxDQUFDc0MsNEJBQTRCLENBQUMsQ0FBQztJQUNwREMsV0FBVyxFQUFFdkMsTUFBTSxDQUFDd0MsMEJBQTBCLENBQUMsQ0FBQztJQUNoREMsZ0JBQWdCLEVBQUV6QyxNQUFNLENBQUMwQyxtQkFBbUIsQ0FBQyxDQUFDO0lBQzlDQyx1QkFBdUIsRUFBRTNDLE1BQU0sQ0FBQzRDLDBCQUEwQixDQUFDO0VBQzdELENBQUM7RUFDREMsVUFBVSxFQUFFO0lBQ1ZDLHFCQUFxQixFQUFFO01BQ3JCQyxhQUFhLEVBQUU7SUFDakIsQ0FBQztJQUNEQyxVQUFVLEVBQUUsQ0FDVjtNQUNFQyxnQkFBZ0IsRUFBRSxDQUFDO01BQ25CQyxhQUFhLEVBQUVBLENBQUEsS0FBTTtRQUFBeEQsY0FBQSxHQUFBeUQsQ0FBQTtRQUFBekQsY0FBQSxHQUFBUSxDQUFBO1FBQ25CLE9BQU87VUFDTGtELFFBQVEsRUFBRSxPQUFPO1VBQ2pCQyxTQUFTLEVBQUU7UUFDYixDQUFDO01BQ0g7SUFDRixDQUFDLENBQ0Y7SUFDREMsb0JBQW9CLEVBQUU7TUFDcEJDLFFBQVEsRUFBRTtJQUNaO0VBQ0Y7QUFDRixDQUFDO0FBRUQsZUFBZXZELE1BQU0ifQ==