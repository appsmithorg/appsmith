function cov_2ab3uceqkd() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/FormButtonWidget/index.ts";
  var hash = "317d3b1026cd3d087054d1aca70018bd6a21f058";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/FormButtonWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 5,
          column: 22
        },
        end: {
          line: 31,
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
    hash: "317d3b1026cd3d087054d1aca70018bd6a21f058"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_2ab3uceqkd = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_2ab3uceqkd();
import { RecaptchaTypes } from "components/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_2ab3uceqkd().s[0]++, {
  type: Widget.getWidgetType(),
  name: "FormButton",
  iconSVG: IconSVG,
  hideCard: true,
  isDeprecated: true,
  replacement: "BUTTON_WIDGET",
  needsMeta: true,
  defaults: {
    rows: 4,
    columns: 12,
    widgetName: "FormButton",
    text: "Submit",
    isDefaultClickDisabled: true,
    recaptchaType: RecaptchaTypes.V3,
    version: 1,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMmFiM3VjZXFrZCIsImFjdHVhbENvdmVyYWdlIiwiUmVjYXB0Y2hhVHlwZXMiLCJJY29uU1ZHIiwiV2lkZ2V0IiwiQ09ORklHIiwicyIsInR5cGUiLCJnZXRXaWRnZXRUeXBlIiwibmFtZSIsImljb25TVkciLCJoaWRlQ2FyZCIsImlzRGVwcmVjYXRlZCIsInJlcGxhY2VtZW50IiwibmVlZHNNZXRhIiwiZGVmYXVsdHMiLCJyb3dzIiwiY29sdW1ucyIsIndpZGdldE5hbWUiLCJ0ZXh0IiwiaXNEZWZhdWx0Q2xpY2tEaXNhYmxlZCIsInJlY2FwdGNoYVR5cGUiLCJWMyIsInZlcnNpb24iLCJhbmltYXRlTG9hZGluZyIsInByb3BlcnRpZXMiLCJkZXJpdmVkIiwiZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAiLCJkZWZhdWx0IiwiZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAiLCJtZXRhIiwiZ2V0TWV0YVByb3BlcnRpZXNNYXAiLCJjb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb25maWciLCJzdHlsZXNoZWV0Q29uZmlnIiwiZ2V0U3R5bGVzaGVldENvbmZpZyIsImF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiXSwic291cmNlcyI6WyJpbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBSZWNhcHRjaGFUeXBlcyB9IGZyb20gXCJjb21wb25lbnRzL2NvbnN0YW50c1wiO1xuaW1wb3J0IEljb25TVkcgZnJvbSBcIi4vaWNvbi5zdmdcIjtcbmltcG9ydCBXaWRnZXQgZnJvbSBcIi4vd2lkZ2V0XCI7XG5cbmV4cG9ydCBjb25zdCBDT05GSUcgPSB7XG4gIHR5cGU6IFdpZGdldC5nZXRXaWRnZXRUeXBlKCksXG4gIG5hbWU6IFwiRm9ybUJ1dHRvblwiLFxuICBpY29uU1ZHOiBJY29uU1ZHLFxuICBoaWRlQ2FyZDogdHJ1ZSxcbiAgaXNEZXByZWNhdGVkOiB0cnVlLFxuICByZXBsYWNlbWVudDogXCJCVVRUT05fV0lER0VUXCIsXG4gIG5lZWRzTWV0YTogdHJ1ZSxcbiAgZGVmYXVsdHM6IHtcbiAgICByb3dzOiA0LFxuICAgIGNvbHVtbnM6IDEyLFxuICAgIHdpZGdldE5hbWU6IFwiRm9ybUJ1dHRvblwiLFxuICAgIHRleHQ6IFwiU3VibWl0XCIsXG4gICAgaXNEZWZhdWx0Q2xpY2tEaXNhYmxlZDogdHJ1ZSxcbiAgICByZWNhcHRjaGFUeXBlOiBSZWNhcHRjaGFUeXBlcy5WMyxcbiAgICB2ZXJzaW9uOiAxLFxuICAgIGFuaW1hdGVMb2FkaW5nOiB0cnVlLFxuICB9LFxuICBwcm9wZXJ0aWVzOiB7XG4gICAgZGVyaXZlZDogV2lkZ2V0LmdldERlcml2ZWRQcm9wZXJ0aWVzTWFwKCksXG4gICAgZGVmYXVsdDogV2lkZ2V0LmdldERlZmF1bHRQcm9wZXJ0aWVzTWFwKCksXG4gICAgbWV0YTogV2lkZ2V0LmdldE1ldGFQcm9wZXJ0aWVzTWFwKCksXG4gICAgY29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lQ29uZmlnKCksXG4gICAgc3R5bGVzaGVldENvbmZpZzogV2lkZ2V0LmdldFN0eWxlc2hlZXRDb25maWcoKSxcbiAgICBhdXRvY29tcGxldGVEZWZpbml0aW9uczogV2lkZ2V0LmdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zKCksXG4gIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBXaWRnZXQ7XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsY0FBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsY0FBQTtBQWZaLFNBQVNFLGNBQWMsUUFBUSxzQkFBc0I7QUFDckQsT0FBT0MsT0FBTyxNQUFNLFlBQVk7QUFDaEMsT0FBT0MsTUFBTSxNQUFNLFVBQVU7QUFFN0IsT0FBTyxNQUFNQyxNQUFNLElBQUFMLGNBQUEsR0FBQU0sQ0FBQSxPQUFHO0VBQ3BCQyxJQUFJLEVBQUVILE1BQU0sQ0FBQ0ksYUFBYSxDQUFDLENBQUM7RUFDNUJDLElBQUksRUFBRSxZQUFZO0VBQ2xCQyxPQUFPLEVBQUVQLE9BQU87RUFDaEJRLFFBQVEsRUFBRSxJQUFJO0VBQ2RDLFlBQVksRUFBRSxJQUFJO0VBQ2xCQyxXQUFXLEVBQUUsZUFBZTtFQUM1QkMsU0FBUyxFQUFFLElBQUk7RUFDZkMsUUFBUSxFQUFFO0lBQ1JDLElBQUksRUFBRSxDQUFDO0lBQ1BDLE9BQU8sRUFBRSxFQUFFO0lBQ1hDLFVBQVUsRUFBRSxZQUFZO0lBQ3hCQyxJQUFJLEVBQUUsUUFBUTtJQUNkQyxzQkFBc0IsRUFBRSxJQUFJO0lBQzVCQyxhQUFhLEVBQUVuQixjQUFjLENBQUNvQixFQUFFO0lBQ2hDQyxPQUFPLEVBQUUsQ0FBQztJQUNWQyxjQUFjLEVBQUU7RUFDbEIsQ0FBQztFQUNEQyxVQUFVLEVBQUU7SUFDVkMsT0FBTyxFQUFFdEIsTUFBTSxDQUFDdUIsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsT0FBTyxFQUFFeEIsTUFBTSxDQUFDeUIsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsSUFBSSxFQUFFMUIsTUFBTSxDQUFDMkIsb0JBQW9CLENBQUMsQ0FBQztJQUNuQ0MsTUFBTSxFQUFFNUIsTUFBTSxDQUFDNkIscUJBQXFCLENBQUMsQ0FBQztJQUN0Q0MsZ0JBQWdCLEVBQUU5QixNQUFNLENBQUMrQixtQkFBbUIsQ0FBQyxDQUFDO0lBQzlDQyx1QkFBdUIsRUFBRWhDLE1BQU0sQ0FBQ2lDLDBCQUEwQixDQUFDO0VBQzdEO0FBQ0YsQ0FBQztBQUVELGVBQWVqQyxNQUFNIn0=