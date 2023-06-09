function cov_7zw19ms2t() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/FilePickerWidgetV2/index.ts";
  var hash = "f88bc9064d548e09446099477c8d40b0ee5016ff";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/FilePickerWidgetV2/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 8,
          column: 22
        },
        end: {
          line: 68,
          column: 1
        }
      },
      "1": {
        start: {
          line: 56,
          column: 10
        },
        end: {
          line: 59,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 55,
            column: 23
          },
          end: {
            line: 55,
            column: 24
          }
        },
        loc: {
          start: {
            line: 55,
            column: 29
          },
          end: {
            line: 60,
            column: 9
          }
        },
        line: 55
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
    hash: "f88bc9064d548e09446099477c8d40b0ee5016ff"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_7zw19ms2t = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_7zw19ms2t();
import { BUTTON_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import FileDataTypes from "./constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_7zw19ms2t().s[0]++, {
  type: Widget.getWidgetType(),
  name: "FilePicker",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["upload"],
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
    dynamicTyping: true,
    widgetName: "FilePicker",
    isDefaultClickDisabled: true,
    version: 1,
    isRequired: false,
    isDisabled: false,
    animateLoading: true,
    responsiveBehavior: ResponsiveBehavior.Hug,
    minWidth: BUTTON_MIN_WIDTH
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    stylesheetConfig: Widget.getStylesheetConfig(),
    autocompleteDefinitions: Widget.getAutocompleteDefinitions()
  },
  autoLayout: {
    defaults: {
      rows: 4,
      columns: 6.632
    },
    autoDimension: {
      width: true
    },
    widgetSize: [{
      viewportMinWidth: 0,
      configuration: () => {
        cov_7zw19ms2t().f[0]++;
        cov_7zw19ms2t().s[1]++;
        return {
          minWidth: "120px",
          maxWidth: "360px"
        };
      }
    }],
    disableResizeHandles: {
      horizontal: true,
      vertical: true
    }
  }
});
export default Widget;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfN3p3MTltczJ0IiwiYWN0dWFsQ292ZXJhZ2UiLCJCVVRUT05fTUlOX1dJRFRIIiwiUmVzcG9uc2l2ZUJlaGF2aW9yIiwiRmlsZURhdGFUeXBlcyIsIkljb25TVkciLCJXaWRnZXQiLCJDT05GSUciLCJzIiwidHlwZSIsImdldFdpZGdldFR5cGUiLCJuYW1lIiwiaWNvblNWRyIsIm5lZWRzTWV0YSIsInNlYXJjaFRhZ3MiLCJkZWZhdWx0cyIsInJvd3MiLCJmaWxlcyIsInNlbGVjdGVkRmlsZXMiLCJhbGxvd2VkRmlsZVR5cGVzIiwibGFiZWwiLCJjb2x1bW5zIiwibWF4TnVtRmlsZXMiLCJtYXhGaWxlU2l6ZSIsImZpbGVEYXRhVHlwZSIsIkJhc2U2NCIsImR5bmFtaWNUeXBpbmciLCJ3aWRnZXROYW1lIiwiaXNEZWZhdWx0Q2xpY2tEaXNhYmxlZCIsInZlcnNpb24iLCJpc1JlcXVpcmVkIiwiaXNEaXNhYmxlZCIsImFuaW1hdGVMb2FkaW5nIiwicmVzcG9uc2l2ZUJlaGF2aW9yIiwiSHVnIiwibWluV2lkdGgiLCJwcm9wZXJ0aWVzIiwiZGVyaXZlZCIsImdldERlcml2ZWRQcm9wZXJ0aWVzTWFwIiwiZGVmYXVsdCIsImdldERlZmF1bHRQcm9wZXJ0aWVzTWFwIiwibWV0YSIsImdldE1ldGFQcm9wZXJ0aWVzTWFwIiwiY29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lQ29uZmlnIiwic3R5bGVDb25maWciLCJnZXRQcm9wZXJ0eVBhbmVTdHlsZUNvbmZpZyIsImNvbnRlbnRDb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnIiwic3R5bGVzaGVldENvbmZpZyIsImdldFN0eWxlc2hlZXRDb25maWciLCJhdXRvY29tcGxldGVEZWZpbml0aW9ucyIsImdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiYXV0b0xheW91dCIsImF1dG9EaW1lbnNpb24iLCJ3aWR0aCIsIndpZGdldFNpemUiLCJ2aWV3cG9ydE1pbldpZHRoIiwiY29uZmlndXJhdGlvbiIsImYiLCJtYXhXaWR0aCIsImRpc2FibGVSZXNpemVIYW5kbGVzIiwiaG9yaXpvbnRhbCIsInZlcnRpY2FsIl0sInNvdXJjZXMiOlsiaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQlVUVE9OX01JTl9XSURUSCB9IGZyb20gXCJjb25zdGFudHMvbWluV2lkdGhDb25zdGFudHNcIjtcbmltcG9ydCB7IFJlc3BvbnNpdmVCZWhhdmlvciB9IGZyb20gXCJ1dGlscy9hdXRvTGF5b3V0L2NvbnN0YW50c1wiO1xuXG5pbXBvcnQgRmlsZURhdGFUeXBlcyBmcm9tIFwiLi9jb25zdGFudHNcIjtcbmltcG9ydCBJY29uU1ZHIGZyb20gXCIuL2ljb24uc3ZnXCI7XG5pbXBvcnQgV2lkZ2V0IGZyb20gXCIuL3dpZGdldFwiO1xuXG5leHBvcnQgY29uc3QgQ09ORklHID0ge1xuICB0eXBlOiBXaWRnZXQuZ2V0V2lkZ2V0VHlwZSgpLFxuICBuYW1lOiBcIkZpbGVQaWNrZXJcIixcbiAgaWNvblNWRzogSWNvblNWRyxcbiAgbmVlZHNNZXRhOiB0cnVlLFxuICBzZWFyY2hUYWdzOiBbXCJ1cGxvYWRcIl0sXG4gIGRlZmF1bHRzOiB7XG4gICAgcm93czogNCxcbiAgICBmaWxlczogW10sXG4gICAgc2VsZWN0ZWRGaWxlczogW10sXG4gICAgYWxsb3dlZEZpbGVUeXBlczogW10sXG4gICAgbGFiZWw6IFwiU2VsZWN0IEZpbGVzXCIsXG4gICAgY29sdW1uczogMTYsXG4gICAgbWF4TnVtRmlsZXM6IDEsXG4gICAgbWF4RmlsZVNpemU6IDUsXG4gICAgZmlsZURhdGFUeXBlOiBGaWxlRGF0YVR5cGVzLkJhc2U2NCxcbiAgICBkeW5hbWljVHlwaW5nOiB0cnVlLFxuICAgIHdpZGdldE5hbWU6IFwiRmlsZVBpY2tlclwiLFxuICAgIGlzRGVmYXVsdENsaWNrRGlzYWJsZWQ6IHRydWUsXG4gICAgdmVyc2lvbjogMSxcbiAgICBpc1JlcXVpcmVkOiBmYWxzZSxcbiAgICBpc0Rpc2FibGVkOiBmYWxzZSxcbiAgICBhbmltYXRlTG9hZGluZzogdHJ1ZSxcbiAgICByZXNwb25zaXZlQmVoYXZpb3I6IFJlc3BvbnNpdmVCZWhhdmlvci5IdWcsXG4gICAgbWluV2lkdGg6IEJVVFRPTl9NSU5fV0lEVEgsXG4gIH0sXG4gIHByb3BlcnRpZXM6IHtcbiAgICBkZXJpdmVkOiBXaWRnZXQuZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAoKSxcbiAgICBkZWZhdWx0OiBXaWRnZXQuZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAoKSxcbiAgICBtZXRhOiBXaWRnZXQuZ2V0TWV0YVByb3BlcnRpZXNNYXAoKSxcbiAgICBjb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVDb25maWcoKSxcbiAgICBzdHlsZUNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZVN0eWxlQ29uZmlnKCksXG4gICAgY29udGVudENvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbnRlbnRDb25maWcoKSxcbiAgICBzdHlsZXNoZWV0Q29uZmlnOiBXaWRnZXQuZ2V0U3R5bGVzaGVldENvbmZpZygpLFxuICAgIGF1dG9jb21wbGV0ZURlZmluaXRpb25zOiBXaWRnZXQuZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMoKSxcbiAgfSxcbiAgYXV0b0xheW91dDoge1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICByb3dzOiA0LFxuICAgICAgY29sdW1uczogNi42MzIsXG4gICAgfSxcbiAgICBhdXRvRGltZW5zaW9uOiB7XG4gICAgICB3aWR0aDogdHJ1ZSxcbiAgICB9LFxuICAgIHdpZGdldFNpemU6IFtcbiAgICAgIHtcbiAgICAgICAgdmlld3BvcnRNaW5XaWR0aDogMCxcbiAgICAgICAgY29uZmlndXJhdGlvbjogKCkgPT4ge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtaW5XaWR0aDogXCIxMjBweFwiLFxuICAgICAgICAgICAgbWF4V2lkdGg6IFwiMzYwcHhcIixcbiAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdLFxuICAgIGRpc2FibGVSZXNpemVIYW5kbGVzOiB7XG4gICAgICBob3Jpem9udGFsOiB0cnVlLFxuICAgICAgdmVydGljYWw6IHRydWUsXG4gICAgfSxcbiAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFdpZGdldDtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGFBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGFBQUE7QUFmWixTQUFTRSxnQkFBZ0IsUUFBUSw2QkFBNkI7QUFDOUQsU0FBU0Msa0JBQWtCLFFBQVEsNEJBQTRCO0FBRS9ELE9BQU9DLGFBQWEsTUFBTSxhQUFhO0FBQ3ZDLE9BQU9DLE9BQU8sTUFBTSxZQUFZO0FBQ2hDLE9BQU9DLE1BQU0sTUFBTSxVQUFVO0FBRTdCLE9BQU8sTUFBTUMsTUFBTSxJQUFBUCxhQUFBLEdBQUFRLENBQUEsT0FBRztFQUNwQkMsSUFBSSxFQUFFSCxNQUFNLENBQUNJLGFBQWEsQ0FBQyxDQUFDO0VBQzVCQyxJQUFJLEVBQUUsWUFBWTtFQUNsQkMsT0FBTyxFQUFFUCxPQUFPO0VBQ2hCUSxTQUFTLEVBQUUsSUFBSTtFQUNmQyxVQUFVLEVBQUUsQ0FBQyxRQUFRLENBQUM7RUFDdEJDLFFBQVEsRUFBRTtJQUNSQyxJQUFJLEVBQUUsQ0FBQztJQUNQQyxLQUFLLEVBQUUsRUFBRTtJQUNUQyxhQUFhLEVBQUUsRUFBRTtJQUNqQkMsZ0JBQWdCLEVBQUUsRUFBRTtJQUNwQkMsS0FBSyxFQUFFLGNBQWM7SUFDckJDLE9BQU8sRUFBRSxFQUFFO0lBQ1hDLFdBQVcsRUFBRSxDQUFDO0lBQ2RDLFdBQVcsRUFBRSxDQUFDO0lBQ2RDLFlBQVksRUFBRXBCLGFBQWEsQ0FBQ3FCLE1BQU07SUFDbENDLGFBQWEsRUFBRSxJQUFJO0lBQ25CQyxVQUFVLEVBQUUsWUFBWTtJQUN4QkMsc0JBQXNCLEVBQUUsSUFBSTtJQUM1QkMsT0FBTyxFQUFFLENBQUM7SUFDVkMsVUFBVSxFQUFFLEtBQUs7SUFDakJDLFVBQVUsRUFBRSxLQUFLO0lBQ2pCQyxjQUFjLEVBQUUsSUFBSTtJQUNwQkMsa0JBQWtCLEVBQUU5QixrQkFBa0IsQ0FBQytCLEdBQUc7SUFDMUNDLFFBQVEsRUFBRWpDO0VBQ1osQ0FBQztFQUNEa0MsVUFBVSxFQUFFO0lBQ1ZDLE9BQU8sRUFBRS9CLE1BQU0sQ0FBQ2dDLHVCQUF1QixDQUFDLENBQUM7SUFDekNDLE9BQU8sRUFBRWpDLE1BQU0sQ0FBQ2tDLHVCQUF1QixDQUFDLENBQUM7SUFDekNDLElBQUksRUFBRW5DLE1BQU0sQ0FBQ29DLG9CQUFvQixDQUFDLENBQUM7SUFDbkNDLE1BQU0sRUFBRXJDLE1BQU0sQ0FBQ3NDLHFCQUFxQixDQUFDLENBQUM7SUFDdENDLFdBQVcsRUFBRXZDLE1BQU0sQ0FBQ3dDLDBCQUEwQixDQUFDLENBQUM7SUFDaERDLGFBQWEsRUFBRXpDLE1BQU0sQ0FBQzBDLDRCQUE0QixDQUFDLENBQUM7SUFDcERDLGdCQUFnQixFQUFFM0MsTUFBTSxDQUFDNEMsbUJBQW1CLENBQUMsQ0FBQztJQUM5Q0MsdUJBQXVCLEVBQUU3QyxNQUFNLENBQUM4QywwQkFBMEIsQ0FBQztFQUM3RCxDQUFDO0VBQ0RDLFVBQVUsRUFBRTtJQUNWdEMsUUFBUSxFQUFFO01BQ1JDLElBQUksRUFBRSxDQUFDO01BQ1BLLE9BQU8sRUFBRTtJQUNYLENBQUM7SUFDRGlDLGFBQWEsRUFBRTtNQUNiQyxLQUFLLEVBQUU7SUFDVCxDQUFDO0lBQ0RDLFVBQVUsRUFBRSxDQUNWO01BQ0VDLGdCQUFnQixFQUFFLENBQUM7TUFDbkJDLGFBQWEsRUFBRUEsQ0FBQSxLQUFNO1FBQUExRCxhQUFBLEdBQUEyRCxDQUFBO1FBQUEzRCxhQUFBLEdBQUFRLENBQUE7UUFDbkIsT0FBTztVQUNMMkIsUUFBUSxFQUFFLE9BQU87VUFDakJ5QixRQUFRLEVBQUU7UUFDWixDQUFDO01BQ0g7SUFDRixDQUFDLENBQ0Y7SUFDREMsb0JBQW9CLEVBQUU7TUFDcEJDLFVBQVUsRUFBRSxJQUFJO01BQ2hCQyxRQUFRLEVBQUU7SUFDWjtFQUNGO0FBQ0YsQ0FBQztBQUVELGVBQWV6RCxNQUFNIn0=