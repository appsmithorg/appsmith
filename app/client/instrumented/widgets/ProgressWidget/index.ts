function cov_2l5ssw0m4r() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/ProgressWidget/index.ts";
  var hash = "8987806461dcc5d20d0a861609aa814cf78460d2";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/ProgressWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 7,
          column: 22
        },
        end: {
          line: 58,
          column: 1
        }
      },
      "1": {
        start: {
          line: 47,
          column: 10
        },
        end: {
          line: 50,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 46,
            column: 23
          },
          end: {
            line: 46,
            column: 24
          }
        },
        loc: {
          start: {
            line: 46,
            column: 29
          },
          end: {
            line: 51,
            column: 9
          }
        },
        line: 46
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
    hash: "8987806461dcc5d20d0a861609aa814cf78460d2"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_2l5ssw0m4r = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_2l5ssw0m4r();
import Widget from "./widget";
import IconSVG from "./icon.svg";
import { ProgressType } from "./constants";
import { Colors } from "constants/Colors";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
export const CONFIG = (cov_2l5ssw0m4r().s[0]++, {
  type: Widget.getWidgetType(),
  name: "Progress",
  // The display name which will be made in uppercase and show in the widgets panel ( can have spaces )
  iconSVG: IconSVG,
  needsMeta: false,
  // Defines if this widget adds any meta properties
  isCanvas: false,
  // Defines if this widget has a canvas within in which we can drop other widgets
  searchTags: ["percent"],
  defaults: {
    widgetName: "Progress",
    rows: 4,
    columns: 28,
    fillColor: Colors.GREEN,
    isIndeterminate: false,
    showResult: false,
    counterClosewise: false,
    isVisible: true,
    steps: 1,
    progressType: ProgressType.LINEAR,
    progress: 50,
    version: 1,
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
      progressType: ProgressType.LINEAR
    },
    widgetSize: [{
      viewportMinWidth: 0,
      configuration: () => {
        cov_2l5ssw0m4r().f[0]++;
        cov_2l5ssw0m4r().s[1]++;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMmw1c3N3MG00ciIsImFjdHVhbENvdmVyYWdlIiwiV2lkZ2V0IiwiSWNvblNWRyIsIlByb2dyZXNzVHlwZSIsIkNvbG9ycyIsIlJlc3BvbnNpdmVCZWhhdmlvciIsIkNPTkZJRyIsInMiLCJ0eXBlIiwiZ2V0V2lkZ2V0VHlwZSIsIm5hbWUiLCJpY29uU1ZHIiwibmVlZHNNZXRhIiwiaXNDYW52YXMiLCJzZWFyY2hUYWdzIiwiZGVmYXVsdHMiLCJ3aWRnZXROYW1lIiwicm93cyIsImNvbHVtbnMiLCJmaWxsQ29sb3IiLCJHUkVFTiIsImlzSW5kZXRlcm1pbmF0ZSIsInNob3dSZXN1bHQiLCJjb3VudGVyQ2xvc2V3aXNlIiwiaXNWaXNpYmxlIiwic3RlcHMiLCJwcm9ncmVzc1R5cGUiLCJMSU5FQVIiLCJwcm9ncmVzcyIsInZlcnNpb24iLCJyZXNwb25zaXZlQmVoYXZpb3IiLCJGaWxsIiwicHJvcGVydGllcyIsImRlcml2ZWQiLCJnZXREZXJpdmVkUHJvcGVydGllc01hcCIsImRlZmF1bHQiLCJnZXREZWZhdWx0UHJvcGVydGllc01hcCIsIm1ldGEiLCJnZXRNZXRhUHJvcGVydGllc01hcCIsImNvbmZpZyIsImdldFByb3BlcnR5UGFuZUNvbmZpZyIsImNvbnRlbnRDb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnIiwic3R5bGVDb25maWciLCJnZXRQcm9wZXJ0eVBhbmVTdHlsZUNvbmZpZyIsInN0eWxlc2hlZXRDb25maWciLCJnZXRTdHlsZXNoZWV0Q29uZmlnIiwiYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiLCJnZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucyIsImF1dG9MYXlvdXQiLCJkaXNhYmxlZFByb3BzRGVmYXVsdHMiLCJ3aWRnZXRTaXplIiwidmlld3BvcnRNaW5XaWR0aCIsImNvbmZpZ3VyYXRpb24iLCJmIiwibWluV2lkdGgiLCJtaW5IZWlnaHQiLCJkaXNhYmxlUmVzaXplSGFuZGxlcyIsInZlcnRpY2FsIl0sInNvdXJjZXMiOlsiaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFdpZGdldCBmcm9tIFwiLi93aWRnZXRcIjtcbmltcG9ydCBJY29uU1ZHIGZyb20gXCIuL2ljb24uc3ZnXCI7XG5pbXBvcnQgeyBQcm9ncmVzc1R5cGUgfSBmcm9tIFwiLi9jb25zdGFudHNcIjtcbmltcG9ydCB7IENvbG9ycyB9IGZyb20gXCJjb25zdGFudHMvQ29sb3JzXCI7XG5pbXBvcnQgeyBSZXNwb25zaXZlQmVoYXZpb3IgfSBmcm9tIFwidXRpbHMvYXV0b0xheW91dC9jb25zdGFudHNcIjtcblxuZXhwb3J0IGNvbnN0IENPTkZJRyA9IHtcbiAgdHlwZTogV2lkZ2V0LmdldFdpZGdldFR5cGUoKSxcbiAgbmFtZTogXCJQcm9ncmVzc1wiLCAvLyBUaGUgZGlzcGxheSBuYW1lIHdoaWNoIHdpbGwgYmUgbWFkZSBpbiB1cHBlcmNhc2UgYW5kIHNob3cgaW4gdGhlIHdpZGdldHMgcGFuZWwgKCBjYW4gaGF2ZSBzcGFjZXMgKVxuICBpY29uU1ZHOiBJY29uU1ZHLFxuICBuZWVkc01ldGE6IGZhbHNlLCAvLyBEZWZpbmVzIGlmIHRoaXMgd2lkZ2V0IGFkZHMgYW55IG1ldGEgcHJvcGVydGllc1xuICBpc0NhbnZhczogZmFsc2UsIC8vIERlZmluZXMgaWYgdGhpcyB3aWRnZXQgaGFzIGEgY2FudmFzIHdpdGhpbiBpbiB3aGljaCB3ZSBjYW4gZHJvcCBvdGhlciB3aWRnZXRzXG4gIHNlYXJjaFRhZ3M6IFtcInBlcmNlbnRcIl0sXG4gIGRlZmF1bHRzOiB7XG4gICAgd2lkZ2V0TmFtZTogXCJQcm9ncmVzc1wiLFxuICAgIHJvd3M6IDQsXG4gICAgY29sdW1uczogMjgsXG4gICAgZmlsbENvbG9yOiBDb2xvcnMuR1JFRU4sXG4gICAgaXNJbmRldGVybWluYXRlOiBmYWxzZSxcbiAgICBzaG93UmVzdWx0OiBmYWxzZSxcbiAgICBjb3VudGVyQ2xvc2V3aXNlOiBmYWxzZSxcbiAgICBpc1Zpc2libGU6IHRydWUsXG4gICAgc3RlcHM6IDEsXG4gICAgcHJvZ3Jlc3NUeXBlOiBQcm9ncmVzc1R5cGUuTElORUFSLFxuICAgIHByb2dyZXNzOiA1MCxcbiAgICB2ZXJzaW9uOiAxLFxuICAgIHJlc3BvbnNpdmVCZWhhdmlvcjogUmVzcG9uc2l2ZUJlaGF2aW9yLkZpbGwsXG4gIH0sXG4gIHByb3BlcnRpZXM6IHtcbiAgICBkZXJpdmVkOiBXaWRnZXQuZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAoKSxcbiAgICBkZWZhdWx0OiBXaWRnZXQuZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAoKSxcbiAgICBtZXRhOiBXaWRnZXQuZ2V0TWV0YVByb3BlcnRpZXNNYXAoKSxcbiAgICBjb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVDb25maWcoKSxcbiAgICBjb250ZW50Q29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lQ29udGVudENvbmZpZygpLFxuICAgIHN0eWxlQ29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lU3R5bGVDb25maWcoKSxcbiAgICBzdHlsZXNoZWV0Q29uZmlnOiBXaWRnZXQuZ2V0U3R5bGVzaGVldENvbmZpZygpLFxuICAgIGF1dG9jb21wbGV0ZURlZmluaXRpb25zOiBXaWRnZXQuZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMoKSxcbiAgfSxcbiAgYXV0b0xheW91dDoge1xuICAgIGRpc2FibGVkUHJvcHNEZWZhdWx0czoge1xuICAgICAgcHJvZ3Jlc3NUeXBlOiBQcm9ncmVzc1R5cGUuTElORUFSLFxuICAgIH0sXG4gICAgd2lkZ2V0U2l6ZTogW1xuICAgICAge1xuICAgICAgICB2aWV3cG9ydE1pbldpZHRoOiAwLFxuICAgICAgICBjb25maWd1cmF0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1pbldpZHRoOiBcIjEyMHB4XCIsXG4gICAgICAgICAgICBtaW5IZWlnaHQ6IFwiNDBweFwiLFxuICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF0sXG4gICAgZGlzYWJsZVJlc2l6ZUhhbmRsZXM6IHtcbiAgICAgIHZlcnRpY2FsOiB0cnVlLFxuICAgIH0sXG4gIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBXaWRnZXQ7XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxjQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxjQUFBO0FBZlosT0FBT0UsTUFBTSxNQUFNLFVBQVU7QUFDN0IsT0FBT0MsT0FBTyxNQUFNLFlBQVk7QUFDaEMsU0FBU0MsWUFBWSxRQUFRLGFBQWE7QUFDMUMsU0FBU0MsTUFBTSxRQUFRLGtCQUFrQjtBQUN6QyxTQUFTQyxrQkFBa0IsUUFBUSw0QkFBNEI7QUFFL0QsT0FBTyxNQUFNQyxNQUFNLElBQUFQLGNBQUEsR0FBQVEsQ0FBQSxPQUFHO0VBQ3BCQyxJQUFJLEVBQUVQLE1BQU0sQ0FBQ1EsYUFBYSxDQUFDLENBQUM7RUFDNUJDLElBQUksRUFBRSxVQUFVO0VBQUU7RUFDbEJDLE9BQU8sRUFBRVQsT0FBTztFQUNoQlUsU0FBUyxFQUFFLEtBQUs7RUFBRTtFQUNsQkMsUUFBUSxFQUFFLEtBQUs7RUFBRTtFQUNqQkMsVUFBVSxFQUFFLENBQUMsU0FBUyxDQUFDO0VBQ3ZCQyxRQUFRLEVBQUU7SUFDUkMsVUFBVSxFQUFFLFVBQVU7SUFDdEJDLElBQUksRUFBRSxDQUFDO0lBQ1BDLE9BQU8sRUFBRSxFQUFFO0lBQ1hDLFNBQVMsRUFBRWYsTUFBTSxDQUFDZ0IsS0FBSztJQUN2QkMsZUFBZSxFQUFFLEtBQUs7SUFDdEJDLFVBQVUsRUFBRSxLQUFLO0lBQ2pCQyxnQkFBZ0IsRUFBRSxLQUFLO0lBQ3ZCQyxTQUFTLEVBQUUsSUFBSTtJQUNmQyxLQUFLLEVBQUUsQ0FBQztJQUNSQyxZQUFZLEVBQUV2QixZQUFZLENBQUN3QixNQUFNO0lBQ2pDQyxRQUFRLEVBQUUsRUFBRTtJQUNaQyxPQUFPLEVBQUUsQ0FBQztJQUNWQyxrQkFBa0IsRUFBRXpCLGtCQUFrQixDQUFDMEI7RUFDekMsQ0FBQztFQUNEQyxVQUFVLEVBQUU7SUFDVkMsT0FBTyxFQUFFaEMsTUFBTSxDQUFDaUMsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsT0FBTyxFQUFFbEMsTUFBTSxDQUFDbUMsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsSUFBSSxFQUFFcEMsTUFBTSxDQUFDcUMsb0JBQW9CLENBQUMsQ0FBQztJQUNuQ0MsTUFBTSxFQUFFdEMsTUFBTSxDQUFDdUMscUJBQXFCLENBQUMsQ0FBQztJQUN0Q0MsYUFBYSxFQUFFeEMsTUFBTSxDQUFDeUMsNEJBQTRCLENBQUMsQ0FBQztJQUNwREMsV0FBVyxFQUFFMUMsTUFBTSxDQUFDMkMsMEJBQTBCLENBQUMsQ0FBQztJQUNoREMsZ0JBQWdCLEVBQUU1QyxNQUFNLENBQUM2QyxtQkFBbUIsQ0FBQyxDQUFDO0lBQzlDQyx1QkFBdUIsRUFBRTlDLE1BQU0sQ0FBQytDLDBCQUEwQixDQUFDO0VBQzdELENBQUM7RUFDREMsVUFBVSxFQUFFO0lBQ1ZDLHFCQUFxQixFQUFFO01BQ3JCeEIsWUFBWSxFQUFFdkIsWUFBWSxDQUFDd0I7SUFDN0IsQ0FBQztJQUNEd0IsVUFBVSxFQUFFLENBQ1Y7TUFDRUMsZ0JBQWdCLEVBQUUsQ0FBQztNQUNuQkMsYUFBYSxFQUFFQSxDQUFBLEtBQU07UUFBQXRELGNBQUEsR0FBQXVELENBQUE7UUFBQXZELGNBQUEsR0FBQVEsQ0FBQTtRQUNuQixPQUFPO1VBQ0xnRCxRQUFRLEVBQUUsT0FBTztVQUNqQkMsU0FBUyxFQUFFO1FBQ2IsQ0FBQztNQUNIO0lBQ0YsQ0FBQyxDQUNGO0lBQ0RDLG9CQUFvQixFQUFFO01BQ3BCQyxRQUFRLEVBQUU7SUFDWjtFQUNGO0FBQ0YsQ0FBQztBQUVELGVBQWV6RCxNQUFNIn0=