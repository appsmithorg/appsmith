function cov_2rm0c166py() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/DatePickerWidget/index.ts";
  var hash = "47861306a344fbe4a01f98b57b2452fa4fe8867b";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/DatePickerWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 5,
          column: 22
        },
        end: {
          line: 32,
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
    hash: "47861306a344fbe4a01f98b57b2452fa4fe8867b"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_2rm0c166py = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_2rm0c166py();
import moment from "moment";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_2rm0c166py().s[0]++, {
  type: Widget.getWidgetType(),
  name: "DatePicker",
  iconSVG: IconSVG,
  hideCard: true,
  isDeprecated: true,
  replacement: "DATE_PICKER_WIDGET2",
  needsMeta: true,
  defaults: {
    isDisabled: false,
    datePickerType: "DATE_PICKER",
    rows: 4,
    label: "",
    dateFormat: "YYYY-MM-DD HH:mm",
    columns: 20,
    widgetName: "DatePicker",
    defaultDate: moment().format("YYYY-MM-DD HH:mm"),
    version: 1,
    animateLoading: true
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    autocompleteDefinitions: Widget.getAutocompleteDefinitions()
  }
});
export default Widget;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMnJtMGMxNjZweSIsImFjdHVhbENvdmVyYWdlIiwibW9tZW50IiwiSWNvblNWRyIsIldpZGdldCIsIkNPTkZJRyIsInMiLCJ0eXBlIiwiZ2V0V2lkZ2V0VHlwZSIsIm5hbWUiLCJpY29uU1ZHIiwiaGlkZUNhcmQiLCJpc0RlcHJlY2F0ZWQiLCJyZXBsYWNlbWVudCIsIm5lZWRzTWV0YSIsImRlZmF1bHRzIiwiaXNEaXNhYmxlZCIsImRhdGVQaWNrZXJUeXBlIiwicm93cyIsImxhYmVsIiwiZGF0ZUZvcm1hdCIsImNvbHVtbnMiLCJ3aWRnZXROYW1lIiwiZGVmYXVsdERhdGUiLCJmb3JtYXQiLCJ2ZXJzaW9uIiwiYW5pbWF0ZUxvYWRpbmciLCJwcm9wZXJ0aWVzIiwiZGVyaXZlZCIsImdldERlcml2ZWRQcm9wZXJ0aWVzTWFwIiwiZGVmYXVsdCIsImdldERlZmF1bHRQcm9wZXJ0aWVzTWFwIiwibWV0YSIsImdldE1ldGFQcm9wZXJ0aWVzTWFwIiwiY29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lQ29uZmlnIiwiYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiLCJnZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucyJdLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBtb21lbnQgZnJvbSBcIm1vbWVudFwiO1xuaW1wb3J0IEljb25TVkcgZnJvbSBcIi4vaWNvbi5zdmdcIjtcbmltcG9ydCBXaWRnZXQgZnJvbSBcIi4vd2lkZ2V0XCI7XG5cbmV4cG9ydCBjb25zdCBDT05GSUcgPSB7XG4gIHR5cGU6IFdpZGdldC5nZXRXaWRnZXRUeXBlKCksXG4gIG5hbWU6IFwiRGF0ZVBpY2tlclwiLFxuICBpY29uU1ZHOiBJY29uU1ZHLFxuICBoaWRlQ2FyZDogdHJ1ZSxcbiAgaXNEZXByZWNhdGVkOiB0cnVlLFxuICByZXBsYWNlbWVudDogXCJEQVRFX1BJQ0tFUl9XSURHRVQyXCIsXG4gIG5lZWRzTWV0YTogdHJ1ZSxcbiAgZGVmYXVsdHM6IHtcbiAgICBpc0Rpc2FibGVkOiBmYWxzZSxcbiAgICBkYXRlUGlja2VyVHlwZTogXCJEQVRFX1BJQ0tFUlwiLFxuICAgIHJvd3M6IDQsXG4gICAgbGFiZWw6IFwiXCIsXG4gICAgZGF0ZUZvcm1hdDogXCJZWVlZLU1NLUREIEhIOm1tXCIsXG4gICAgY29sdW1uczogMjAsXG4gICAgd2lkZ2V0TmFtZTogXCJEYXRlUGlja2VyXCIsXG4gICAgZGVmYXVsdERhdGU6IG1vbWVudCgpLmZvcm1hdChcIllZWVktTU0tREQgSEg6bW1cIiksXG4gICAgdmVyc2lvbjogMSxcbiAgICBhbmltYXRlTG9hZGluZzogdHJ1ZSxcbiAgfSxcbiAgcHJvcGVydGllczoge1xuICAgIGRlcml2ZWQ6IFdpZGdldC5nZXREZXJpdmVkUHJvcGVydGllc01hcCgpLFxuICAgIGRlZmF1bHQ6IFdpZGdldC5nZXREZWZhdWx0UHJvcGVydGllc01hcCgpLFxuICAgIG1ldGE6IFdpZGdldC5nZXRNZXRhUHJvcGVydGllc01hcCgpLFxuICAgIGNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbmZpZygpLFxuICAgIGF1dG9jb21wbGV0ZURlZmluaXRpb25zOiBXaWRnZXQuZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMoKSxcbiAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFdpZGdldDtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxjQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxjQUFBO0FBZlosT0FBT0UsTUFBTSxNQUFNLFFBQVE7QUFDM0IsT0FBT0MsT0FBTyxNQUFNLFlBQVk7QUFDaEMsT0FBT0MsTUFBTSxNQUFNLFVBQVU7QUFFN0IsT0FBTyxNQUFNQyxNQUFNLElBQUFMLGNBQUEsR0FBQU0sQ0FBQSxPQUFHO0VBQ3BCQyxJQUFJLEVBQUVILE1BQU0sQ0FBQ0ksYUFBYSxDQUFDLENBQUM7RUFDNUJDLElBQUksRUFBRSxZQUFZO0VBQ2xCQyxPQUFPLEVBQUVQLE9BQU87RUFDaEJRLFFBQVEsRUFBRSxJQUFJO0VBQ2RDLFlBQVksRUFBRSxJQUFJO0VBQ2xCQyxXQUFXLEVBQUUscUJBQXFCO0VBQ2xDQyxTQUFTLEVBQUUsSUFBSTtFQUNmQyxRQUFRLEVBQUU7SUFDUkMsVUFBVSxFQUFFLEtBQUs7SUFDakJDLGNBQWMsRUFBRSxhQUFhO0lBQzdCQyxJQUFJLEVBQUUsQ0FBQztJQUNQQyxLQUFLLEVBQUUsRUFBRTtJQUNUQyxVQUFVLEVBQUUsa0JBQWtCO0lBQzlCQyxPQUFPLEVBQUUsRUFBRTtJQUNYQyxVQUFVLEVBQUUsWUFBWTtJQUN4QkMsV0FBVyxFQUFFckIsTUFBTSxDQUFDLENBQUMsQ0FBQ3NCLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQztJQUNoREMsT0FBTyxFQUFFLENBQUM7SUFDVkMsY0FBYyxFQUFFO0VBQ2xCLENBQUM7RUFDREMsVUFBVSxFQUFFO0lBQ1ZDLE9BQU8sRUFBRXhCLE1BQU0sQ0FBQ3lCLHVCQUF1QixDQUFDLENBQUM7SUFDekNDLE9BQU8sRUFBRTFCLE1BQU0sQ0FBQzJCLHVCQUF1QixDQUFDLENBQUM7SUFDekNDLElBQUksRUFBRTVCLE1BQU0sQ0FBQzZCLG9CQUFvQixDQUFDLENBQUM7SUFDbkNDLE1BQU0sRUFBRTlCLE1BQU0sQ0FBQytCLHFCQUFxQixDQUFDLENBQUM7SUFDdENDLHVCQUF1QixFQUFFaEMsTUFBTSxDQUFDaUMsMEJBQTBCLENBQUM7RUFDN0Q7QUFDRixDQUFDO0FBRUQsZUFBZWpDLE1BQU0ifQ==