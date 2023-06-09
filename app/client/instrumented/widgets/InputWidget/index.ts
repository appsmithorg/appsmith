function cov_2apj2cqaay() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/InputWidget/index.ts";
  var hash = "4ac6ce61aebdfdbe17da4d49bf4717c58772eae6";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/InputWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 6,
          column: 22
        },
        end: {
          line: 42,
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
    hash: "4ac6ce61aebdfdbe17da4d49bf4717c58772eae6"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_2apj2cqaay = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_2apj2cqaay();
import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_2apj2cqaay().s[0]++, {
  type: Widget.getWidgetType(),
  name: "Input",
  iconSVG: IconSVG,
  needsMeta: true,
  hideCard: true,
  isDeprecated: true,
  replacement: "INPUT_WIDGET_V2",
  defaults: {
    inputType: "TEXT",
    rows: 4,
    label: "",
    labelPosition: LabelPosition.Left,
    labelAlignment: Alignment.LEFT,
    labelWidth: 5,
    columns: 20,
    widgetName: "Input",
    version: 1,
    defaultText: "",
    iconAlign: "left",
    autoFocus: false,
    labelStyle: "",
    resetOnSubmit: true,
    isRequired: false,
    isDisabled: false,
    allowCurrencyChange: false,
    animateLoading: true
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMmFwajJjcWFheSIsImFjdHVhbENvdmVyYWdlIiwiQWxpZ25tZW50IiwiTGFiZWxQb3NpdGlvbiIsIkljb25TVkciLCJXaWRnZXQiLCJDT05GSUciLCJzIiwidHlwZSIsImdldFdpZGdldFR5cGUiLCJuYW1lIiwiaWNvblNWRyIsIm5lZWRzTWV0YSIsImhpZGVDYXJkIiwiaXNEZXByZWNhdGVkIiwicmVwbGFjZW1lbnQiLCJkZWZhdWx0cyIsImlucHV0VHlwZSIsInJvd3MiLCJsYWJlbCIsImxhYmVsUG9zaXRpb24iLCJMZWZ0IiwibGFiZWxBbGlnbm1lbnQiLCJMRUZUIiwibGFiZWxXaWR0aCIsImNvbHVtbnMiLCJ3aWRnZXROYW1lIiwidmVyc2lvbiIsImRlZmF1bHRUZXh0IiwiaWNvbkFsaWduIiwiYXV0b0ZvY3VzIiwibGFiZWxTdHlsZSIsInJlc2V0T25TdWJtaXQiLCJpc1JlcXVpcmVkIiwiaXNEaXNhYmxlZCIsImFsbG93Q3VycmVuY3lDaGFuZ2UiLCJhbmltYXRlTG9hZGluZyIsInByb3BlcnRpZXMiLCJkZXJpdmVkIiwiZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAiLCJkZWZhdWx0IiwiZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAiLCJtZXRhIiwiZ2V0TWV0YVByb3BlcnRpZXNNYXAiLCJjb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb25maWciLCJzdHlsZXNoZWV0Q29uZmlnIiwiZ2V0U3R5bGVzaGVldENvbmZpZyIsImF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiXSwic291cmNlcyI6WyJpbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBbGlnbm1lbnQgfSBmcm9tIFwiQGJsdWVwcmludGpzL2NvcmVcIjtcbmltcG9ydCB7IExhYmVsUG9zaXRpb24gfSBmcm9tIFwiY29tcG9uZW50cy9jb25zdGFudHNcIjtcbmltcG9ydCBJY29uU1ZHIGZyb20gXCIuL2ljb24uc3ZnXCI7XG5pbXBvcnQgV2lkZ2V0IGZyb20gXCIuL3dpZGdldFwiO1xuXG5leHBvcnQgY29uc3QgQ09ORklHID0ge1xuICB0eXBlOiBXaWRnZXQuZ2V0V2lkZ2V0VHlwZSgpLFxuICBuYW1lOiBcIklucHV0XCIsXG4gIGljb25TVkc6IEljb25TVkcsXG4gIG5lZWRzTWV0YTogdHJ1ZSxcbiAgaGlkZUNhcmQ6IHRydWUsXG4gIGlzRGVwcmVjYXRlZDogdHJ1ZSxcbiAgcmVwbGFjZW1lbnQ6IFwiSU5QVVRfV0lER0VUX1YyXCIsXG4gIGRlZmF1bHRzOiB7XG4gICAgaW5wdXRUeXBlOiBcIlRFWFRcIixcbiAgICByb3dzOiA0LFxuICAgIGxhYmVsOiBcIlwiLFxuICAgIGxhYmVsUG9zaXRpb246IExhYmVsUG9zaXRpb24uTGVmdCxcbiAgICBsYWJlbEFsaWdubWVudDogQWxpZ25tZW50LkxFRlQsXG4gICAgbGFiZWxXaWR0aDogNSxcbiAgICBjb2x1bW5zOiAyMCxcbiAgICB3aWRnZXROYW1lOiBcIklucHV0XCIsXG4gICAgdmVyc2lvbjogMSxcbiAgICBkZWZhdWx0VGV4dDogXCJcIixcbiAgICBpY29uQWxpZ246IFwibGVmdFwiLFxuICAgIGF1dG9Gb2N1czogZmFsc2UsXG4gICAgbGFiZWxTdHlsZTogXCJcIixcbiAgICByZXNldE9uU3VibWl0OiB0cnVlLFxuICAgIGlzUmVxdWlyZWQ6IGZhbHNlLFxuICAgIGlzRGlzYWJsZWQ6IGZhbHNlLFxuICAgIGFsbG93Q3VycmVuY3lDaGFuZ2U6IGZhbHNlLFxuICAgIGFuaW1hdGVMb2FkaW5nOiB0cnVlLFxuICB9LFxuICBwcm9wZXJ0aWVzOiB7XG4gICAgZGVyaXZlZDogV2lkZ2V0LmdldERlcml2ZWRQcm9wZXJ0aWVzTWFwKCksXG4gICAgZGVmYXVsdDogV2lkZ2V0LmdldERlZmF1bHRQcm9wZXJ0aWVzTWFwKCksXG4gICAgbWV0YTogV2lkZ2V0LmdldE1ldGFQcm9wZXJ0aWVzTWFwKCksXG4gICAgY29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lQ29uZmlnKCksXG4gICAgc3R5bGVzaGVldENvbmZpZzogV2lkZ2V0LmdldFN0eWxlc2hlZXRDb25maWcoKSxcbiAgICBhdXRvY29tcGxldGVEZWZpbml0aW9uczogV2lkZ2V0LmdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zKCksXG4gIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBXaWRnZXQ7XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsY0FBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsY0FBQTtBQWZaLFNBQVNFLFNBQVMsUUFBUSxtQkFBbUI7QUFDN0MsU0FBU0MsYUFBYSxRQUFRLHNCQUFzQjtBQUNwRCxPQUFPQyxPQUFPLE1BQU0sWUFBWTtBQUNoQyxPQUFPQyxNQUFNLE1BQU0sVUFBVTtBQUU3QixPQUFPLE1BQU1DLE1BQU0sSUFBQU4sY0FBQSxHQUFBTyxDQUFBLE9BQUc7RUFDcEJDLElBQUksRUFBRUgsTUFBTSxDQUFDSSxhQUFhLENBQUMsQ0FBQztFQUM1QkMsSUFBSSxFQUFFLE9BQU87RUFDYkMsT0FBTyxFQUFFUCxPQUFPO0VBQ2hCUSxTQUFTLEVBQUUsSUFBSTtFQUNmQyxRQUFRLEVBQUUsSUFBSTtFQUNkQyxZQUFZLEVBQUUsSUFBSTtFQUNsQkMsV0FBVyxFQUFFLGlCQUFpQjtFQUM5QkMsUUFBUSxFQUFFO0lBQ1JDLFNBQVMsRUFBRSxNQUFNO0lBQ2pCQyxJQUFJLEVBQUUsQ0FBQztJQUNQQyxLQUFLLEVBQUUsRUFBRTtJQUNUQyxhQUFhLEVBQUVqQixhQUFhLENBQUNrQixJQUFJO0lBQ2pDQyxjQUFjLEVBQUVwQixTQUFTLENBQUNxQixJQUFJO0lBQzlCQyxVQUFVLEVBQUUsQ0FBQztJQUNiQyxPQUFPLEVBQUUsRUFBRTtJQUNYQyxVQUFVLEVBQUUsT0FBTztJQUNuQkMsT0FBTyxFQUFFLENBQUM7SUFDVkMsV0FBVyxFQUFFLEVBQUU7SUFDZkMsU0FBUyxFQUFFLE1BQU07SUFDakJDLFNBQVMsRUFBRSxLQUFLO0lBQ2hCQyxVQUFVLEVBQUUsRUFBRTtJQUNkQyxhQUFhLEVBQUUsSUFBSTtJQUNuQkMsVUFBVSxFQUFFLEtBQUs7SUFDakJDLFVBQVUsRUFBRSxLQUFLO0lBQ2pCQyxtQkFBbUIsRUFBRSxLQUFLO0lBQzFCQyxjQUFjLEVBQUU7RUFDbEIsQ0FBQztFQUNEQyxVQUFVLEVBQUU7SUFDVkMsT0FBTyxFQUFFakMsTUFBTSxDQUFDa0MsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsT0FBTyxFQUFFbkMsTUFBTSxDQUFDb0MsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsSUFBSSxFQUFFckMsTUFBTSxDQUFDc0Msb0JBQW9CLENBQUMsQ0FBQztJQUNuQ0MsTUFBTSxFQUFFdkMsTUFBTSxDQUFDd0MscUJBQXFCLENBQUMsQ0FBQztJQUN0Q0MsZ0JBQWdCLEVBQUV6QyxNQUFNLENBQUMwQyxtQkFBbUIsQ0FBQyxDQUFDO0lBQzlDQyx1QkFBdUIsRUFBRTNDLE1BQU0sQ0FBQzRDLDBCQUEwQixDQUFDO0VBQzdEO0FBQ0YsQ0FBQztBQUVELGVBQWU1QyxNQUFNIn0=