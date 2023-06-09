function cov_2ilbja966r() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/DropdownWidget/index.ts";
  var hash = "c298ed68708505a87867c5860a1ee676c74eb18a";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/DropdownWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 6,
          column: 22
        },
        end: {
          line: 45,
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
    hash: "c298ed68708505a87867c5860a1ee676c74eb18a"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_2ilbja966r = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_2ilbja966r();
import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_2ilbja966r().s[0]++, {
  type: Widget.getWidgetType(),
  name: "Select",
  iconSVG: IconSVG,
  needsMeta: true,
  hideCard: true,
  isDeprecated: true,
  replacement: "SELECT_WIDGET",
  defaults: {
    rows: 7,
    columns: 20,
    placeholderText: "Select option",
    labelText: "Label",
    labelPosition: LabelPosition.Left,
    labelAlignment: Alignment.LEFT,
    labelWidth: 5,
    selectionType: "SINGLE_SELECT",
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
    serverSideFiltering: false,
    widgetName: "Select",
    defaultOptionValue: "GREEN",
    version: 1,
    isFilterable: false,
    isRequired: false,
    isDisabled: false,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMmlsYmphOTY2ciIsImFjdHVhbENvdmVyYWdlIiwiQWxpZ25tZW50IiwiTGFiZWxQb3NpdGlvbiIsIkljb25TVkciLCJXaWRnZXQiLCJDT05GSUciLCJzIiwidHlwZSIsImdldFdpZGdldFR5cGUiLCJuYW1lIiwiaWNvblNWRyIsIm5lZWRzTWV0YSIsImhpZGVDYXJkIiwiaXNEZXByZWNhdGVkIiwicmVwbGFjZW1lbnQiLCJkZWZhdWx0cyIsInJvd3MiLCJjb2x1bW5zIiwicGxhY2Vob2xkZXJUZXh0IiwibGFiZWxUZXh0IiwibGFiZWxQb3NpdGlvbiIsIkxlZnQiLCJsYWJlbEFsaWdubWVudCIsIkxFRlQiLCJsYWJlbFdpZHRoIiwic2VsZWN0aW9uVHlwZSIsIm9wdGlvbnMiLCJsYWJlbCIsInZhbHVlIiwic2VydmVyU2lkZUZpbHRlcmluZyIsIndpZGdldE5hbWUiLCJkZWZhdWx0T3B0aW9uVmFsdWUiLCJ2ZXJzaW9uIiwiaXNGaWx0ZXJhYmxlIiwiaXNSZXF1aXJlZCIsImlzRGlzYWJsZWQiLCJhbmltYXRlTG9hZGluZyIsInByb3BlcnRpZXMiLCJkZXJpdmVkIiwiZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAiLCJkZWZhdWx0IiwiZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAiLCJtZXRhIiwiZ2V0TWV0YVByb3BlcnRpZXNNYXAiLCJjb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb25maWciLCJzdHlsZXNoZWV0Q29uZmlnIiwiZ2V0U3R5bGVzaGVldENvbmZpZyIsImF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiXSwic291cmNlcyI6WyJpbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBbGlnbm1lbnQgfSBmcm9tIFwiQGJsdWVwcmludGpzL2NvcmVcIjtcbmltcG9ydCB7IExhYmVsUG9zaXRpb24gfSBmcm9tIFwiY29tcG9uZW50cy9jb25zdGFudHNcIjtcbmltcG9ydCBJY29uU1ZHIGZyb20gXCIuL2ljb24uc3ZnXCI7XG5pbXBvcnQgV2lkZ2V0IGZyb20gXCIuL3dpZGdldFwiO1xuXG5leHBvcnQgY29uc3QgQ09ORklHID0ge1xuICB0eXBlOiBXaWRnZXQuZ2V0V2lkZ2V0VHlwZSgpLFxuICBuYW1lOiBcIlNlbGVjdFwiLFxuICBpY29uU1ZHOiBJY29uU1ZHLFxuICBuZWVkc01ldGE6IHRydWUsXG4gIGhpZGVDYXJkOiB0cnVlLFxuICBpc0RlcHJlY2F0ZWQ6IHRydWUsXG4gIHJlcGxhY2VtZW50OiBcIlNFTEVDVF9XSURHRVRcIixcbiAgZGVmYXVsdHM6IHtcbiAgICByb3dzOiA3LFxuICAgIGNvbHVtbnM6IDIwLFxuICAgIHBsYWNlaG9sZGVyVGV4dDogXCJTZWxlY3Qgb3B0aW9uXCIsXG4gICAgbGFiZWxUZXh0OiBcIkxhYmVsXCIsXG4gICAgbGFiZWxQb3NpdGlvbjogTGFiZWxQb3NpdGlvbi5MZWZ0LFxuICAgIGxhYmVsQWxpZ25tZW50OiBBbGlnbm1lbnQuTEVGVCxcbiAgICBsYWJlbFdpZHRoOiA1LFxuICAgIHNlbGVjdGlvblR5cGU6IFwiU0lOR0xFX1NFTEVDVFwiLFxuICAgIG9wdGlvbnM6IFtcbiAgICAgIHsgbGFiZWw6IFwiQmx1ZVwiLCB2YWx1ZTogXCJCTFVFXCIgfSxcbiAgICAgIHsgbGFiZWw6IFwiR3JlZW5cIiwgdmFsdWU6IFwiR1JFRU5cIiB9LFxuICAgICAgeyBsYWJlbDogXCJSZWRcIiwgdmFsdWU6IFwiUkVEXCIgfSxcbiAgICBdLFxuICAgIHNlcnZlclNpZGVGaWx0ZXJpbmc6IGZhbHNlLFxuICAgIHdpZGdldE5hbWU6IFwiU2VsZWN0XCIsXG4gICAgZGVmYXVsdE9wdGlvblZhbHVlOiBcIkdSRUVOXCIsXG4gICAgdmVyc2lvbjogMSxcbiAgICBpc0ZpbHRlcmFibGU6IGZhbHNlLFxuICAgIGlzUmVxdWlyZWQ6IGZhbHNlLFxuICAgIGlzRGlzYWJsZWQ6IGZhbHNlLFxuICAgIGFuaW1hdGVMb2FkaW5nOiB0cnVlLFxuICB9LFxuICBwcm9wZXJ0aWVzOiB7XG4gICAgZGVyaXZlZDogV2lkZ2V0LmdldERlcml2ZWRQcm9wZXJ0aWVzTWFwKCksXG4gICAgZGVmYXVsdDogV2lkZ2V0LmdldERlZmF1bHRQcm9wZXJ0aWVzTWFwKCksXG4gICAgbWV0YTogV2lkZ2V0LmdldE1ldGFQcm9wZXJ0aWVzTWFwKCksXG4gICAgY29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lQ29uZmlnKCksXG4gICAgc3R5bGVzaGVldENvbmZpZzogV2lkZ2V0LmdldFN0eWxlc2hlZXRDb25maWcoKSxcbiAgICBhdXRvY29tcGxldGVEZWZpbml0aW9uczogV2lkZ2V0LmdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zKCksXG4gIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBXaWRnZXQ7XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsY0FBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsY0FBQTtBQWZaLFNBQVNFLFNBQVMsUUFBUSxtQkFBbUI7QUFDN0MsU0FBU0MsYUFBYSxRQUFRLHNCQUFzQjtBQUNwRCxPQUFPQyxPQUFPLE1BQU0sWUFBWTtBQUNoQyxPQUFPQyxNQUFNLE1BQU0sVUFBVTtBQUU3QixPQUFPLE1BQU1DLE1BQU0sSUFBQU4sY0FBQSxHQUFBTyxDQUFBLE9BQUc7RUFDcEJDLElBQUksRUFBRUgsTUFBTSxDQUFDSSxhQUFhLENBQUMsQ0FBQztFQUM1QkMsSUFBSSxFQUFFLFFBQVE7RUFDZEMsT0FBTyxFQUFFUCxPQUFPO0VBQ2hCUSxTQUFTLEVBQUUsSUFBSTtFQUNmQyxRQUFRLEVBQUUsSUFBSTtFQUNkQyxZQUFZLEVBQUUsSUFBSTtFQUNsQkMsV0FBVyxFQUFFLGVBQWU7RUFDNUJDLFFBQVEsRUFBRTtJQUNSQyxJQUFJLEVBQUUsQ0FBQztJQUNQQyxPQUFPLEVBQUUsRUFBRTtJQUNYQyxlQUFlLEVBQUUsZUFBZTtJQUNoQ0MsU0FBUyxFQUFFLE9BQU87SUFDbEJDLGFBQWEsRUFBRWxCLGFBQWEsQ0FBQ21CLElBQUk7SUFDakNDLGNBQWMsRUFBRXJCLFNBQVMsQ0FBQ3NCLElBQUk7SUFDOUJDLFVBQVUsRUFBRSxDQUFDO0lBQ2JDLGFBQWEsRUFBRSxlQUFlO0lBQzlCQyxPQUFPLEVBQUUsQ0FDUDtNQUFFQyxLQUFLLEVBQUUsTUFBTTtNQUFFQyxLQUFLLEVBQUU7SUFBTyxDQUFDLEVBQ2hDO01BQUVELEtBQUssRUFBRSxPQUFPO01BQUVDLEtBQUssRUFBRTtJQUFRLENBQUMsRUFDbEM7TUFBRUQsS0FBSyxFQUFFLEtBQUs7TUFBRUMsS0FBSyxFQUFFO0lBQU0sQ0FBQyxDQUMvQjtJQUNEQyxtQkFBbUIsRUFBRSxLQUFLO0lBQzFCQyxVQUFVLEVBQUUsUUFBUTtJQUNwQkMsa0JBQWtCLEVBQUUsT0FBTztJQUMzQkMsT0FBTyxFQUFFLENBQUM7SUFDVkMsWUFBWSxFQUFFLEtBQUs7SUFDbkJDLFVBQVUsRUFBRSxLQUFLO0lBQ2pCQyxVQUFVLEVBQUUsS0FBSztJQUNqQkMsY0FBYyxFQUFFO0VBQ2xCLENBQUM7RUFDREMsVUFBVSxFQUFFO0lBQ1ZDLE9BQU8sRUFBRWxDLE1BQU0sQ0FBQ21DLHVCQUF1QixDQUFDLENBQUM7SUFDekNDLE9BQU8sRUFBRXBDLE1BQU0sQ0FBQ3FDLHVCQUF1QixDQUFDLENBQUM7SUFDekNDLElBQUksRUFBRXRDLE1BQU0sQ0FBQ3VDLG9CQUFvQixDQUFDLENBQUM7SUFDbkNDLE1BQU0sRUFBRXhDLE1BQU0sQ0FBQ3lDLHFCQUFxQixDQUFDLENBQUM7SUFDdENDLGdCQUFnQixFQUFFMUMsTUFBTSxDQUFDMkMsbUJBQW1CLENBQUMsQ0FBQztJQUM5Q0MsdUJBQXVCLEVBQUU1QyxNQUFNLENBQUM2QywwQkFBMEIsQ0FBQztFQUM3RDtBQUNGLENBQUM7QUFFRCxlQUFlN0MsTUFBTSJ9