function cov_1hpqagnomx() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/CodeScannerWidget/index.ts";
  var hash = "8ccd33870a7e6f4341eb8a93c9ab64adb3d23d25";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/CodeScannerWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 7,
          column: 22
        },
        end: {
          line: 57,
          column: 1
        }
      },
      "1": {
        start: {
          line: 49,
          column: 10
        },
        end: {
          line: 52,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 48,
            column: 23
          },
          end: {
            line: 48,
            column: 24
          }
        },
        loc: {
          start: {
            line: 48,
            column: 29
          },
          end: {
            line: 53,
            column: 9
          }
        },
        line: 48
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
    hash: "8ccd33870a7e6f4341eb8a93c9ab64adb3d23d25"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1hpqagnomx = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1hpqagnomx();
import IconSVG from "./icon.svg";
import Widget from "./widget";
import { ButtonPlacementTypes } from "components/constants";
import { ScannerLayout } from "./constants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
export const CONFIG = (cov_1hpqagnomx().s[0]++, {
  type: Widget.getWidgetType(),
  name: "Code Scanner",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["barcode scanner", "qr scanner", "code detector", "barcode reader"],
  defaults: {
    rows: 33,
    label: "Scan a QR/Barcode",
    columns: 25,
    widgetName: "CodeScanner",
    isDefaultClickDisabled: true,
    scannerLayout: ScannerLayout.ALWAYS_ON,
    version: 1,
    isRequired: false,
    isDisabled: false,
    animateLoading: true,
    placement: ButtonPlacementTypes.CENTER,
    responsiveBehavior: ResponsiveBehavior.Fill
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    stylesheetConfig: Widget.getStylesheetConfig(),
    autocompleteDefinitions: Widget.getAutocompleteDefinitions()
  },
  autoLayout: {
    disabledPropsDefaults: {
      scannerLayout: ScannerLayout.ALWAYS_ON
    },
    widgetSize: [{
      viewportMinWidth: 0,
      configuration: () => {
        cov_1hpqagnomx().f[0]++;
        cov_1hpqagnomx().s[1]++;
        return {
          minWidth: "280px",
          minHeight: "300px"
        };
      }
    }]
  }
});
export default Widget;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMWhwcWFnbm9teCIsImFjdHVhbENvdmVyYWdlIiwiSWNvblNWRyIsIldpZGdldCIsIkJ1dHRvblBsYWNlbWVudFR5cGVzIiwiU2Nhbm5lckxheW91dCIsIlJlc3BvbnNpdmVCZWhhdmlvciIsIkNPTkZJRyIsInMiLCJ0eXBlIiwiZ2V0V2lkZ2V0VHlwZSIsIm5hbWUiLCJpY29uU1ZHIiwibmVlZHNNZXRhIiwic2VhcmNoVGFncyIsImRlZmF1bHRzIiwicm93cyIsImxhYmVsIiwiY29sdW1ucyIsIndpZGdldE5hbWUiLCJpc0RlZmF1bHRDbGlja0Rpc2FibGVkIiwic2Nhbm5lckxheW91dCIsIkFMV0FZU19PTiIsInZlcnNpb24iLCJpc1JlcXVpcmVkIiwiaXNEaXNhYmxlZCIsImFuaW1hdGVMb2FkaW5nIiwicGxhY2VtZW50IiwiQ0VOVEVSIiwicmVzcG9uc2l2ZUJlaGF2aW9yIiwiRmlsbCIsInByb3BlcnRpZXMiLCJkZXJpdmVkIiwiZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAiLCJkZWZhdWx0IiwiZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAiLCJtZXRhIiwiZ2V0TWV0YVByb3BlcnRpZXNNYXAiLCJzdHlsZUNvbmZpZyIsImdldFByb3BlcnR5UGFuZVN0eWxlQ29uZmlnIiwiY29udGVudENvbmZpZyIsImdldFByb3BlcnR5UGFuZUNvbnRlbnRDb25maWciLCJzdHlsZXNoZWV0Q29uZmlnIiwiZ2V0U3R5bGVzaGVldENvbmZpZyIsImF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiLCJhdXRvTGF5b3V0IiwiZGlzYWJsZWRQcm9wc0RlZmF1bHRzIiwid2lkZ2V0U2l6ZSIsInZpZXdwb3J0TWluV2lkdGgiLCJjb25maWd1cmF0aW9uIiwiZiIsIm1pbldpZHRoIiwibWluSGVpZ2h0Il0sInNvdXJjZXMiOlsiaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEljb25TVkcgZnJvbSBcIi4vaWNvbi5zdmdcIjtcbmltcG9ydCBXaWRnZXQgZnJvbSBcIi4vd2lkZ2V0XCI7XG5pbXBvcnQgeyBCdXR0b25QbGFjZW1lbnRUeXBlcyB9IGZyb20gXCJjb21wb25lbnRzL2NvbnN0YW50c1wiO1xuaW1wb3J0IHsgU2Nhbm5lckxheW91dCB9IGZyb20gXCIuL2NvbnN0YW50c1wiO1xuaW1wb3J0IHsgUmVzcG9uc2l2ZUJlaGF2aW9yIH0gZnJvbSBcInV0aWxzL2F1dG9MYXlvdXQvY29uc3RhbnRzXCI7XG5cbmV4cG9ydCBjb25zdCBDT05GSUcgPSB7XG4gIHR5cGU6IFdpZGdldC5nZXRXaWRnZXRUeXBlKCksXG4gIG5hbWU6IFwiQ29kZSBTY2FubmVyXCIsXG4gIGljb25TVkc6IEljb25TVkcsXG4gIG5lZWRzTWV0YTogdHJ1ZSxcbiAgc2VhcmNoVGFnczogW1xuICAgIFwiYmFyY29kZSBzY2FubmVyXCIsXG4gICAgXCJxciBzY2FubmVyXCIsXG4gICAgXCJjb2RlIGRldGVjdG9yXCIsXG4gICAgXCJiYXJjb2RlIHJlYWRlclwiLFxuICBdLFxuICBkZWZhdWx0czoge1xuICAgIHJvd3M6IDMzLFxuICAgIGxhYmVsOiBcIlNjYW4gYSBRUi9CYXJjb2RlXCIsXG4gICAgY29sdW1uczogMjUsXG4gICAgd2lkZ2V0TmFtZTogXCJDb2RlU2Nhbm5lclwiLFxuICAgIGlzRGVmYXVsdENsaWNrRGlzYWJsZWQ6IHRydWUsXG4gICAgc2Nhbm5lckxheW91dDogU2Nhbm5lckxheW91dC5BTFdBWVNfT04sXG4gICAgdmVyc2lvbjogMSxcbiAgICBpc1JlcXVpcmVkOiBmYWxzZSxcbiAgICBpc0Rpc2FibGVkOiBmYWxzZSxcbiAgICBhbmltYXRlTG9hZGluZzogdHJ1ZSxcbiAgICBwbGFjZW1lbnQ6IEJ1dHRvblBsYWNlbWVudFR5cGVzLkNFTlRFUixcbiAgICByZXNwb25zaXZlQmVoYXZpb3I6IFJlc3BvbnNpdmVCZWhhdmlvci5GaWxsLFxuICB9LFxuICBwcm9wZXJ0aWVzOiB7XG4gICAgZGVyaXZlZDogV2lkZ2V0LmdldERlcml2ZWRQcm9wZXJ0aWVzTWFwKCksXG4gICAgZGVmYXVsdDogV2lkZ2V0LmdldERlZmF1bHRQcm9wZXJ0aWVzTWFwKCksXG4gICAgbWV0YTogV2lkZ2V0LmdldE1ldGFQcm9wZXJ0aWVzTWFwKCksXG4gICAgc3R5bGVDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVTdHlsZUNvbmZpZygpLFxuICAgIGNvbnRlbnRDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnKCksXG4gICAgc3R5bGVzaGVldENvbmZpZzogV2lkZ2V0LmdldFN0eWxlc2hlZXRDb25maWcoKSxcbiAgICBhdXRvY29tcGxldGVEZWZpbml0aW9uczogV2lkZ2V0LmdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zKCksXG4gIH0sXG4gIGF1dG9MYXlvdXQ6IHtcbiAgICBkaXNhYmxlZFByb3BzRGVmYXVsdHM6IHtcbiAgICAgIHNjYW5uZXJMYXlvdXQ6IFNjYW5uZXJMYXlvdXQuQUxXQVlTX09OLFxuICAgIH0sXG4gICAgd2lkZ2V0U2l6ZTogW1xuICAgICAge1xuICAgICAgICB2aWV3cG9ydE1pbldpZHRoOiAwLFxuICAgICAgICBjb25maWd1cmF0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1pbldpZHRoOiBcIjI4MHB4XCIsXG4gICAgICAgICAgICBtaW5IZWlnaHQ6IFwiMzAwcHhcIixcbiAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdLFxuICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgV2lkZ2V0O1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsY0FBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsY0FBQTtBQWZaLE9BQU9FLE9BQU8sTUFBTSxZQUFZO0FBQ2hDLE9BQU9DLE1BQU0sTUFBTSxVQUFVO0FBQzdCLFNBQVNDLG9CQUFvQixRQUFRLHNCQUFzQjtBQUMzRCxTQUFTQyxhQUFhLFFBQVEsYUFBYTtBQUMzQyxTQUFTQyxrQkFBa0IsUUFBUSw0QkFBNEI7QUFFL0QsT0FBTyxNQUFNQyxNQUFNLElBQUFQLGNBQUEsR0FBQVEsQ0FBQSxPQUFHO0VBQ3BCQyxJQUFJLEVBQUVOLE1BQU0sQ0FBQ08sYUFBYSxDQUFDLENBQUM7RUFDNUJDLElBQUksRUFBRSxjQUFjO0VBQ3BCQyxPQUFPLEVBQUVWLE9BQU87RUFDaEJXLFNBQVMsRUFBRSxJQUFJO0VBQ2ZDLFVBQVUsRUFBRSxDQUNWLGlCQUFpQixFQUNqQixZQUFZLEVBQ1osZUFBZSxFQUNmLGdCQUFnQixDQUNqQjtFQUNEQyxRQUFRLEVBQUU7SUFDUkMsSUFBSSxFQUFFLEVBQUU7SUFDUkMsS0FBSyxFQUFFLG1CQUFtQjtJQUMxQkMsT0FBTyxFQUFFLEVBQUU7SUFDWEMsVUFBVSxFQUFFLGFBQWE7SUFDekJDLHNCQUFzQixFQUFFLElBQUk7SUFDNUJDLGFBQWEsRUFBRWhCLGFBQWEsQ0FBQ2lCLFNBQVM7SUFDdENDLE9BQU8sRUFBRSxDQUFDO0lBQ1ZDLFVBQVUsRUFBRSxLQUFLO0lBQ2pCQyxVQUFVLEVBQUUsS0FBSztJQUNqQkMsY0FBYyxFQUFFLElBQUk7SUFDcEJDLFNBQVMsRUFBRXZCLG9CQUFvQixDQUFDd0IsTUFBTTtJQUN0Q0Msa0JBQWtCLEVBQUV2QixrQkFBa0IsQ0FBQ3dCO0VBQ3pDLENBQUM7RUFDREMsVUFBVSxFQUFFO0lBQ1ZDLE9BQU8sRUFBRTdCLE1BQU0sQ0FBQzhCLHVCQUF1QixDQUFDLENBQUM7SUFDekNDLE9BQU8sRUFBRS9CLE1BQU0sQ0FBQ2dDLHVCQUF1QixDQUFDLENBQUM7SUFDekNDLElBQUksRUFBRWpDLE1BQU0sQ0FBQ2tDLG9CQUFvQixDQUFDLENBQUM7SUFDbkNDLFdBQVcsRUFBRW5DLE1BQU0sQ0FBQ29DLDBCQUEwQixDQUFDLENBQUM7SUFDaERDLGFBQWEsRUFBRXJDLE1BQU0sQ0FBQ3NDLDRCQUE0QixDQUFDLENBQUM7SUFDcERDLGdCQUFnQixFQUFFdkMsTUFBTSxDQUFDd0MsbUJBQW1CLENBQUMsQ0FBQztJQUM5Q0MsdUJBQXVCLEVBQUV6QyxNQUFNLENBQUMwQywwQkFBMEIsQ0FBQztFQUM3RCxDQUFDO0VBQ0RDLFVBQVUsRUFBRTtJQUNWQyxxQkFBcUIsRUFBRTtNQUNyQjFCLGFBQWEsRUFBRWhCLGFBQWEsQ0FBQ2lCO0lBQy9CLENBQUM7SUFDRDBCLFVBQVUsRUFBRSxDQUNWO01BQ0VDLGdCQUFnQixFQUFFLENBQUM7TUFDbkJDLGFBQWEsRUFBRUEsQ0FBQSxLQUFNO1FBQUFsRCxjQUFBLEdBQUFtRCxDQUFBO1FBQUFuRCxjQUFBLEdBQUFRLENBQUE7UUFDbkIsT0FBTztVQUNMNEMsUUFBUSxFQUFFLE9BQU87VUFDakJDLFNBQVMsRUFBRTtRQUNiLENBQUM7TUFDSDtJQUNGLENBQUM7RUFFTDtBQUNGLENBQUM7QUFFRCxlQUFlbEQsTUFBTSJ9