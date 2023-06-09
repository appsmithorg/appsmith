function cov_1cwpwmt6ub() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/MultiSelectWidget/index.ts";
  var hash = "b40c7c43ee0b2a65403bafb5e26cb8891f83897e";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/MultiSelectWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 9,
          column: 22
        },
        end: {
          line: 48,
          column: 1
        }
      }
    },
    fnMap: {},
    branchMap: {},
    s: {
      "0": 0
    },
    f: {},
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "b40c7c43ee0b2a65403bafb5e26cb8891f83897e"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1cwpwmt6ub = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1cwpwmt6ub();
import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_1cwpwmt6ub().s[0]++, {
  type: Widget.getWidgetType(),
  name: "MultiSelect",
  iconSVG: IconSVG,
  needsMeta: true,
  hideCard: true,
  isDeprecated: true,
  replacement: "MULTI_SELECT_WIDGET_V2",
  defaults: {
    rows: 7,
    columns: 20,
    animateLoading: true,
    labelText: "Label",
    labelPosition: LabelPosition.Left,
    labelAlignment: Alignment.LEFT,
    labelWidth: 5,
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
    serverSideFiltering: false,
    defaultOptionValue: ["GREEN"],
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
    stylesheetConfig: Widget.getStylesheetConfig(),
    autocompleteDefinitions: Widget.getAutocompleteDefinitions()
  }
});
export default Widget;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMWN3cHdtdDZ1YiIsImFjdHVhbENvdmVyYWdlIiwiQWxpZ25tZW50IiwiTGFiZWxQb3NpdGlvbiIsIkZJTExfV0lER0VUX01JTl9XSURUSCIsIlJlc3BvbnNpdmVCZWhhdmlvciIsIkljb25TVkciLCJXaWRnZXQiLCJDT05GSUciLCJzIiwidHlwZSIsImdldFdpZGdldFR5cGUiLCJuYW1lIiwiaWNvblNWRyIsIm5lZWRzTWV0YSIsImhpZGVDYXJkIiwiaXNEZXByZWNhdGVkIiwicmVwbGFjZW1lbnQiLCJkZWZhdWx0cyIsInJvd3MiLCJjb2x1bW5zIiwiYW5pbWF0ZUxvYWRpbmciLCJsYWJlbFRleHQiLCJsYWJlbFBvc2l0aW9uIiwiTGVmdCIsImxhYmVsQWxpZ25tZW50IiwiTEVGVCIsImxhYmVsV2lkdGgiLCJvcHRpb25zIiwibGFiZWwiLCJ2YWx1ZSIsIndpZGdldE5hbWUiLCJzZXJ2ZXJTaWRlRmlsdGVyaW5nIiwiZGVmYXVsdE9wdGlvblZhbHVlIiwidmVyc2lvbiIsImlzUmVxdWlyZWQiLCJpc0Rpc2FibGVkIiwicGxhY2Vob2xkZXJUZXh0IiwicmVzcG9uc2l2ZUJlaGF2aW9yIiwiRmlsbCIsIm1pbldpZHRoIiwicHJvcGVydGllcyIsImRlcml2ZWQiLCJnZXREZXJpdmVkUHJvcGVydGllc01hcCIsImRlZmF1bHQiLCJnZXREZWZhdWx0UHJvcGVydGllc01hcCIsIm1ldGEiLCJnZXRNZXRhUHJvcGVydGllc01hcCIsImNvbmZpZyIsImdldFByb3BlcnR5UGFuZUNvbmZpZyIsInN0eWxlc2hlZXRDb25maWciLCJnZXRTdHlsZXNoZWV0Q29uZmlnIiwiYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiLCJnZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucyJdLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFsaWdubWVudCB9IGZyb20gXCJAYmx1ZXByaW50anMvY29yZVwiO1xuaW1wb3J0IHsgTGFiZWxQb3NpdGlvbiB9IGZyb20gXCJjb21wb25lbnRzL2NvbnN0YW50c1wiO1xuaW1wb3J0IHsgRklMTF9XSURHRVRfTUlOX1dJRFRIIH0gZnJvbSBcImNvbnN0YW50cy9taW5XaWR0aENvbnN0YW50c1wiO1xuaW1wb3J0IHsgUmVzcG9uc2l2ZUJlaGF2aW9yIH0gZnJvbSBcInV0aWxzL2F1dG9MYXlvdXQvY29uc3RhbnRzXCI7XG5cbmltcG9ydCBJY29uU1ZHIGZyb20gXCIuL2ljb24uc3ZnXCI7XG5pbXBvcnQgV2lkZ2V0IGZyb20gXCIuL3dpZGdldFwiO1xuXG5leHBvcnQgY29uc3QgQ09ORklHID0ge1xuICB0eXBlOiBXaWRnZXQuZ2V0V2lkZ2V0VHlwZSgpLFxuICBuYW1lOiBcIk11bHRpU2VsZWN0XCIsXG4gIGljb25TVkc6IEljb25TVkcsXG4gIG5lZWRzTWV0YTogdHJ1ZSxcbiAgaGlkZUNhcmQ6IHRydWUsXG4gIGlzRGVwcmVjYXRlZDogdHJ1ZSxcbiAgcmVwbGFjZW1lbnQ6IFwiTVVMVElfU0VMRUNUX1dJREdFVF9WMlwiLFxuICBkZWZhdWx0czoge1xuICAgIHJvd3M6IDcsXG4gICAgY29sdW1uczogMjAsXG4gICAgYW5pbWF0ZUxvYWRpbmc6IHRydWUsXG4gICAgbGFiZWxUZXh0OiBcIkxhYmVsXCIsXG4gICAgbGFiZWxQb3NpdGlvbjogTGFiZWxQb3NpdGlvbi5MZWZ0LFxuICAgIGxhYmVsQWxpZ25tZW50OiBBbGlnbm1lbnQuTEVGVCxcbiAgICBsYWJlbFdpZHRoOiA1LFxuICAgIG9wdGlvbnM6IFtcbiAgICAgIHsgbGFiZWw6IFwiQmx1ZVwiLCB2YWx1ZTogXCJCTFVFXCIgfSxcbiAgICAgIHsgbGFiZWw6IFwiR3JlZW5cIiwgdmFsdWU6IFwiR1JFRU5cIiB9LFxuICAgICAgeyBsYWJlbDogXCJSZWRcIiwgdmFsdWU6IFwiUkVEXCIgfSxcbiAgICBdLFxuICAgIHdpZGdldE5hbWU6IFwiTXVsdGlTZWxlY3RcIixcbiAgICBzZXJ2ZXJTaWRlRmlsdGVyaW5nOiBmYWxzZSxcbiAgICBkZWZhdWx0T3B0aW9uVmFsdWU6IFtcIkdSRUVOXCJdLFxuICAgIHZlcnNpb246IDEsXG4gICAgaXNSZXF1aXJlZDogZmFsc2UsXG4gICAgaXNEaXNhYmxlZDogZmFsc2UsXG4gICAgcGxhY2Vob2xkZXJUZXh0OiBcIlNlbGVjdCBvcHRpb24ocylcIixcbiAgICByZXNwb25zaXZlQmVoYXZpb3I6IFJlc3BvbnNpdmVCZWhhdmlvci5GaWxsLFxuICAgIG1pbldpZHRoOiBGSUxMX1dJREdFVF9NSU5fV0lEVEgsXG4gIH0sXG4gIHByb3BlcnRpZXM6IHtcbiAgICBkZXJpdmVkOiBXaWRnZXQuZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAoKSxcbiAgICBkZWZhdWx0OiBXaWRnZXQuZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAoKSxcbiAgICBtZXRhOiBXaWRnZXQuZ2V0TWV0YVByb3BlcnRpZXNNYXAoKSxcbiAgICBjb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVDb25maWcoKSxcbiAgICBzdHlsZXNoZWV0Q29uZmlnOiBXaWRnZXQuZ2V0U3R5bGVzaGVldENvbmZpZygpLFxuICAgIGF1dG9jb21wbGV0ZURlZmluaXRpb25zOiBXaWRnZXQuZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMoKSxcbiAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFdpZGdldDtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxjQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxjQUFBO0FBZlosU0FBU0UsU0FBUyxRQUFRLG1CQUFtQjtBQUM3QyxTQUFTQyxhQUFhLFFBQVEsc0JBQXNCO0FBQ3BELFNBQVNDLHFCQUFxQixRQUFRLDZCQUE2QjtBQUNuRSxTQUFTQyxrQkFBa0IsUUFBUSw0QkFBNEI7QUFFL0QsT0FBT0MsT0FBTyxNQUFNLFlBQVk7QUFDaEMsT0FBT0MsTUFBTSxNQUFNLFVBQVU7QUFFN0IsT0FBTyxNQUFNQyxNQUFNLElBQUFSLGNBQUEsR0FBQVMsQ0FBQSxPQUFHO0VBQ3BCQyxJQUFJLEVBQUVILE1BQU0sQ0FBQ0ksYUFBYSxDQUFDLENBQUM7RUFDNUJDLElBQUksRUFBRSxhQUFhO0VBQ25CQyxPQUFPLEVBQUVQLE9BQU87RUFDaEJRLFNBQVMsRUFBRSxJQUFJO0VBQ2ZDLFFBQVEsRUFBRSxJQUFJO0VBQ2RDLFlBQVksRUFBRSxJQUFJO0VBQ2xCQyxXQUFXLEVBQUUsd0JBQXdCO0VBQ3JDQyxRQUFRLEVBQUU7SUFDUkMsSUFBSSxFQUFFLENBQUM7SUFDUEMsT0FBTyxFQUFFLEVBQUU7SUFDWEMsY0FBYyxFQUFFLElBQUk7SUFDcEJDLFNBQVMsRUFBRSxPQUFPO0lBQ2xCQyxhQUFhLEVBQUVwQixhQUFhLENBQUNxQixJQUFJO0lBQ2pDQyxjQUFjLEVBQUV2QixTQUFTLENBQUN3QixJQUFJO0lBQzlCQyxVQUFVLEVBQUUsQ0FBQztJQUNiQyxPQUFPLEVBQUUsQ0FDUDtNQUFFQyxLQUFLLEVBQUUsTUFBTTtNQUFFQyxLQUFLLEVBQUU7SUFBTyxDQUFDLEVBQ2hDO01BQUVELEtBQUssRUFBRSxPQUFPO01BQUVDLEtBQUssRUFBRTtJQUFRLENBQUMsRUFDbEM7TUFBRUQsS0FBSyxFQUFFLEtBQUs7TUFBRUMsS0FBSyxFQUFFO0lBQU0sQ0FBQyxDQUMvQjtJQUNEQyxVQUFVLEVBQUUsYUFBYTtJQUN6QkMsbUJBQW1CLEVBQUUsS0FBSztJQUMxQkMsa0JBQWtCLEVBQUUsQ0FBQyxPQUFPLENBQUM7SUFDN0JDLE9BQU8sRUFBRSxDQUFDO0lBQ1ZDLFVBQVUsRUFBRSxLQUFLO0lBQ2pCQyxVQUFVLEVBQUUsS0FBSztJQUNqQkMsZUFBZSxFQUFFLGtCQUFrQjtJQUNuQ0Msa0JBQWtCLEVBQUVqQyxrQkFBa0IsQ0FBQ2tDLElBQUk7SUFDM0NDLFFBQVEsRUFBRXBDO0VBQ1osQ0FBQztFQUNEcUMsVUFBVSxFQUFFO0lBQ1ZDLE9BQU8sRUFBRW5DLE1BQU0sQ0FBQ29DLHVCQUF1QixDQUFDLENBQUM7SUFDekNDLE9BQU8sRUFBRXJDLE1BQU0sQ0FBQ3NDLHVCQUF1QixDQUFDLENBQUM7SUFDekNDLElBQUksRUFBRXZDLE1BQU0sQ0FBQ3dDLG9CQUFvQixDQUFDLENBQUM7SUFDbkNDLE1BQU0sRUFBRXpDLE1BQU0sQ0FBQzBDLHFCQUFxQixDQUFDLENBQUM7SUFDdENDLGdCQUFnQixFQUFFM0MsTUFBTSxDQUFDNEMsbUJBQW1CLENBQUMsQ0FBQztJQUM5Q0MsdUJBQXVCLEVBQUU3QyxNQUFNLENBQUM4QywwQkFBMEIsQ0FBQztFQUM3RDtBQUNGLENBQUM7QUFFRCxlQUFlOUMsTUFBTSJ9