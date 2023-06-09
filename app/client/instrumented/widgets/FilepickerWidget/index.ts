function cov_b0ibon8e8() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/FilepickerWidget/index.ts";
  var hash = "8fc6bcd153f18f74747fd6c607ba8ecdd5d747e2";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/FilepickerWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 5,
          column: 22
        },
        end: {
          line: 37,
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
    hash: "8fc6bcd153f18f74747fd6c607ba8ecdd5d747e2"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_b0ibon8e8 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_b0ibon8e8();
import IconSVG from "./icon.svg";
import Widget from "./widget";
import FileDataTypes from "./widget/FileDataTypes";
export const CONFIG = (cov_b0ibon8e8().s[0]++, {
  type: Widget.getWidgetType(),
  name: "FilePicker",
  iconSVG: IconSVG,
  needsMeta: true,
  hideCard: true,
  isDeprecated: true,
  replacement: "FILE_PICKER_WIDGET_V2",
  defaults: {
    rows: 4,
    files: [],
    selectedFiles: [],
    allowedFileTypes: [],
    label: "Select Files",
    columns: 16,
    maxNumFiles: 1,
    maxFileSize: 5,
    fileDataType: FileDataTypes.Base64,
    widgetName: "FilePicker",
    isDefaultClickDisabled: true,
    version: 1,
    isRequired: false,
    isDisabled: false,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfYjBpYm9uOGU4IiwiYWN0dWFsQ292ZXJhZ2UiLCJJY29uU1ZHIiwiV2lkZ2V0IiwiRmlsZURhdGFUeXBlcyIsIkNPTkZJRyIsInMiLCJ0eXBlIiwiZ2V0V2lkZ2V0VHlwZSIsIm5hbWUiLCJpY29uU1ZHIiwibmVlZHNNZXRhIiwiaGlkZUNhcmQiLCJpc0RlcHJlY2F0ZWQiLCJyZXBsYWNlbWVudCIsImRlZmF1bHRzIiwicm93cyIsImZpbGVzIiwic2VsZWN0ZWRGaWxlcyIsImFsbG93ZWRGaWxlVHlwZXMiLCJsYWJlbCIsImNvbHVtbnMiLCJtYXhOdW1GaWxlcyIsIm1heEZpbGVTaXplIiwiZmlsZURhdGFUeXBlIiwiQmFzZTY0Iiwid2lkZ2V0TmFtZSIsImlzRGVmYXVsdENsaWNrRGlzYWJsZWQiLCJ2ZXJzaW9uIiwiaXNSZXF1aXJlZCIsImlzRGlzYWJsZWQiLCJhbmltYXRlTG9hZGluZyIsInByb3BlcnRpZXMiLCJkZXJpdmVkIiwiZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAiLCJkZWZhdWx0IiwiZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAiLCJtZXRhIiwiZ2V0TWV0YVByb3BlcnRpZXNNYXAiLCJjb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb25maWciLCJhdXRvY29tcGxldGVEZWZpbml0aW9ucyIsImdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zIl0sInNvdXJjZXMiOlsiaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEljb25TVkcgZnJvbSBcIi4vaWNvbi5zdmdcIjtcbmltcG9ydCBXaWRnZXQgZnJvbSBcIi4vd2lkZ2V0XCI7XG5pbXBvcnQgRmlsZURhdGFUeXBlcyBmcm9tIFwiLi93aWRnZXQvRmlsZURhdGFUeXBlc1wiO1xuXG5leHBvcnQgY29uc3QgQ09ORklHID0ge1xuICB0eXBlOiBXaWRnZXQuZ2V0V2lkZ2V0VHlwZSgpLFxuICBuYW1lOiBcIkZpbGVQaWNrZXJcIixcbiAgaWNvblNWRzogSWNvblNWRyxcbiAgbmVlZHNNZXRhOiB0cnVlLFxuICBoaWRlQ2FyZDogdHJ1ZSxcbiAgaXNEZXByZWNhdGVkOiB0cnVlLFxuICByZXBsYWNlbWVudDogXCJGSUxFX1BJQ0tFUl9XSURHRVRfVjJcIixcbiAgZGVmYXVsdHM6IHtcbiAgICByb3dzOiA0LFxuICAgIGZpbGVzOiBbXSxcbiAgICBzZWxlY3RlZEZpbGVzOiBbXSxcbiAgICBhbGxvd2VkRmlsZVR5cGVzOiBbXSxcbiAgICBsYWJlbDogXCJTZWxlY3QgRmlsZXNcIixcbiAgICBjb2x1bW5zOiAxNixcbiAgICBtYXhOdW1GaWxlczogMSxcbiAgICBtYXhGaWxlU2l6ZTogNSxcbiAgICBmaWxlRGF0YVR5cGU6IEZpbGVEYXRhVHlwZXMuQmFzZTY0LFxuICAgIHdpZGdldE5hbWU6IFwiRmlsZVBpY2tlclwiLFxuICAgIGlzRGVmYXVsdENsaWNrRGlzYWJsZWQ6IHRydWUsXG4gICAgdmVyc2lvbjogMSxcbiAgICBpc1JlcXVpcmVkOiBmYWxzZSxcbiAgICBpc0Rpc2FibGVkOiBmYWxzZSxcbiAgICBhbmltYXRlTG9hZGluZzogdHJ1ZSxcbiAgfSxcbiAgcHJvcGVydGllczoge1xuICAgIGRlcml2ZWQ6IFdpZGdldC5nZXREZXJpdmVkUHJvcGVydGllc01hcCgpLFxuICAgIGRlZmF1bHQ6IFdpZGdldC5nZXREZWZhdWx0UHJvcGVydGllc01hcCgpLFxuICAgIG1ldGE6IFdpZGdldC5nZXRNZXRhUHJvcGVydGllc01hcCgpLFxuICAgIGNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbmZpZygpLFxuICAgIGF1dG9jb21wbGV0ZURlZmluaXRpb25zOiBXaWRnZXQuZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMoKSxcbiAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFdpZGdldDtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxhQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxhQUFBO0FBZlosT0FBT0UsT0FBTyxNQUFNLFlBQVk7QUFDaEMsT0FBT0MsTUFBTSxNQUFNLFVBQVU7QUFDN0IsT0FBT0MsYUFBYSxNQUFNLHdCQUF3QjtBQUVsRCxPQUFPLE1BQU1DLE1BQU0sSUFBQUwsYUFBQSxHQUFBTSxDQUFBLE9BQUc7RUFDcEJDLElBQUksRUFBRUosTUFBTSxDQUFDSyxhQUFhLENBQUMsQ0FBQztFQUM1QkMsSUFBSSxFQUFFLFlBQVk7RUFDbEJDLE9BQU8sRUFBRVIsT0FBTztFQUNoQlMsU0FBUyxFQUFFLElBQUk7RUFDZkMsUUFBUSxFQUFFLElBQUk7RUFDZEMsWUFBWSxFQUFFLElBQUk7RUFDbEJDLFdBQVcsRUFBRSx1QkFBdUI7RUFDcENDLFFBQVEsRUFBRTtJQUNSQyxJQUFJLEVBQUUsQ0FBQztJQUNQQyxLQUFLLEVBQUUsRUFBRTtJQUNUQyxhQUFhLEVBQUUsRUFBRTtJQUNqQkMsZ0JBQWdCLEVBQUUsRUFBRTtJQUNwQkMsS0FBSyxFQUFFLGNBQWM7SUFDckJDLE9BQU8sRUFBRSxFQUFFO0lBQ1hDLFdBQVcsRUFBRSxDQUFDO0lBQ2RDLFdBQVcsRUFBRSxDQUFDO0lBQ2RDLFlBQVksRUFBRXBCLGFBQWEsQ0FBQ3FCLE1BQU07SUFDbENDLFVBQVUsRUFBRSxZQUFZO0lBQ3hCQyxzQkFBc0IsRUFBRSxJQUFJO0lBQzVCQyxPQUFPLEVBQUUsQ0FBQztJQUNWQyxVQUFVLEVBQUUsS0FBSztJQUNqQkMsVUFBVSxFQUFFLEtBQUs7SUFDakJDLGNBQWMsRUFBRTtFQUNsQixDQUFDO0VBQ0RDLFVBQVUsRUFBRTtJQUNWQyxPQUFPLEVBQUU5QixNQUFNLENBQUMrQix1QkFBdUIsQ0FBQyxDQUFDO0lBQ3pDQyxPQUFPLEVBQUVoQyxNQUFNLENBQUNpQyx1QkFBdUIsQ0FBQyxDQUFDO0lBQ3pDQyxJQUFJLEVBQUVsQyxNQUFNLENBQUNtQyxvQkFBb0IsQ0FBQyxDQUFDO0lBQ25DQyxNQUFNLEVBQUVwQyxNQUFNLENBQUNxQyxxQkFBcUIsQ0FBQyxDQUFDO0lBQ3RDQyx1QkFBdUIsRUFBRXRDLE1BQU0sQ0FBQ3VDLDBCQUEwQixDQUFDO0VBQzdEO0FBQ0YsQ0FBQztBQUVELGVBQWV2QyxNQUFNIn0=