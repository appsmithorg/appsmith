function cov_269y3v3m6z() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/QRGeneratorWidget/index.ts";
  var hash = "f1b4c0bd1e7fd7c313f31b976431ffff88920065";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/QRGeneratorWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 6,
          column: 22
        },
        end: {
          line: 35,
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
    hash: "f1b4c0bd1e7fd7c313f31b976431ffff88920065"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_269y3v3m6z = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_269y3v3m6z();
import { DEFAULT_FONT_SIZE } from "constants/WidgetConstants";
import { OverflowTypes } from "./constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_269y3v3m6z().s[0]++, {
  type: Widget.getWidgetType(),
  name: "QRGenerator",
  iconSVG: IconSVG,
  searchTags: ["typography", "paragraph", "label"],
  defaults: {
    text: "Label",
    fontSize: DEFAULT_FONT_SIZE,
    fontStyle: "BOLD",
    textAlign: "LEFT",
    textColor: "#231F20",
    truncateButtonColor: "#FFC13D",
    rows: 4,
    columns: 16,
    widgetName: "QRGenerator",
    shouldTruncate: false,
    overflow: OverflowTypes.NONE,
    version: 1,
    animateLoading: true
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
    autocompleteDefinitions: Widget.getAutocompleteDefinitions()
  }
});
export default Widget;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMjY5eTN2M202eiIsImFjdHVhbENvdmVyYWdlIiwiREVGQVVMVF9GT05UX1NJWkUiLCJPdmVyZmxvd1R5cGVzIiwiSWNvblNWRyIsIldpZGdldCIsIkNPTkZJRyIsInMiLCJ0eXBlIiwiZ2V0V2lkZ2V0VHlwZSIsIm5hbWUiLCJpY29uU1ZHIiwic2VhcmNoVGFncyIsImRlZmF1bHRzIiwidGV4dCIsImZvbnRTaXplIiwiZm9udFN0eWxlIiwidGV4dEFsaWduIiwidGV4dENvbG9yIiwidHJ1bmNhdGVCdXR0b25Db2xvciIsInJvd3MiLCJjb2x1bW5zIiwid2lkZ2V0TmFtZSIsInNob3VsZFRydW5jYXRlIiwib3ZlcmZsb3ciLCJOT05FIiwidmVyc2lvbiIsImFuaW1hdGVMb2FkaW5nIiwicHJvcGVydGllcyIsImRlcml2ZWQiLCJnZXREZXJpdmVkUHJvcGVydGllc01hcCIsImRlZmF1bHQiLCJnZXREZWZhdWx0UHJvcGVydGllc01hcCIsIm1ldGEiLCJnZXRNZXRhUHJvcGVydGllc01hcCIsImNvbmZpZyIsImdldFByb3BlcnR5UGFuZUNvbmZpZyIsImNvbnRlbnRDb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnIiwic3R5bGVDb25maWciLCJnZXRQcm9wZXJ0eVBhbmVTdHlsZUNvbmZpZyIsImF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiXSwic291cmNlcyI6WyJpbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBERUZBVUxUX0ZPTlRfU0laRSB9IGZyb20gXCJjb25zdGFudHMvV2lkZ2V0Q29uc3RhbnRzXCI7XG5pbXBvcnQgeyBPdmVyZmxvd1R5cGVzIH0gZnJvbSBcIi4vY29uc3RhbnRzXCI7XG5pbXBvcnQgSWNvblNWRyBmcm9tIFwiLi9pY29uLnN2Z1wiO1xuaW1wb3J0IFdpZGdldCBmcm9tIFwiLi93aWRnZXRcIjtcblxuZXhwb3J0IGNvbnN0IENPTkZJRyA9IHtcbiAgdHlwZTogV2lkZ2V0LmdldFdpZGdldFR5cGUoKSxcbiAgbmFtZTogXCJRUkdlbmVyYXRvclwiLFxuICBpY29uU1ZHOiBJY29uU1ZHLFxuICBzZWFyY2hUYWdzOiBbXCJ0eXBvZ3JhcGh5XCIsIFwicGFyYWdyYXBoXCIsIFwibGFiZWxcIl0sXG4gIGRlZmF1bHRzOiB7XG4gICAgdGV4dDogXCJMYWJlbFwiLFxuICAgIGZvbnRTaXplOiBERUZBVUxUX0ZPTlRfU0laRSxcbiAgICBmb250U3R5bGU6IFwiQk9MRFwiLFxuICAgIHRleHRBbGlnbjogXCJMRUZUXCIsXG4gICAgdGV4dENvbG9yOiBcIiMyMzFGMjBcIixcbiAgICB0cnVuY2F0ZUJ1dHRvbkNvbG9yOiBcIiNGRkMxM0RcIixcbiAgICByb3dzOiA0LFxuICAgIGNvbHVtbnM6IDE2LFxuICAgIHdpZGdldE5hbWU6IFwiUVJHZW5lcmF0b3JcIixcbiAgICBzaG91bGRUcnVuY2F0ZTogZmFsc2UsXG4gICAgb3ZlcmZsb3c6IE92ZXJmbG93VHlwZXMuTk9ORSxcbiAgICB2ZXJzaW9uOiAxLFxuICAgIGFuaW1hdGVMb2FkaW5nOiB0cnVlLFxuICB9LFxuICBwcm9wZXJ0aWVzOiB7XG4gICAgZGVyaXZlZDogV2lkZ2V0LmdldERlcml2ZWRQcm9wZXJ0aWVzTWFwKCksXG4gICAgZGVmYXVsdDogV2lkZ2V0LmdldERlZmF1bHRQcm9wZXJ0aWVzTWFwKCksXG4gICAgbWV0YTogV2lkZ2V0LmdldE1ldGFQcm9wZXJ0aWVzTWFwKCksXG4gICAgY29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lQ29uZmlnKCksXG4gICAgY29udGVudENvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbnRlbnRDb25maWcoKSxcbiAgICBzdHlsZUNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZVN0eWxlQ29uZmlnKCksXG4gICAgYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnM6IFdpZGdldC5nZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucygpLFxuICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgV2lkZ2V0O1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGNBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGNBQUE7QUFmWixTQUFTRSxpQkFBaUIsUUFBUSwyQkFBMkI7QUFDN0QsU0FBU0MsYUFBYSxRQUFRLGFBQWE7QUFDM0MsT0FBT0MsT0FBTyxNQUFNLFlBQVk7QUFDaEMsT0FBT0MsTUFBTSxNQUFNLFVBQVU7QUFFN0IsT0FBTyxNQUFNQyxNQUFNLElBQUFOLGNBQUEsR0FBQU8sQ0FBQSxPQUFHO0VBQ3BCQyxJQUFJLEVBQUVILE1BQU0sQ0FBQ0ksYUFBYSxDQUFDLENBQUM7RUFDNUJDLElBQUksRUFBRSxhQUFhO0VBQ25CQyxPQUFPLEVBQUVQLE9BQU87RUFDaEJRLFVBQVUsRUFBRSxDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsT0FBTyxDQUFDO0VBQ2hEQyxRQUFRLEVBQUU7SUFDUkMsSUFBSSxFQUFFLE9BQU87SUFDYkMsUUFBUSxFQUFFYixpQkFBaUI7SUFDM0JjLFNBQVMsRUFBRSxNQUFNO0lBQ2pCQyxTQUFTLEVBQUUsTUFBTTtJQUNqQkMsU0FBUyxFQUFFLFNBQVM7SUFDcEJDLG1CQUFtQixFQUFFLFNBQVM7SUFDOUJDLElBQUksRUFBRSxDQUFDO0lBQ1BDLE9BQU8sRUFBRSxFQUFFO0lBQ1hDLFVBQVUsRUFBRSxhQUFhO0lBQ3pCQyxjQUFjLEVBQUUsS0FBSztJQUNyQkMsUUFBUSxFQUFFckIsYUFBYSxDQUFDc0IsSUFBSTtJQUM1QkMsT0FBTyxFQUFFLENBQUM7SUFDVkMsY0FBYyxFQUFFO0VBQ2xCLENBQUM7RUFDREMsVUFBVSxFQUFFO0lBQ1ZDLE9BQU8sRUFBRXhCLE1BQU0sQ0FBQ3lCLHVCQUF1QixDQUFDLENBQUM7SUFDekNDLE9BQU8sRUFBRTFCLE1BQU0sQ0FBQzJCLHVCQUF1QixDQUFDLENBQUM7SUFDekNDLElBQUksRUFBRTVCLE1BQU0sQ0FBQzZCLG9CQUFvQixDQUFDLENBQUM7SUFDbkNDLE1BQU0sRUFBRTlCLE1BQU0sQ0FBQytCLHFCQUFxQixDQUFDLENBQUM7SUFDdENDLGFBQWEsRUFBRWhDLE1BQU0sQ0FBQ2lDLDRCQUE0QixDQUFDLENBQUM7SUFDcERDLFdBQVcsRUFBRWxDLE1BQU0sQ0FBQ21DLDBCQUEwQixDQUFDLENBQUM7SUFDaERDLHVCQUF1QixFQUFFcEMsTUFBTSxDQUFDcUMsMEJBQTBCLENBQUM7RUFDN0Q7QUFDRixDQUFDO0FBRUQsZUFBZXJDLE1BQU0ifQ==