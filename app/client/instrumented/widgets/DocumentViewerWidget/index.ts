function cov_1w9uekdu4n() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/DocumentViewerWidget/index.ts";
  var hash = "32cebed7909d9447008f51ae0cda2b5d26f9237c";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/DocumentViewerWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 6,
          column: 28
        },
        end: {
          line: 6,
          column: 41
        }
      },
      "1": {
        start: {
          line: 8,
          column: 22
        },
        end: {
          line: 47,
          column: 1
        }
      },
      "2": {
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
    branchMap: {
      "0": {
        loc: {
          start: {
            line: 17,
            column: 12
          },
          end: {
            line: 19,
            column: 10
          }
        },
        type: "cond-expr",
        locations: [{
          start: {
            line: 18,
            column: 8
          },
          end: {
            line: 18,
            column: 90
          }
        }, {
          start: {
            line: 19,
            column: 8
          },
          end: {
            line: 19,
            column: 10
          }
        }],
        line: 17
      }
    },
    s: {
      "0": 0,
      "1": 0,
      "2": 0
    },
    f: {
      "0": 0
    },
    b: {
      "0": [0, 0]
    },
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "32cebed7909d9447008f51ae0cda2b5d26f9237c"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1w9uekdu4n = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1w9uekdu4n();
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
const isAirgappedInstance = (cov_1w9uekdu4n().s[0]++, isAirgapped());
export const CONFIG = (cov_1w9uekdu4n().s[1]++, {
  type: Widget.getWidgetType(),
  name: "Document Viewer",
  // The display name which will be made in uppercase and show in the widgets panel ( can have spaces )
  iconSVG: IconSVG,
  needsMeta: false,
  // Defines if this widget adds any meta properties
  isCanvas: false,
  // Defines if this widget has a canvas within in which we can drop other widgets
  searchTags: ["pdf"],
  defaults: {
    widgetName: "DocumentViewer",
    docUrl: !isAirgappedInstance ? (cov_1w9uekdu4n().b[0][0]++, "https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-file.pdf") : (cov_1w9uekdu4n().b[0][1]++, ""),
    rows: 40,
    columns: 24,
    version: 1,
    animateLoading: true,
    responsiveBehavior: ResponsiveBehavior.Fill
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    autocompleteDefinitions: Widget.getAutocompleteDefinitions()
  },
  autoLayout: {
    widgetSize: [{
      viewportMinWidth: 0,
      configuration: () => {
        cov_1w9uekdu4n().f[0]++;
        cov_1w9uekdu4n().s[2]++;
        return {
          minWidth: "280px",
          minHeight: "280px"
        };
      }
    }]
  }
});
export default Widget;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMXc5dWVrZHU0biIsImFjdHVhbENvdmVyYWdlIiwiUmVzcG9uc2l2ZUJlaGF2aW9yIiwiSWNvblNWRyIsIldpZGdldCIsImlzQWlyZ2FwcGVkIiwiaXNBaXJnYXBwZWRJbnN0YW5jZSIsInMiLCJDT05GSUciLCJ0eXBlIiwiZ2V0V2lkZ2V0VHlwZSIsIm5hbWUiLCJpY29uU1ZHIiwibmVlZHNNZXRhIiwiaXNDYW52YXMiLCJzZWFyY2hUYWdzIiwiZGVmYXVsdHMiLCJ3aWRnZXROYW1lIiwiZG9jVXJsIiwiYiIsInJvd3MiLCJjb2x1bW5zIiwidmVyc2lvbiIsImFuaW1hdGVMb2FkaW5nIiwicmVzcG9uc2l2ZUJlaGF2aW9yIiwiRmlsbCIsInByb3BlcnRpZXMiLCJkZXJpdmVkIiwiZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAiLCJkZWZhdWx0IiwiZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAiLCJtZXRhIiwiZ2V0TWV0YVByb3BlcnRpZXNNYXAiLCJjb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb25maWciLCJjb250ZW50Q29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lQ29udGVudENvbmZpZyIsImF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiLCJhdXRvTGF5b3V0Iiwid2lkZ2V0U2l6ZSIsInZpZXdwb3J0TWluV2lkdGgiLCJjb25maWd1cmF0aW9uIiwiZiIsIm1pbldpZHRoIiwibWluSGVpZ2h0Il0sInNvdXJjZXMiOlsiaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUmVzcG9uc2l2ZUJlaGF2aW9yIH0gZnJvbSBcInV0aWxzL2F1dG9MYXlvdXQvY29uc3RhbnRzXCI7XG5pbXBvcnQgSWNvblNWRyBmcm9tIFwiLi9pY29uLnN2Z1wiO1xuaW1wb3J0IFdpZGdldCBmcm9tIFwiLi93aWRnZXRcIjtcbmltcG9ydCB7IGlzQWlyZ2FwcGVkIH0gZnJvbSBcIkBhcHBzbWl0aC91dGlscy9haXJnYXBIZWxwZXJzXCI7XG5cbmNvbnN0IGlzQWlyZ2FwcGVkSW5zdGFuY2UgPSBpc0FpcmdhcHBlZCgpO1xuXG5leHBvcnQgY29uc3QgQ09ORklHID0ge1xuICB0eXBlOiBXaWRnZXQuZ2V0V2lkZ2V0VHlwZSgpLFxuICBuYW1lOiBcIkRvY3VtZW50IFZpZXdlclwiLCAvLyBUaGUgZGlzcGxheSBuYW1lIHdoaWNoIHdpbGwgYmUgbWFkZSBpbiB1cHBlcmNhc2UgYW5kIHNob3cgaW4gdGhlIHdpZGdldHMgcGFuZWwgKCBjYW4gaGF2ZSBzcGFjZXMgKVxuICBpY29uU1ZHOiBJY29uU1ZHLFxuICBuZWVkc01ldGE6IGZhbHNlLCAvLyBEZWZpbmVzIGlmIHRoaXMgd2lkZ2V0IGFkZHMgYW55IG1ldGEgcHJvcGVydGllc1xuICBpc0NhbnZhczogZmFsc2UsIC8vIERlZmluZXMgaWYgdGhpcyB3aWRnZXQgaGFzIGEgY2FudmFzIHdpdGhpbiBpbiB3aGljaCB3ZSBjYW4gZHJvcCBvdGhlciB3aWRnZXRzXG4gIHNlYXJjaFRhZ3M6IFtcInBkZlwiXSxcbiAgZGVmYXVsdHM6IHtcbiAgICB3aWRnZXROYW1lOiBcIkRvY3VtZW50Vmlld2VyXCIsXG4gICAgZG9jVXJsOiAhaXNBaXJnYXBwZWRJbnN0YW5jZVxuICAgICAgPyBcImh0dHBzOi8vd3d3LmxlYXJuaW5nY29udGFpbmVyLmNvbS93cC1jb250ZW50L3VwbG9hZHMvMjAxOS8wOS9zYW1wbGUtcGRmLWZpbGUucGRmXCJcbiAgICAgIDogXCJcIixcbiAgICByb3dzOiA0MCxcbiAgICBjb2x1bW5zOiAyNCxcbiAgICB2ZXJzaW9uOiAxLFxuICAgIGFuaW1hdGVMb2FkaW5nOiB0cnVlLFxuICAgIHJlc3BvbnNpdmVCZWhhdmlvcjogUmVzcG9uc2l2ZUJlaGF2aW9yLkZpbGwsXG4gIH0sXG4gIHByb3BlcnRpZXM6IHtcbiAgICBkZXJpdmVkOiBXaWRnZXQuZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAoKSxcbiAgICBkZWZhdWx0OiBXaWRnZXQuZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAoKSxcbiAgICBtZXRhOiBXaWRnZXQuZ2V0TWV0YVByb3BlcnRpZXNNYXAoKSxcbiAgICBjb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVDb25maWcoKSxcbiAgICBjb250ZW50Q29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lQ29udGVudENvbmZpZygpLFxuICAgIGF1dG9jb21wbGV0ZURlZmluaXRpb25zOiBXaWRnZXQuZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMoKSxcbiAgfSxcbiAgYXV0b0xheW91dDoge1xuICAgIHdpZGdldFNpemU6IFtcbiAgICAgIHtcbiAgICAgICAgdmlld3BvcnRNaW5XaWR0aDogMCxcbiAgICAgICAgY29uZmlndXJhdGlvbjogKCkgPT4ge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtaW5XaWR0aDogXCIyODBweFwiLFxuICAgICAgICAgICAgbWluSGVpZ2h0OiBcIjI4MHB4XCIsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFdpZGdldDtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsY0FBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsY0FBQTtBQWZaLFNBQVNFLGtCQUFrQixRQUFRLDRCQUE0QjtBQUMvRCxPQUFPQyxPQUFPLE1BQU0sWUFBWTtBQUNoQyxPQUFPQyxNQUFNLE1BQU0sVUFBVTtBQUM3QixTQUFTQyxXQUFXLFFBQVEsK0JBQStCO0FBRTNELE1BQU1DLG1CQUFtQixJQUFBTixjQUFBLEdBQUFPLENBQUEsT0FBR0YsV0FBVyxDQUFDLENBQUM7QUFFekMsT0FBTyxNQUFNRyxNQUFNLElBQUFSLGNBQUEsR0FBQU8sQ0FBQSxPQUFHO0VBQ3BCRSxJQUFJLEVBQUVMLE1BQU0sQ0FBQ00sYUFBYSxDQUFDLENBQUM7RUFDNUJDLElBQUksRUFBRSxpQkFBaUI7RUFBRTtFQUN6QkMsT0FBTyxFQUFFVCxPQUFPO0VBQ2hCVSxTQUFTLEVBQUUsS0FBSztFQUFFO0VBQ2xCQyxRQUFRLEVBQUUsS0FBSztFQUFFO0VBQ2pCQyxVQUFVLEVBQUUsQ0FBQyxLQUFLLENBQUM7RUFDbkJDLFFBQVEsRUFBRTtJQUNSQyxVQUFVLEVBQUUsZ0JBQWdCO0lBQzVCQyxNQUFNLEVBQUUsQ0FBQ1osbUJBQW1CLElBQUFOLGNBQUEsR0FBQW1CLENBQUEsVUFDeEIsa0ZBQWtGLEtBQUFuQixjQUFBLEdBQUFtQixDQUFBLFVBQ2xGLEVBQUU7SUFDTkMsSUFBSSxFQUFFLEVBQUU7SUFDUkMsT0FBTyxFQUFFLEVBQUU7SUFDWEMsT0FBTyxFQUFFLENBQUM7SUFDVkMsY0FBYyxFQUFFLElBQUk7SUFDcEJDLGtCQUFrQixFQUFFdEIsa0JBQWtCLENBQUN1QjtFQUN6QyxDQUFDO0VBQ0RDLFVBQVUsRUFBRTtJQUNWQyxPQUFPLEVBQUV2QixNQUFNLENBQUN3Qix1QkFBdUIsQ0FBQyxDQUFDO0lBQ3pDQyxPQUFPLEVBQUV6QixNQUFNLENBQUMwQix1QkFBdUIsQ0FBQyxDQUFDO0lBQ3pDQyxJQUFJLEVBQUUzQixNQUFNLENBQUM0QixvQkFBb0IsQ0FBQyxDQUFDO0lBQ25DQyxNQUFNLEVBQUU3QixNQUFNLENBQUM4QixxQkFBcUIsQ0FBQyxDQUFDO0lBQ3RDQyxhQUFhLEVBQUUvQixNQUFNLENBQUNnQyw0QkFBNEIsQ0FBQyxDQUFDO0lBQ3BEQyx1QkFBdUIsRUFBRWpDLE1BQU0sQ0FBQ2tDLDBCQUEwQixDQUFDO0VBQzdELENBQUM7RUFDREMsVUFBVSxFQUFFO0lBQ1ZDLFVBQVUsRUFBRSxDQUNWO01BQ0VDLGdCQUFnQixFQUFFLENBQUM7TUFDbkJDLGFBQWEsRUFBRUEsQ0FBQSxLQUFNO1FBQUExQyxjQUFBLEdBQUEyQyxDQUFBO1FBQUEzQyxjQUFBLEdBQUFPLENBQUE7UUFDbkIsT0FBTztVQUNMcUMsUUFBUSxFQUFFLE9BQU87VUFDakJDLFNBQVMsRUFBRTtRQUNiLENBQUM7TUFDSDtJQUNGLENBQUM7RUFFTDtBQUNGLENBQUM7QUFFRCxlQUFlekMsTUFBTSJ9