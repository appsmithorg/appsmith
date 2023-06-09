function cov_1r93tscdl4() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/IconButtonWidget/index.ts";
  var hash = "1d8680ede42db80330077929cee48da5e60f35d9";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/IconButtonWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 8,
          column: 22
        },
        end: {
          line: 59,
          column: 1
        }
      },
      "1": {
        start: {
          line: 48,
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
            line: 47,
            column: 23
          },
          end: {
            line: 47,
            column: 24
          }
        },
        loc: {
          start: {
            line: 47,
            column: 29
          },
          end: {
            line: 51,
            column: 9
          }
        },
        line: 47
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
    hash: "1d8680ede42db80330077929cee48da5e60f35d9"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1r93tscdl4 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1r93tscdl4();
import { IconNames } from "@blueprintjs/icons";
import { ButtonVariantTypes } from "components/constants";
import { ICON_BUTTON_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_1r93tscdl4().s[0]++, {
  type: Widget.getWidgetType(),
  name: "Icon button",
  iconSVG: IconSVG,
  searchTags: ["click", "submit"],
  defaults: {
    iconName: IconNames.PLUS,
    buttonVariant: ButtonVariantTypes.PRIMARY,
    isDisabled: false,
    isVisible: true,
    rows: 4,
    columns: 4,
    widgetName: "IconButton",
    version: 1,
    animateLoading: true,
    responsiveBehavior: ResponsiveBehavior.Hug,
    minWidth: ICON_BUTTON_MIN_WIDTH
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
      columns: 2.21
    },
    autoDimension: {
      width: true
    },
    widgetSize: [{
      viewportMinWidth: 0,
      configuration: () => {
        cov_1r93tscdl4().f[0]++;
        cov_1r93tscdl4().s[1]++;
        return {
          minWidth: "40px"
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMXI5M3RzY2RsNCIsImFjdHVhbENvdmVyYWdlIiwiSWNvbk5hbWVzIiwiQnV0dG9uVmFyaWFudFR5cGVzIiwiSUNPTl9CVVRUT05fTUlOX1dJRFRIIiwiUmVzcG9uc2l2ZUJlaGF2aW9yIiwiSWNvblNWRyIsIldpZGdldCIsIkNPTkZJRyIsInMiLCJ0eXBlIiwiZ2V0V2lkZ2V0VHlwZSIsIm5hbWUiLCJpY29uU1ZHIiwic2VhcmNoVGFncyIsImRlZmF1bHRzIiwiaWNvbk5hbWUiLCJQTFVTIiwiYnV0dG9uVmFyaWFudCIsIlBSSU1BUlkiLCJpc0Rpc2FibGVkIiwiaXNWaXNpYmxlIiwicm93cyIsImNvbHVtbnMiLCJ3aWRnZXROYW1lIiwidmVyc2lvbiIsImFuaW1hdGVMb2FkaW5nIiwicmVzcG9uc2l2ZUJlaGF2aW9yIiwiSHVnIiwibWluV2lkdGgiLCJwcm9wZXJ0aWVzIiwiZGVyaXZlZCIsImdldERlcml2ZWRQcm9wZXJ0aWVzTWFwIiwiZGVmYXVsdCIsImdldERlZmF1bHRQcm9wZXJ0aWVzTWFwIiwibWV0YSIsImdldE1ldGFQcm9wZXJ0aWVzTWFwIiwiY29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lQ29uZmlnIiwiY29udGVudENvbmZpZyIsImdldFByb3BlcnR5UGFuZUNvbnRlbnRDb25maWciLCJzdHlsZUNvbmZpZyIsImdldFByb3BlcnR5UGFuZVN0eWxlQ29uZmlnIiwic3R5bGVzaGVldENvbmZpZyIsImdldFN0eWxlc2hlZXRDb25maWciLCJhdXRvY29tcGxldGVEZWZpbml0aW9ucyIsImdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiYXV0b0xheW91dCIsImF1dG9EaW1lbnNpb24iLCJ3aWR0aCIsIndpZGdldFNpemUiLCJ2aWV3cG9ydE1pbldpZHRoIiwiY29uZmlndXJhdGlvbiIsImYiLCJkaXNhYmxlUmVzaXplSGFuZGxlcyIsImhvcml6b250YWwiLCJ2ZXJ0aWNhbCJdLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEljb25OYW1lcyB9IGZyb20gXCJAYmx1ZXByaW50anMvaWNvbnNcIjtcbmltcG9ydCB7IEJ1dHRvblZhcmlhbnRUeXBlcyB9IGZyb20gXCJjb21wb25lbnRzL2NvbnN0YW50c1wiO1xuaW1wb3J0IHsgSUNPTl9CVVRUT05fTUlOX1dJRFRIIH0gZnJvbSBcImNvbnN0YW50cy9taW5XaWR0aENvbnN0YW50c1wiO1xuaW1wb3J0IHsgUmVzcG9uc2l2ZUJlaGF2aW9yIH0gZnJvbSBcInV0aWxzL2F1dG9MYXlvdXQvY29uc3RhbnRzXCI7XG5pbXBvcnQgSWNvblNWRyBmcm9tIFwiLi9pY29uLnN2Z1wiO1xuaW1wb3J0IFdpZGdldCBmcm9tIFwiLi93aWRnZXRcIjtcblxuZXhwb3J0IGNvbnN0IENPTkZJRyA9IHtcbiAgdHlwZTogV2lkZ2V0LmdldFdpZGdldFR5cGUoKSxcbiAgbmFtZTogXCJJY29uIGJ1dHRvblwiLFxuICBpY29uU1ZHOiBJY29uU1ZHLFxuICBzZWFyY2hUYWdzOiBbXCJjbGlja1wiLCBcInN1Ym1pdFwiXSxcbiAgZGVmYXVsdHM6IHtcbiAgICBpY29uTmFtZTogSWNvbk5hbWVzLlBMVVMsXG4gICAgYnV0dG9uVmFyaWFudDogQnV0dG9uVmFyaWFudFR5cGVzLlBSSU1BUlksXG4gICAgaXNEaXNhYmxlZDogZmFsc2UsXG4gICAgaXNWaXNpYmxlOiB0cnVlLFxuICAgIHJvd3M6IDQsXG4gICAgY29sdW1uczogNCxcbiAgICB3aWRnZXROYW1lOiBcIkljb25CdXR0b25cIixcbiAgICB2ZXJzaW9uOiAxLFxuICAgIGFuaW1hdGVMb2FkaW5nOiB0cnVlLFxuICAgIHJlc3BvbnNpdmVCZWhhdmlvcjogUmVzcG9uc2l2ZUJlaGF2aW9yLkh1ZyxcbiAgICBtaW5XaWR0aDogSUNPTl9CVVRUT05fTUlOX1dJRFRILFxuICB9LFxuICBwcm9wZXJ0aWVzOiB7XG4gICAgZGVyaXZlZDogV2lkZ2V0LmdldERlcml2ZWRQcm9wZXJ0aWVzTWFwKCksXG4gICAgZGVmYXVsdDogV2lkZ2V0LmdldERlZmF1bHRQcm9wZXJ0aWVzTWFwKCksXG4gICAgbWV0YTogV2lkZ2V0LmdldE1ldGFQcm9wZXJ0aWVzTWFwKCksXG4gICAgY29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lQ29uZmlnKCksXG4gICAgY29udGVudENvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbnRlbnRDb25maWcoKSxcbiAgICBzdHlsZUNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZVN0eWxlQ29uZmlnKCksXG4gICAgc3R5bGVzaGVldENvbmZpZzogV2lkZ2V0LmdldFN0eWxlc2hlZXRDb25maWcoKSxcbiAgICBhdXRvY29tcGxldGVEZWZpbml0aW9uczogV2lkZ2V0LmdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zKCksXG4gIH0sXG4gIGF1dG9MYXlvdXQ6IHtcbiAgICBkZWZhdWx0czoge1xuICAgICAgcm93czogNCxcbiAgICAgIGNvbHVtbnM6IDIuMjEsXG4gICAgfSxcbiAgICBhdXRvRGltZW5zaW9uOiB7XG4gICAgICB3aWR0aDogdHJ1ZSxcbiAgICB9LFxuICAgIHdpZGdldFNpemU6IFtcbiAgICAgIHtcbiAgICAgICAgdmlld3BvcnRNaW5XaWR0aDogMCxcbiAgICAgICAgY29uZmlndXJhdGlvbjogKCkgPT4ge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtaW5XaWR0aDogXCI0MHB4XCIsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSxcbiAgICBkaXNhYmxlUmVzaXplSGFuZGxlczoge1xuICAgICAgaG9yaXpvbnRhbDogdHJ1ZSxcbiAgICAgIHZlcnRpY2FsOiB0cnVlLFxuICAgIH0sXG4gIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBXaWRnZXQ7XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxjQUFB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