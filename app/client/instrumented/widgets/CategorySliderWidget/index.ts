function cov_2at1war3kk() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/CategorySliderWidget/index.ts";
  var hash = "9dd46c706377e58307854c1afd9c84f019d2db9a";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/CategorySliderWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 8,
          column: 22
        },
        end: {
          line: 74,
          column: 1
        }
      },
      "1": {
        start: {
          line: 63,
          column: 10
        },
        end: {
          line: 66,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 62,
            column: 23
          },
          end: {
            line: 62,
            column: 24
          }
        },
        loc: {
          start: {
            line: 62,
            column: 29
          },
          end: {
            line: 67,
            column: 9
          }
        },
        line: 62
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
    hash: "9dd46c706377e58307854c1afd9c84f019d2db9a"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_2at1war3kk = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_2at1war3kk();
import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_2at1war3kk().s[0]++, {
  type: Widget.getWidgetType(),
  name: "Category Slider",
  needsMeta: true,
  searchTags: ["range"],
  iconSVG: IconSVG,
  defaults: {
    options: [{
      label: "xs",
      value: "xs"
    }, {
      label: "sm",
      value: "sm"
    }, {
      label: "md",
      value: "md"
    }, {
      label: "lg",
      value: "lg"
    }, {
      label: "xl",
      value: "xl"
    }],
    defaultOptionValue: "md",
    isVisible: true,
    isDisabled: false,
    showMarksLabel: true,
    rows: 8,
    columns: 40,
    widgetName: "CategorySlider",
    shouldScroll: false,
    shouldTruncate: false,
    version: 1,
    animateLoading: true,
    labelText: "Size",
    labelPosition: LabelPosition.Top,
    labelAlignment: Alignment.LEFT,
    labelWidth: 5,
    labelTextSize: "0.875rem",
    sliderSize: "m",
    responsiveBehavior: ResponsiveBehavior.Fill
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
    stylesheetConfig: Widget.getStylesheetConfig(),
    autocompleteDefinitions: Widget.getAutocompleteDefinitions()
  },
  autoLayout: {
    disabledPropsDefaults: {
      labelPosition: LabelPosition.Top,
      labelTextSize: "0.875rem"
    },
    defaults: {
      rows: 7,
      columns: 40
    },
    widgetSize: [{
      viewportMinWidth: 0,
      configuration: () => {
        cov_2at1war3kk().f[0]++;
        cov_2at1war3kk().s[1]++;
        return {
          minWidth: "180px",
          minHeight: "70px"
        };
      }
    }],
    disableResizeHandles: {
      vertical: true
    }
  }
});
export default Widget;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMmF0MXdhcjNrayIsImFjdHVhbENvdmVyYWdlIiwiQWxpZ25tZW50IiwiTGFiZWxQb3NpdGlvbiIsIlJlc3BvbnNpdmVCZWhhdmlvciIsIkljb25TVkciLCJXaWRnZXQiLCJDT05GSUciLCJzIiwidHlwZSIsImdldFdpZGdldFR5cGUiLCJuYW1lIiwibmVlZHNNZXRhIiwic2VhcmNoVGFncyIsImljb25TVkciLCJkZWZhdWx0cyIsIm9wdGlvbnMiLCJsYWJlbCIsInZhbHVlIiwiZGVmYXVsdE9wdGlvblZhbHVlIiwiaXNWaXNpYmxlIiwiaXNEaXNhYmxlZCIsInNob3dNYXJrc0xhYmVsIiwicm93cyIsImNvbHVtbnMiLCJ3aWRnZXROYW1lIiwic2hvdWxkU2Nyb2xsIiwic2hvdWxkVHJ1bmNhdGUiLCJ2ZXJzaW9uIiwiYW5pbWF0ZUxvYWRpbmciLCJsYWJlbFRleHQiLCJsYWJlbFBvc2l0aW9uIiwiVG9wIiwibGFiZWxBbGlnbm1lbnQiLCJMRUZUIiwibGFiZWxXaWR0aCIsImxhYmVsVGV4dFNpemUiLCJzbGlkZXJTaXplIiwicmVzcG9uc2l2ZUJlaGF2aW9yIiwiRmlsbCIsInByb3BlcnRpZXMiLCJkZXJpdmVkIiwiZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAiLCJkZWZhdWx0IiwiZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAiLCJtZXRhIiwiZ2V0TWV0YVByb3BlcnRpZXNNYXAiLCJjb250ZW50Q29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lQ29udGVudENvbmZpZyIsInN0eWxlQ29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lU3R5bGVDb25maWciLCJzdHlsZXNoZWV0Q29uZmlnIiwiZ2V0U3R5bGVzaGVldENvbmZpZyIsImF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiLCJhdXRvTGF5b3V0IiwiZGlzYWJsZWRQcm9wc0RlZmF1bHRzIiwid2lkZ2V0U2l6ZSIsInZpZXdwb3J0TWluV2lkdGgiLCJjb25maWd1cmF0aW9uIiwiZiIsIm1pbldpZHRoIiwibWluSGVpZ2h0IiwiZGlzYWJsZVJlc2l6ZUhhbmRsZXMiLCJ2ZXJ0aWNhbCJdLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFsaWdubWVudCB9IGZyb20gXCJAYmx1ZXByaW50anMvY29yZVwiO1xuaW1wb3J0IHsgTGFiZWxQb3NpdGlvbiB9IGZyb20gXCJjb21wb25lbnRzL2NvbnN0YW50c1wiO1xuaW1wb3J0IHsgUmVzcG9uc2l2ZUJlaGF2aW9yIH0gZnJvbSBcInV0aWxzL2F1dG9MYXlvdXQvY29uc3RhbnRzXCI7XG5cbmltcG9ydCBJY29uU1ZHIGZyb20gXCIuL2ljb24uc3ZnXCI7XG5pbXBvcnQgV2lkZ2V0IGZyb20gXCIuL3dpZGdldFwiO1xuXG5leHBvcnQgY29uc3QgQ09ORklHID0ge1xuICB0eXBlOiBXaWRnZXQuZ2V0V2lkZ2V0VHlwZSgpLFxuICBuYW1lOiBcIkNhdGVnb3J5IFNsaWRlclwiLFxuICBuZWVkc01ldGE6IHRydWUsXG4gIHNlYXJjaFRhZ3M6IFtcInJhbmdlXCJdLFxuICBpY29uU1ZHOiBJY29uU1ZHLFxuICBkZWZhdWx0czoge1xuICAgIG9wdGlvbnM6IFtcbiAgICAgIHsgbGFiZWw6IFwieHNcIiwgdmFsdWU6IFwieHNcIiB9LFxuICAgICAgeyBsYWJlbDogXCJzbVwiLCB2YWx1ZTogXCJzbVwiIH0sXG4gICAgICB7IGxhYmVsOiBcIm1kXCIsIHZhbHVlOiBcIm1kXCIgfSxcbiAgICAgIHsgbGFiZWw6IFwibGdcIiwgdmFsdWU6IFwibGdcIiB9LFxuICAgICAgeyBsYWJlbDogXCJ4bFwiLCB2YWx1ZTogXCJ4bFwiIH0sXG4gICAgXSxcbiAgICBkZWZhdWx0T3B0aW9uVmFsdWU6IFwibWRcIixcbiAgICBpc1Zpc2libGU6IHRydWUsXG4gICAgaXNEaXNhYmxlZDogZmFsc2UsXG4gICAgc2hvd01hcmtzTGFiZWw6IHRydWUsXG4gICAgcm93czogOCxcbiAgICBjb2x1bW5zOiA0MCxcbiAgICB3aWRnZXROYW1lOiBcIkNhdGVnb3J5U2xpZGVyXCIsXG4gICAgc2hvdWxkU2Nyb2xsOiBmYWxzZSxcbiAgICBzaG91bGRUcnVuY2F0ZTogZmFsc2UsXG4gICAgdmVyc2lvbjogMSxcbiAgICBhbmltYXRlTG9hZGluZzogdHJ1ZSxcbiAgICBsYWJlbFRleHQ6IFwiU2l6ZVwiLFxuICAgIGxhYmVsUG9zaXRpb246IExhYmVsUG9zaXRpb24uVG9wLFxuICAgIGxhYmVsQWxpZ25tZW50OiBBbGlnbm1lbnQuTEVGVCxcbiAgICBsYWJlbFdpZHRoOiA1LFxuICAgIGxhYmVsVGV4dFNpemU6IFwiMC44NzVyZW1cIixcbiAgICBzbGlkZXJTaXplOiBcIm1cIixcbiAgICByZXNwb25zaXZlQmVoYXZpb3I6IFJlc3BvbnNpdmVCZWhhdmlvci5GaWxsLFxuICB9LFxuICBwcm9wZXJ0aWVzOiB7XG4gICAgZGVyaXZlZDogV2lkZ2V0LmdldERlcml2ZWRQcm9wZXJ0aWVzTWFwKCksXG4gICAgZGVmYXVsdDogV2lkZ2V0LmdldERlZmF1bHRQcm9wZXJ0aWVzTWFwKCksXG4gICAgbWV0YTogV2lkZ2V0LmdldE1ldGFQcm9wZXJ0aWVzTWFwKCksXG4gICAgY29udGVudENvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbnRlbnRDb25maWcoKSxcbiAgICBzdHlsZUNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZVN0eWxlQ29uZmlnKCksXG4gICAgc3R5bGVzaGVldENvbmZpZzogV2lkZ2V0LmdldFN0eWxlc2hlZXRDb25maWcoKSxcbiAgICBhdXRvY29tcGxldGVEZWZpbml0aW9uczogV2lkZ2V0LmdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zKCksXG4gIH0sXG4gIGF1dG9MYXlvdXQ6IHtcbiAgICBkaXNhYmxlZFByb3BzRGVmYXVsdHM6IHtcbiAgICAgIGxhYmVsUG9zaXRpb246IExhYmVsUG9zaXRpb24uVG9wLFxuICAgICAgbGFiZWxUZXh0U2l6ZTogXCIwLjg3NXJlbVwiLFxuICAgIH0sXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgIHJvd3M6IDcsXG4gICAgICBjb2x1bW5zOiA0MCxcbiAgICB9LFxuICAgIHdpZGdldFNpemU6IFtcbiAgICAgIHtcbiAgICAgICAgdmlld3BvcnRNaW5XaWR0aDogMCxcbiAgICAgICAgY29uZmlndXJhdGlvbjogKCkgPT4ge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtaW5XaWR0aDogXCIxODBweFwiLFxuICAgICAgICAgICAgbWluSGVpZ2h0OiBcIjcwcHhcIixcbiAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdLFxuICAgIGRpc2FibGVSZXNpemVIYW5kbGVzOiB7XG4gICAgICB2ZXJ0aWNhbDogdHJ1ZSxcbiAgICB9LFxuICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgV2lkZ2V0O1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsY0FBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsY0FBQTtBQWZaLFNBQVNFLFNBQVMsUUFBUSxtQkFBbUI7QUFDN0MsU0FBU0MsYUFBYSxRQUFRLHNCQUFzQjtBQUNwRCxTQUFTQyxrQkFBa0IsUUFBUSw0QkFBNEI7QUFFL0QsT0FBT0MsT0FBTyxNQUFNLFlBQVk7QUFDaEMsT0FBT0MsTUFBTSxNQUFNLFVBQVU7QUFFN0IsT0FBTyxNQUFNQyxNQUFNLElBQUFQLGNBQUEsR0FBQVEsQ0FBQSxPQUFHO0VBQ3BCQyxJQUFJLEVBQUVILE1BQU0sQ0FBQ0ksYUFBYSxDQUFDLENBQUM7RUFDNUJDLElBQUksRUFBRSxpQkFBaUI7RUFDdkJDLFNBQVMsRUFBRSxJQUFJO0VBQ2ZDLFVBQVUsRUFBRSxDQUFDLE9BQU8sQ0FBQztFQUNyQkMsT0FBTyxFQUFFVCxPQUFPO0VBQ2hCVSxRQUFRLEVBQUU7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