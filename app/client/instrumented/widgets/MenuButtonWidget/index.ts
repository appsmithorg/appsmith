function cov_1xkk6h76g0() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/MenuButtonWidget/index.ts";
  var hash = "ab415856d5b10e003a23bc637e20a71d0af23a0b";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/MenuButtonWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 6,
          column: 22
        },
        end: {
          line: 84,
          column: 1
        }
      },
      "1": {
        start: {
          line: 72,
          column: 10
        },
        end: {
          line: 75,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 71,
            column: 23
          },
          end: {
            line: 71,
            column: 24
          }
        },
        loc: {
          start: {
            line: 71,
            column: 29
          },
          end: {
            line: 76,
            column: 9
          }
        },
        line: 71
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
    hash: "ab415856d5b10e003a23bc637e20a71d0af23a0b"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1xkk6h76g0 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1xkk6h76g0();
import Widget from "./widget";
import IconSVG from "./icon.svg";
import { ButtonPlacementTypes, ButtonVariantTypes } from "components/constants";
import { MenuItemsSource } from "./constants";
export const CONFIG = (cov_1xkk6h76g0().s[0]++, {
  type: Widget.getWidgetType(),
  name: "Menu button",
  iconSVG: IconSVG,
  defaults: {
    label: "Open Menu",
    menuVariant: ButtonVariantTypes.PRIMARY,
    placement: ButtonPlacementTypes.CENTER,
    isCompact: false,
    isDisabled: false,
    isVisible: true,
    animateLoading: true,
    menuItemsSource: MenuItemsSource.STATIC,
    menuItems: {
      menuItem1: {
        label: "First Menu Item",
        id: "menuItem1",
        widgetId: "",
        isVisible: true,
        isDisabled: false,
        index: 0
      },
      menuItem2: {
        label: "Second Menu Item",
        id: "menuItem2",
        widgetId: "",
        isVisible: true,
        isDisabled: false,
        index: 1
      },
      menuItem3: {
        label: "Third Menu Item",
        id: "menuItem3",
        widgetId: "",
        isVisible: true,
        isDisabled: false,
        index: 2
      }
    },
    rows: 4,
    columns: 16,
    widgetName: "MenuButton",
    version: 1
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
        cov_1xkk6h76g0().f[0]++;
        cov_1xkk6h76g0().s[1]++;
        return {
          minWidth: "120px",
          maxWidth: "360px"
        };
      }
    }],
    disableResizeHandles: {
      vertical: true,
      horizontal: true
    }
  }
});
export default Widget;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMXhrazZoNzZnMCIsImFjdHVhbENvdmVyYWdlIiwiV2lkZ2V0IiwiSWNvblNWRyIsIkJ1dHRvblBsYWNlbWVudFR5cGVzIiwiQnV0dG9uVmFyaWFudFR5cGVzIiwiTWVudUl0ZW1zU291cmNlIiwiQ09ORklHIiwicyIsInR5cGUiLCJnZXRXaWRnZXRUeXBlIiwibmFtZSIsImljb25TVkciLCJkZWZhdWx0cyIsImxhYmVsIiwibWVudVZhcmlhbnQiLCJQUklNQVJZIiwicGxhY2VtZW50IiwiQ0VOVEVSIiwiaXNDb21wYWN0IiwiaXNEaXNhYmxlZCIsImlzVmlzaWJsZSIsImFuaW1hdGVMb2FkaW5nIiwibWVudUl0ZW1zU291cmNlIiwiU1RBVElDIiwibWVudUl0ZW1zIiwibWVudUl0ZW0xIiwiaWQiLCJ3aWRnZXRJZCIsImluZGV4IiwibWVudUl0ZW0yIiwibWVudUl0ZW0zIiwicm93cyIsImNvbHVtbnMiLCJ3aWRnZXROYW1lIiwidmVyc2lvbiIsInByb3BlcnRpZXMiLCJkZXJpdmVkIiwiZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAiLCJkZWZhdWx0IiwiZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAiLCJtZXRhIiwiZ2V0TWV0YVByb3BlcnRpZXNNYXAiLCJjb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb25maWciLCJjb250ZW50Q29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lQ29udGVudENvbmZpZyIsInN0eWxlQ29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lU3R5bGVDb25maWciLCJzdHlsZXNoZWV0Q29uZmlnIiwiZ2V0U3R5bGVzaGVldENvbmZpZyIsImF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiLCJhdXRvTGF5b3V0IiwiYXV0b0RpbWVuc2lvbiIsIndpZHRoIiwid2lkZ2V0U2l6ZSIsInZpZXdwb3J0TWluV2lkdGgiLCJjb25maWd1cmF0aW9uIiwiZiIsIm1pbldpZHRoIiwibWF4V2lkdGgiLCJkaXNhYmxlUmVzaXplSGFuZGxlcyIsInZlcnRpY2FsIiwiaG9yaXpvbnRhbCJdLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBXaWRnZXQgZnJvbSBcIi4vd2lkZ2V0XCI7XG5pbXBvcnQgSWNvblNWRyBmcm9tIFwiLi9pY29uLnN2Z1wiO1xuaW1wb3J0IHsgQnV0dG9uUGxhY2VtZW50VHlwZXMsIEJ1dHRvblZhcmlhbnRUeXBlcyB9IGZyb20gXCJjb21wb25lbnRzL2NvbnN0YW50c1wiO1xuaW1wb3J0IHsgTWVudUl0ZW1zU291cmNlIH0gZnJvbSBcIi4vY29uc3RhbnRzXCI7XG5cbmV4cG9ydCBjb25zdCBDT05GSUcgPSB7XG4gIHR5cGU6IFdpZGdldC5nZXRXaWRnZXRUeXBlKCksXG4gIG5hbWU6IFwiTWVudSBidXR0b25cIixcbiAgaWNvblNWRzogSWNvblNWRyxcbiAgZGVmYXVsdHM6IHtcbiAgICBsYWJlbDogXCJPcGVuIE1lbnVcIixcbiAgICBtZW51VmFyaWFudDogQnV0dG9uVmFyaWFudFR5cGVzLlBSSU1BUlksXG4gICAgcGxhY2VtZW50OiBCdXR0b25QbGFjZW1lbnRUeXBlcy5DRU5URVIsXG4gICAgaXNDb21wYWN0OiBmYWxzZSxcbiAgICBpc0Rpc2FibGVkOiBmYWxzZSxcbiAgICBpc1Zpc2libGU6IHRydWUsXG4gICAgYW5pbWF0ZUxvYWRpbmc6IHRydWUsXG4gICAgbWVudUl0ZW1zU291cmNlOiBNZW51SXRlbXNTb3VyY2UuU1RBVElDLFxuICAgIG1lbnVJdGVtczoge1xuICAgICAgbWVudUl0ZW0xOiB7XG4gICAgICAgIGxhYmVsOiBcIkZpcnN0IE1lbnUgSXRlbVwiLFxuICAgICAgICBpZDogXCJtZW51SXRlbTFcIixcbiAgICAgICAgd2lkZ2V0SWQ6IFwiXCIsXG4gICAgICAgIGlzVmlzaWJsZTogdHJ1ZSxcbiAgICAgICAgaXNEaXNhYmxlZDogZmFsc2UsXG4gICAgICAgIGluZGV4OiAwLFxuICAgICAgfSxcbiAgICAgIG1lbnVJdGVtMjoge1xuICAgICAgICBsYWJlbDogXCJTZWNvbmQgTWVudSBJdGVtXCIsXG4gICAgICAgIGlkOiBcIm1lbnVJdGVtMlwiLFxuICAgICAgICB3aWRnZXRJZDogXCJcIixcbiAgICAgICAgaXNWaXNpYmxlOiB0cnVlLFxuICAgICAgICBpc0Rpc2FibGVkOiBmYWxzZSxcbiAgICAgICAgaW5kZXg6IDEsXG4gICAgICB9LFxuICAgICAgbWVudUl0ZW0zOiB7XG4gICAgICAgIGxhYmVsOiBcIlRoaXJkIE1lbnUgSXRlbVwiLFxuICAgICAgICBpZDogXCJtZW51SXRlbTNcIixcbiAgICAgICAgd2lkZ2V0SWQ6IFwiXCIsXG4gICAgICAgIGlzVmlzaWJsZTogdHJ1ZSxcbiAgICAgICAgaXNEaXNhYmxlZDogZmFsc2UsXG4gICAgICAgIGluZGV4OiAyLFxuICAgICAgfSxcbiAgICB9LFxuICAgIHJvd3M6IDQsXG4gICAgY29sdW1uczogMTYsXG4gICAgd2lkZ2V0TmFtZTogXCJNZW51QnV0dG9uXCIsXG4gICAgdmVyc2lvbjogMSxcbiAgfSxcbiAgcHJvcGVydGllczoge1xuICAgIGRlcml2ZWQ6IFdpZGdldC5nZXREZXJpdmVkUHJvcGVydGllc01hcCgpLFxuICAgIGRlZmF1bHQ6IFdpZGdldC5nZXREZWZhdWx0UHJvcGVydGllc01hcCgpLFxuICAgIG1ldGE6IFdpZGdldC5nZXRNZXRhUHJvcGVydGllc01hcCgpLFxuICAgIGNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbmZpZygpLFxuICAgIGNvbnRlbnRDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnKCksXG4gICAgc3R5bGVDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVTdHlsZUNvbmZpZygpLFxuICAgIHN0eWxlc2hlZXRDb25maWc6IFdpZGdldC5nZXRTdHlsZXNoZWV0Q29uZmlnKCksXG4gICAgYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnM6IFdpZGdldC5nZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucygpLFxuICB9LFxuICBhdXRvTGF5b3V0OiB7XG4gICAgZGVmYXVsdHM6IHtcbiAgICAgIHJvd3M6IDQsXG4gICAgICBjb2x1bW5zOiA2LjYzMixcbiAgICB9LFxuICAgIGF1dG9EaW1lbnNpb246IHtcbiAgICAgIHdpZHRoOiB0cnVlLFxuICAgIH0sXG4gICAgd2lkZ2V0U2l6ZTogW1xuICAgICAge1xuICAgICAgICB2aWV3cG9ydE1pbldpZHRoOiAwLFxuICAgICAgICBjb25maWd1cmF0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1pbldpZHRoOiBcIjEyMHB4XCIsXG4gICAgICAgICAgICBtYXhXaWR0aDogXCIzNjBweFwiLFxuICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF0sXG4gICAgZGlzYWJsZVJlc2l6ZUhhbmRsZXM6IHtcbiAgICAgIHZlcnRpY2FsOiB0cnVlLFxuICAgICAgaG9yaXpvbnRhbDogdHJ1ZSxcbiAgICB9LFxuICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgV2lkZ2V0O1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsY0FBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsY0FBQTtBQWZaLE9BQU9FLE1BQU0sTUFBTSxVQUFVO0FBQzdCLE9BQU9DLE9BQU8sTUFBTSxZQUFZO0FBQ2hDLFNBQVNDLG9CQUFvQixFQUFFQyxrQkFBa0IsUUFBUSxzQkFBc0I7QUFDL0UsU0FBU0MsZUFBZSxRQUFRLGFBQWE7QUFFN0MsT0FBTyxNQUFNQyxNQUFNLElBQUFQLGNBQUEsR0FBQVEsQ0FBQSxPQUFHO0VBQ3BCQyxJQUFJLEVBQUVQLE1BQU0sQ0FBQ1EsYUFBYSxDQUFDLENBQUM7RUFDNUJDLElBQUksRUFBRSxhQUFhO0VBQ25CQyxPQUFPLEVBQUVULE9BQU87RUFDaEJVLFFBQVEsRUFBRTtJQUNSQyxLQUFLLEVBQUUsV0FBVztJQUNsQkMsV0FBVyxFQUFFVixrQkFBa0IsQ0FBQ1csT0FBTztJQUN2Q0MsU0FBUyxFQUFFYixvQkFBb0IsQ0FBQ2MsTUFBTTtJQUN0Q0MsU0FBUyxFQUFFLEtBQUs7SUFDaEJDLFVBQVUsRUFBRSxLQUFLO0lBQ2pCQyxTQUFTLEVBQUUsSUFBSTtJQUNmQyxjQUFjLEVBQUUsSUFBSTtJQUNwQkMsZUFBZSxFQUFFakIsZUFBZSxDQUFDa0IsTUFBTTtJQUN2Q0MsU0FBUyxFQUFFO01BQ1RDLFNBQVMsRUFBRTtRQUNUWixLQUFLLEVBQUUsaUJBQWlCO1FBQ3hCYSxFQUFFLEVBQUUsV0FBVztRQUNmQyxRQUFRLEVBQUUsRUFBRTtRQUNaUCxTQUFTLEVBQUUsSUFBSTtRQUNmRCxVQUFVLEVBQUUsS0FBSztRQUNqQlMsS0FBSyxFQUFFO01BQ1QsQ0FBQztNQUNEQyxTQUFTLEVBQUU7UUFDVGhCLEtBQUssRUFBRSxrQkFBa0I7UUFDekJhLEVBQUUsRUFBRSxXQUFXO1FBQ2ZDLFFBQVEsRUFBRSxFQUFFO1FBQ1pQLFNBQVMsRUFBRSxJQUFJO1FBQ2ZELFVBQVUsRUFBRSxLQUFLO1FBQ2pCUyxLQUFLLEVBQUU7TUFDVCxDQUFDO01BQ0RFLFNBQVMsRUFBRTtRQUNUakIsS0FBSyxFQUFFLGlCQUFpQjtRQUN4QmEsRUFBRSxFQUFFLFdBQVc7UUFDZkMsUUFBUSxFQUFFLEVBQUU7UUFDWlAsU0FBUyxFQUFFLElBQUk7UUFDZkQsVUFBVSxFQUFFLEtBQUs7UUFDakJTLEtBQUssRUFBRTtNQUNUO0lBQ0YsQ0FBQztJQUNERyxJQUFJLEVBQUUsQ0FBQztJQUNQQyxPQUFPLEVBQUUsRUFBRTtJQUNYQyxVQUFVLEVBQUUsWUFBWTtJQUN4QkMsT0FBTyxFQUFFO0VBQ1gsQ0FBQztFQUNEQyxVQUFVLEVBQUU7SUFDVkMsT0FBTyxFQUFFbkMsTUFBTSxDQUFDb0MsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsT0FBTyxFQUFFckMsTUFBTSxDQUFDc0MsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsSUFBSSxFQUFFdkMsTUFBTSxDQUFDd0Msb0JBQW9CLENBQUMsQ0FBQztJQUNuQ0MsTUFBTSxFQUFFekMsTUFBTSxDQUFDMEMscUJBQXFCLENBQUMsQ0FBQztJQUN0Q0MsYUFBYSxFQUFFM0MsTUFBTSxDQUFDNEMsNEJBQTRCLENBQUMsQ0FBQztJQUNwREMsV0FBVyxFQUFFN0MsTUFBTSxDQUFDOEMsMEJBQTBCLENBQUMsQ0FBQztJQUNoREMsZ0JBQWdCLEVBQUUvQyxNQUFNLENBQUNnRCxtQkFBbUIsQ0FBQyxDQUFDO0lBQzlDQyx1QkFBdUIsRUFBRWpELE1BQU0sQ0FBQ2tELDBCQUEwQixDQUFDO0VBQzdELENBQUM7RUFDREMsVUFBVSxFQUFFO0lBQ1Z4QyxRQUFRLEVBQUU7TUFDUm1CLElBQUksRUFBRSxDQUFDO01BQ1BDLE9BQU8sRUFBRTtJQUNYLENBQUM7SUFDRHFCLGFBQWEsRUFBRTtNQUNiQyxLQUFLLEVBQUU7SUFDVCxDQUFDO0lBQ0RDLFVBQVUsRUFBRSxDQUNWO01BQ0VDLGdCQUFnQixFQUFFLENBQUM7TUFDbkJDLGFBQWEsRUFBRUEsQ0FBQSxLQUFNO1FBQUExRCxjQUFBLEdBQUEyRCxDQUFBO1FBQUEzRCxjQUFBLEdBQUFRLENBQUE7UUFDbkIsT0FBTztVQUNMb0QsUUFBUSxFQUFFLE9BQU87VUFDakJDLFFBQVEsRUFBRTtRQUNaLENBQUM7TUFDSDtJQUNGLENBQUMsQ0FDRjtJQUNEQyxvQkFBb0IsRUFBRTtNQUNwQkMsUUFBUSxFQUFFLElBQUk7TUFDZEMsVUFBVSxFQUFFO0lBQ2Q7RUFDRjtBQUNGLENBQUM7QUFFRCxlQUFlOUQsTUFBTSJ9