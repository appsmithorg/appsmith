function cov_1gmvnktaea() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/CameraWidget/index.ts";
  var hash = "ffec0855d54177471d8b163003201f9ea597e02c";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/CameraWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 6,
          column: 22
        },
        end: {
          line: 47,
          column: 1
        }
      },
      "1": {
        start: {
          line: 39,
          column: 10
        },
        end: {
          line: 42,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 38,
            column: 23
          },
          end: {
            line: 38,
            column: 24
          }
        },
        loc: {
          start: {
            line: 38,
            column: 29
          },
          end: {
            line: 43,
            column: 9
          }
        },
        line: 38
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
    hash: "ffec0855d54177471d8b163003201f9ea597e02c"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1gmvnktaea = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1gmvnktaea();
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { CameraModeTypes } from "./constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_1gmvnktaea().s[0]++, {
  type: Widget.getWidgetType(),
  name: "Camera",
  // The display name which will be made in uppercase and show in the widgets panel ( can have spaces )
  iconSVG: IconSVG,
  needsMeta: true,
  // Defines if this widget adds any meta properties
  isCanvas: false,
  // Defines if this widget has a canvas within in which we can drop other widgets
  searchTags: ["photo", "video recorder"],
  defaults: {
    widgetName: "Camera",
    rows: 33,
    columns: 25,
    mode: CameraModeTypes.CAMERA,
    isDisabled: false,
    isVisible: true,
    isMirrored: true,
    version: 1,
    responsiveBehavior: ResponsiveBehavior.Hug
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
    widgetSize: [{
      viewportMinWidth: 0,
      configuration: () => {
        cov_1gmvnktaea().f[0]++;
        cov_1gmvnktaea().s[1]++;
        return {
          minWidth: "280px",
          minHeight: "300px"
        };
      }
    }]
  }
});
export default Widget;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMWdtdm5rdGFlYSIsImFjdHVhbENvdmVyYWdlIiwiUmVzcG9uc2l2ZUJlaGF2aW9yIiwiQ2FtZXJhTW9kZVR5cGVzIiwiSWNvblNWRyIsIldpZGdldCIsIkNPTkZJRyIsInMiLCJ0eXBlIiwiZ2V0V2lkZ2V0VHlwZSIsIm5hbWUiLCJpY29uU1ZHIiwibmVlZHNNZXRhIiwiaXNDYW52YXMiLCJzZWFyY2hUYWdzIiwiZGVmYXVsdHMiLCJ3aWRnZXROYW1lIiwicm93cyIsImNvbHVtbnMiLCJtb2RlIiwiQ0FNRVJBIiwiaXNEaXNhYmxlZCIsImlzVmlzaWJsZSIsImlzTWlycm9yZWQiLCJ2ZXJzaW9uIiwicmVzcG9uc2l2ZUJlaGF2aW9yIiwiSHVnIiwicHJvcGVydGllcyIsImRlcml2ZWQiLCJnZXREZXJpdmVkUHJvcGVydGllc01hcCIsImRlZmF1bHQiLCJnZXREZWZhdWx0UHJvcGVydGllc01hcCIsIm1ldGEiLCJnZXRNZXRhUHJvcGVydGllc01hcCIsImNvbmZpZyIsImdldFByb3BlcnR5UGFuZUNvbmZpZyIsImNvbnRlbnRDb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnIiwic3R5bGVDb25maWciLCJnZXRQcm9wZXJ0eVBhbmVTdHlsZUNvbmZpZyIsInN0eWxlc2hlZXRDb25maWciLCJnZXRTdHlsZXNoZWV0Q29uZmlnIiwiYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiLCJnZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucyIsImF1dG9MYXlvdXQiLCJ3aWRnZXRTaXplIiwidmlld3BvcnRNaW5XaWR0aCIsImNvbmZpZ3VyYXRpb24iLCJmIiwibWluV2lkdGgiLCJtaW5IZWlnaHQiXSwic291cmNlcyI6WyJpbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBSZXNwb25zaXZlQmVoYXZpb3IgfSBmcm9tIFwidXRpbHMvYXV0b0xheW91dC9jb25zdGFudHNcIjtcbmltcG9ydCB7IENhbWVyYU1vZGVUeXBlcyB9IGZyb20gXCIuL2NvbnN0YW50c1wiO1xuaW1wb3J0IEljb25TVkcgZnJvbSBcIi4vaWNvbi5zdmdcIjtcbmltcG9ydCBXaWRnZXQgZnJvbSBcIi4vd2lkZ2V0XCI7XG5cbmV4cG9ydCBjb25zdCBDT05GSUcgPSB7XG4gIHR5cGU6IFdpZGdldC5nZXRXaWRnZXRUeXBlKCksXG4gIG5hbWU6IFwiQ2FtZXJhXCIsIC8vIFRoZSBkaXNwbGF5IG5hbWUgd2hpY2ggd2lsbCBiZSBtYWRlIGluIHVwcGVyY2FzZSBhbmQgc2hvdyBpbiB0aGUgd2lkZ2V0cyBwYW5lbCAoIGNhbiBoYXZlIHNwYWNlcyApXG4gIGljb25TVkc6IEljb25TVkcsXG4gIG5lZWRzTWV0YTogdHJ1ZSwgLy8gRGVmaW5lcyBpZiB0aGlzIHdpZGdldCBhZGRzIGFueSBtZXRhIHByb3BlcnRpZXNcbiAgaXNDYW52YXM6IGZhbHNlLCAvLyBEZWZpbmVzIGlmIHRoaXMgd2lkZ2V0IGhhcyBhIGNhbnZhcyB3aXRoaW4gaW4gd2hpY2ggd2UgY2FuIGRyb3Agb3RoZXIgd2lkZ2V0c1xuICBzZWFyY2hUYWdzOiBbXCJwaG90b1wiLCBcInZpZGVvIHJlY29yZGVyXCJdLFxuICBkZWZhdWx0czoge1xuICAgIHdpZGdldE5hbWU6IFwiQ2FtZXJhXCIsXG4gICAgcm93czogMzMsXG4gICAgY29sdW1uczogMjUsXG4gICAgbW9kZTogQ2FtZXJhTW9kZVR5cGVzLkNBTUVSQSxcbiAgICBpc0Rpc2FibGVkOiBmYWxzZSxcbiAgICBpc1Zpc2libGU6IHRydWUsXG4gICAgaXNNaXJyb3JlZDogdHJ1ZSxcbiAgICB2ZXJzaW9uOiAxLFxuICAgIHJlc3BvbnNpdmVCZWhhdmlvcjogUmVzcG9uc2l2ZUJlaGF2aW9yLkh1ZyxcbiAgfSxcbiAgcHJvcGVydGllczoge1xuICAgIGRlcml2ZWQ6IFdpZGdldC5nZXREZXJpdmVkUHJvcGVydGllc01hcCgpLFxuICAgIGRlZmF1bHQ6IFdpZGdldC5nZXREZWZhdWx0UHJvcGVydGllc01hcCgpLFxuICAgIG1ldGE6IFdpZGdldC5nZXRNZXRhUHJvcGVydGllc01hcCgpLFxuICAgIGNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbmZpZygpLFxuICAgIGNvbnRlbnRDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnKCksXG4gICAgc3R5bGVDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVTdHlsZUNvbmZpZygpLFxuICAgIHN0eWxlc2hlZXRDb25maWc6IFdpZGdldC5nZXRTdHlsZXNoZWV0Q29uZmlnKCksXG4gICAgYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnM6IFdpZGdldC5nZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucygpLFxuICB9LFxuICBhdXRvTGF5b3V0OiB7XG4gICAgd2lkZ2V0U2l6ZTogW1xuICAgICAge1xuICAgICAgICB2aWV3cG9ydE1pbldpZHRoOiAwLFxuICAgICAgICBjb25maWd1cmF0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1pbldpZHRoOiBcIjI4MHB4XCIsXG4gICAgICAgICAgICBtaW5IZWlnaHQ6IFwiMzAwcHhcIixcbiAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdLFxuICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgV2lkZ2V0O1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsY0FBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsY0FBQTtBQWZaLFNBQVNFLGtCQUFrQixRQUFRLDRCQUE0QjtBQUMvRCxTQUFTQyxlQUFlLFFBQVEsYUFBYTtBQUM3QyxPQUFPQyxPQUFPLE1BQU0sWUFBWTtBQUNoQyxPQUFPQyxNQUFNLE1BQU0sVUFBVTtBQUU3QixPQUFPLE1BQU1DLE1BQU0sSUFBQU4sY0FBQSxHQUFBTyxDQUFBLE9BQUc7RUFDcEJDLElBQUksRUFBRUgsTUFBTSxDQUFDSSxhQUFhLENBQUMsQ0FBQztFQUM1QkMsSUFBSSxFQUFFLFFBQVE7RUFBRTtFQUNoQkMsT0FBTyxFQUFFUCxPQUFPO0VBQ2hCUSxTQUFTLEVBQUUsSUFBSTtFQUFFO0VBQ2pCQyxRQUFRLEVBQUUsS0FBSztFQUFFO0VBQ2pCQyxVQUFVLEVBQUUsQ0FBQyxPQUFPLEVBQUUsZ0JBQWdCLENBQUM7RUFDdkNDLFFBQVEsRUFBRTtJQUNSQyxVQUFVLEVBQUUsUUFBUTtJQUNwQkMsSUFBSSxFQUFFLEVBQUU7SUFDUkMsT0FBTyxFQUFFLEVBQUU7SUFDWEMsSUFBSSxFQUFFaEIsZUFBZSxDQUFDaUIsTUFBTTtJQUM1QkMsVUFBVSxFQUFFLEtBQUs7SUFDakJDLFNBQVMsRUFBRSxJQUFJO0lBQ2ZDLFVBQVUsRUFBRSxJQUFJO0lBQ2hCQyxPQUFPLEVBQUUsQ0FBQztJQUNWQyxrQkFBa0IsRUFBRXZCLGtCQUFrQixDQUFDd0I7RUFDekMsQ0FBQztFQUNEQyxVQUFVLEVBQUU7SUFDVkMsT0FBTyxFQUFFdkIsTUFBTSxDQUFDd0IsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsT0FBTyxFQUFFekIsTUFBTSxDQUFDMEIsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsSUFBSSxFQUFFM0IsTUFBTSxDQUFDNEIsb0JBQW9CLENBQUMsQ0FBQztJQUNuQ0MsTUFBTSxFQUFFN0IsTUFBTSxDQUFDOEIscUJBQXFCLENBQUMsQ0FBQztJQUN0Q0MsYUFBYSxFQUFFL0IsTUFBTSxDQUFDZ0MsNEJBQTRCLENBQUMsQ0FBQztJQUNwREMsV0FBVyxFQUFFakMsTUFBTSxDQUFDa0MsMEJBQTBCLENBQUMsQ0FBQztJQUNoREMsZ0JBQWdCLEVBQUVuQyxNQUFNLENBQUNvQyxtQkFBbUIsQ0FBQyxDQUFDO0lBQzlDQyx1QkFBdUIsRUFBRXJDLE1BQU0sQ0FBQ3NDLDBCQUEwQixDQUFDO0VBQzdELENBQUM7RUFDREMsVUFBVSxFQUFFO0lBQ1ZDLFVBQVUsRUFBRSxDQUNWO01BQ0VDLGdCQUFnQixFQUFFLENBQUM7TUFDbkJDLGFBQWEsRUFBRUEsQ0FBQSxLQUFNO1FBQUEvQyxjQUFBLEdBQUFnRCxDQUFBO1FBQUFoRCxjQUFBLEdBQUFPLENBQUE7UUFDbkIsT0FBTztVQUNMMEMsUUFBUSxFQUFFLE9BQU87VUFDakJDLFNBQVMsRUFBRTtRQUNiLENBQUM7TUFDSDtJQUNGLENBQUM7RUFFTDtBQUNGLENBQUM7QUFFRCxlQUFlN0MsTUFBTSJ9