function cov_1yjl4wld53() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/AudioWidget/index.tsx";
  var hash = "3977f239eca868fbe1273f9ed6e110c9f0efe6da";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/AudioWidget/index.tsx",
    statementMap: {
      "0": {
        start: {
          line: 9,
          column: 22
        },
        end: {
          line: 50,
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
    hash: "3977f239eca868fbe1273f9ed6e110c9f0efe6da"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1yjl4wld53 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1yjl4wld53();
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
export const CONFIG = (cov_1yjl4wld53().s[0]++, {
  type: Widget.getWidgetType(),
  name: "Audio",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["mp3", "sound", "wave", "player"],
  defaults: {
    rows: 4,
    columns: 28,
    widgetName: "Audio",
    url: getAssetUrl(`${ASSETS_CDN_URL}/widgets/birds_chirping.mp3`),
    autoPlay: false,
    version: 1,
    animateLoading: true,
    responsiveBehavior: ResponsiveBehavior.Fill,
    minWidth: FILL_WIDGET_MIN_WIDTH
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
        cov_1yjl4wld53().f[0]++;
        cov_1yjl4wld53().s[1]++;
        return {
          minWidth: "180px",
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMXlqbDR3bGQ1MyIsImFjdHVhbENvdmVyYWdlIiwiRklMTF9XSURHRVRfTUlOX1dJRFRIIiwiUmVzcG9uc2l2ZUJlaGF2aW9yIiwiSWNvblNWRyIsIldpZGdldCIsIkFTU0VUU19DRE5fVVJMIiwiZ2V0QXNzZXRVcmwiLCJDT05GSUciLCJzIiwidHlwZSIsImdldFdpZGdldFR5cGUiLCJuYW1lIiwiaWNvblNWRyIsIm5lZWRzTWV0YSIsInNlYXJjaFRhZ3MiLCJkZWZhdWx0cyIsInJvd3MiLCJjb2x1bW5zIiwid2lkZ2V0TmFtZSIsInVybCIsImF1dG9QbGF5IiwidmVyc2lvbiIsImFuaW1hdGVMb2FkaW5nIiwicmVzcG9uc2l2ZUJlaGF2aW9yIiwiRmlsbCIsIm1pbldpZHRoIiwicHJvcGVydGllcyIsImRlcml2ZWQiLCJnZXREZXJpdmVkUHJvcGVydGllc01hcCIsImRlZmF1bHQiLCJnZXREZWZhdWx0UHJvcGVydGllc01hcCIsIm1ldGEiLCJnZXRNZXRhUHJvcGVydGllc01hcCIsImNvbmZpZyIsImdldFByb3BlcnR5UGFuZUNvbmZpZyIsImNvbnRlbnRDb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnIiwiYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiLCJnZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucyIsImF1dG9MYXlvdXQiLCJ3aWRnZXRTaXplIiwidmlld3BvcnRNaW5XaWR0aCIsImNvbmZpZ3VyYXRpb24iLCJmIiwibWluSGVpZ2h0IiwiZGlzYWJsZVJlc2l6ZUhhbmRsZXMiLCJ2ZXJ0aWNhbCJdLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBGSUxMX1dJREdFVF9NSU5fV0lEVEggfSBmcm9tIFwiY29uc3RhbnRzL21pbldpZHRoQ29uc3RhbnRzXCI7XG5pbXBvcnQgeyBSZXNwb25zaXZlQmVoYXZpb3IgfSBmcm9tIFwidXRpbHMvYXV0b0xheW91dC9jb25zdGFudHNcIjtcblxuaW1wb3J0IEljb25TVkcgZnJvbSBcIi4vaWNvbi5zdmdcIjtcbmltcG9ydCBXaWRnZXQgZnJvbSBcIi4vd2lkZ2V0XCI7XG5pbXBvcnQgeyBBU1NFVFNfQ0ROX1VSTCB9IGZyb20gXCJjb25zdGFudHMvVGhpcmRQYXJ0eUNvbnN0YW50c1wiO1xuaW1wb3J0IHsgZ2V0QXNzZXRVcmwgfSBmcm9tIFwiQGFwcHNtaXRoL3V0aWxzL2FpcmdhcEhlbHBlcnNcIjtcblxuZXhwb3J0IGNvbnN0IENPTkZJRyA9IHtcbiAgdHlwZTogV2lkZ2V0LmdldFdpZGdldFR5cGUoKSxcbiAgbmFtZTogXCJBdWRpb1wiLFxuICBpY29uU1ZHOiBJY29uU1ZHLFxuICBuZWVkc01ldGE6IHRydWUsXG4gIHNlYXJjaFRhZ3M6IFtcIm1wM1wiLCBcInNvdW5kXCIsIFwid2F2ZVwiLCBcInBsYXllclwiXSxcbiAgZGVmYXVsdHM6IHtcbiAgICByb3dzOiA0LFxuICAgIGNvbHVtbnM6IDI4LFxuICAgIHdpZGdldE5hbWU6IFwiQXVkaW9cIixcbiAgICB1cmw6IGdldEFzc2V0VXJsKGAke0FTU0VUU19DRE5fVVJMfS93aWRnZXRzL2JpcmRzX2NoaXJwaW5nLm1wM2ApLFxuICAgIGF1dG9QbGF5OiBmYWxzZSxcbiAgICB2ZXJzaW9uOiAxLFxuICAgIGFuaW1hdGVMb2FkaW5nOiB0cnVlLFxuICAgIHJlc3BvbnNpdmVCZWhhdmlvcjogUmVzcG9uc2l2ZUJlaGF2aW9yLkZpbGwsXG4gICAgbWluV2lkdGg6IEZJTExfV0lER0VUX01JTl9XSURUSCxcbiAgfSxcbiAgcHJvcGVydGllczoge1xuICAgIGRlcml2ZWQ6IFdpZGdldC5nZXREZXJpdmVkUHJvcGVydGllc01hcCgpLFxuICAgIGRlZmF1bHQ6IFdpZGdldC5nZXREZWZhdWx0UHJvcGVydGllc01hcCgpLFxuICAgIG1ldGE6IFdpZGdldC5nZXRNZXRhUHJvcGVydGllc01hcCgpLFxuICAgIGNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbmZpZygpLFxuICAgIGNvbnRlbnRDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnKCksXG4gICAgYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnM6IFdpZGdldC5nZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucygpLFxuICB9LFxuICBhdXRvTGF5b3V0OiB7XG4gICAgd2lkZ2V0U2l6ZTogW1xuICAgICAge1xuICAgICAgICB2aWV3cG9ydE1pbldpZHRoOiAwLFxuICAgICAgICBjb25maWd1cmF0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1pbldpZHRoOiBcIjE4MHB4XCIsXG4gICAgICAgICAgICBtaW5IZWlnaHQ6IFwiNDBweFwiLFxuICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF0sXG4gICAgZGlzYWJsZVJlc2l6ZUhhbmRsZXM6IHtcbiAgICAgIHZlcnRpY2FsOiB0cnVlLFxuICAgIH0sXG4gIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBXaWRnZXQ7XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxjQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxjQUFBO0FBZlosU0FBU0UscUJBQXFCLFFBQVEsNkJBQTZCO0FBQ25FLFNBQVNDLGtCQUFrQixRQUFRLDRCQUE0QjtBQUUvRCxPQUFPQyxPQUFPLE1BQU0sWUFBWTtBQUNoQyxPQUFPQyxNQUFNLE1BQU0sVUFBVTtBQUM3QixTQUFTQyxjQUFjLFFBQVEsK0JBQStCO0FBQzlELFNBQVNDLFdBQVcsUUFBUSwrQkFBK0I7QUFFM0QsT0FBTyxNQUFNQyxNQUFNLElBQUFSLGNBQUEsR0FBQVMsQ0FBQSxPQUFHO0VBQ3BCQyxJQUFJLEVBQUVMLE1BQU0sQ0FBQ00sYUFBYSxDQUFDLENBQUM7RUFDNUJDLElBQUksRUFBRSxPQUFPO0VBQ2JDLE9BQU8sRUFBRVQsT0FBTztFQUNoQlUsU0FBUyxFQUFFLElBQUk7RUFDZkMsVUFBVSxFQUFFLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDO0VBQzlDQyxRQUFRLEVBQUU7SUFDUkMsSUFBSSxFQUFFLENBQUM7SUFDUEMsT0FBTyxFQUFFLEVBQUU7SUFDWEMsVUFBVSxFQUFFLE9BQU87SUFDbkJDLEdBQUcsRUFBRWIsV0FBVyxDQUFFLEdBQUVELGNBQWUsNkJBQTRCLENBQUM7SUFDaEVlLFFBQVEsRUFBRSxLQUFLO0lBQ2ZDLE9BQU8sRUFBRSxDQUFDO0lBQ1ZDLGNBQWMsRUFBRSxJQUFJO0lBQ3BCQyxrQkFBa0IsRUFBRXJCLGtCQUFrQixDQUFDc0IsSUFBSTtJQUMzQ0MsUUFBUSxFQUFFeEI7RUFDWixDQUFDO0VBQ0R5QixVQUFVLEVBQUU7SUFDVkMsT0FBTyxFQUFFdkIsTUFBTSxDQUFDd0IsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsT0FBTyxFQUFFekIsTUFBTSxDQUFDMEIsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsSUFBSSxFQUFFM0IsTUFBTSxDQUFDNEIsb0JBQW9CLENBQUMsQ0FBQztJQUNuQ0MsTUFBTSxFQUFFN0IsTUFBTSxDQUFDOEIscUJBQXFCLENBQUMsQ0FBQztJQUN0Q0MsYUFBYSxFQUFFL0IsTUFBTSxDQUFDZ0MsNEJBQTRCLENBQUMsQ0FBQztJQUNwREMsdUJBQXVCLEVBQUVqQyxNQUFNLENBQUNrQywwQkFBMEIsQ0FBQztFQUM3RCxDQUFDO0VBQ0RDLFVBQVUsRUFBRTtJQUNWQyxVQUFVLEVBQUUsQ0FDVjtNQUNFQyxnQkFBZ0IsRUFBRSxDQUFDO01BQ25CQyxhQUFhLEVBQUVBLENBQUEsS0FBTTtRQUFBM0MsY0FBQSxHQUFBNEMsQ0FBQTtRQUFBNUMsY0FBQSxHQUFBUyxDQUFBO1FBQ25CLE9BQU87VUFDTGlCLFFBQVEsRUFBRSxPQUFPO1VBQ2pCbUIsU0FBUyxFQUFFO1FBQ2IsQ0FBQztNQUNIO0lBQ0YsQ0FBQyxDQUNGO0lBQ0RDLG9CQUFvQixFQUFFO01BQ3BCQyxRQUFRLEVBQUU7SUFDWjtFQUNGO0FBQ0YsQ0FBQztBQUVELGVBQWUxQyxNQUFNIn0=