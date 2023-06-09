function cov_uxat75uwr() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/RangeSliderWidget/index.ts";
  var hash = "79b5e9f45dce1c90d38c35c19cbfaf5b43037193";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/RangeSliderWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 8,
          column: 22
        },
        end: {
          line: 77,
          column: 1
        }
      },
      "1": {
        start: {
          line: 66,
          column: 10
        },
        end: {
          line: 69,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 65,
            column: 23
          },
          end: {
            line: 65,
            column: 24
          }
        },
        loc: {
          start: {
            line: 65,
            column: 29
          },
          end: {
            line: 70,
            column: 9
          }
        },
        line: 65
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
    hash: "79b5e9f45dce1c90d38c35c19cbfaf5b43037193"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_uxat75uwr = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_uxat75uwr();
import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_uxat75uwr().s[0]++, {
  type: Widget.getWidgetType(),
  name: "Range Slider",
  needsMeta: true,
  iconSVG: IconSVG,
  defaults: {
    min: 0,
    max: 100,
    minRange: 5,
    step: 1,
    showMarksLabel: true,
    defaultStartValue: 10,
    defaultEndValue: 100,
    marks: [{
      value: 25,
      label: "25%"
    }, {
      value: 50,
      label: "50%"
    }, {
      value: 75,
      label: "75%"
    }],
    isVisible: true,
    isDisabled: false,
    tooltipAlwaysOn: false,
    labelText: "Percentage",
    labelPosition: LabelPosition.Top,
    labelAlignment: Alignment.LEFT,
    labelWidth: 8,
    labelTextSize: "0.875rem",
    rows: 8,
    columns: 40,
    widgetName: "RangeSlider",
    shouldScroll: false,
    shouldTruncate: false,
    version: 1,
    animateLoading: true,
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
        cov_uxat75uwr().f[0]++;
        cov_uxat75uwr().s[1]++;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfdXhhdDc1dXdyIiwiYWN0dWFsQ292ZXJhZ2UiLCJBbGlnbm1lbnQiLCJMYWJlbFBvc2l0aW9uIiwiUmVzcG9uc2l2ZUJlaGF2aW9yIiwiSWNvblNWRyIsIldpZGdldCIsIkNPTkZJRyIsInMiLCJ0eXBlIiwiZ2V0V2lkZ2V0VHlwZSIsIm5hbWUiLCJuZWVkc01ldGEiLCJpY29uU1ZHIiwiZGVmYXVsdHMiLCJtaW4iLCJtYXgiLCJtaW5SYW5nZSIsInN0ZXAiLCJzaG93TWFya3NMYWJlbCIsImRlZmF1bHRTdGFydFZhbHVlIiwiZGVmYXVsdEVuZFZhbHVlIiwibWFya3MiLCJ2YWx1ZSIsImxhYmVsIiwiaXNWaXNpYmxlIiwiaXNEaXNhYmxlZCIsInRvb2x0aXBBbHdheXNPbiIsImxhYmVsVGV4dCIsImxhYmVsUG9zaXRpb24iLCJUb3AiLCJsYWJlbEFsaWdubWVudCIsIkxFRlQiLCJsYWJlbFdpZHRoIiwibGFiZWxUZXh0U2l6ZSIsInJvd3MiLCJjb2x1bW5zIiwid2lkZ2V0TmFtZSIsInNob3VsZFNjcm9sbCIsInNob3VsZFRydW5jYXRlIiwidmVyc2lvbiIsImFuaW1hdGVMb2FkaW5nIiwic2xpZGVyU2l6ZSIsInJlc3BvbnNpdmVCZWhhdmlvciIsIkZpbGwiLCJwcm9wZXJ0aWVzIiwiZGVyaXZlZCIsImdldERlcml2ZWRQcm9wZXJ0aWVzTWFwIiwiZGVmYXVsdCIsImdldERlZmF1bHRQcm9wZXJ0aWVzTWFwIiwibWV0YSIsImdldE1ldGFQcm9wZXJ0aWVzTWFwIiwiY29udGVudENvbmZpZyIsImdldFByb3BlcnR5UGFuZUNvbnRlbnRDb25maWciLCJzdHlsZUNvbmZpZyIsImdldFByb3BlcnR5UGFuZVN0eWxlQ29uZmlnIiwic3R5bGVzaGVldENvbmZpZyIsImdldFN0eWxlc2hlZXRDb25maWciLCJhdXRvY29tcGxldGVEZWZpbml0aW9ucyIsImdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiYXV0b0xheW91dCIsImRpc2FibGVkUHJvcHNEZWZhdWx0cyIsIndpZGdldFNpemUiLCJ2aWV3cG9ydE1pbldpZHRoIiwiY29uZmlndXJhdGlvbiIsImYiLCJtaW5XaWR0aCIsIm1pbkhlaWdodCIsImRpc2FibGVSZXNpemVIYW5kbGVzIiwidmVydGljYWwiXSwic291cmNlcyI6WyJpbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBbGlnbm1lbnQgfSBmcm9tIFwiQGJsdWVwcmludGpzL2NvcmVcIjtcbmltcG9ydCB7IExhYmVsUG9zaXRpb24gfSBmcm9tIFwiY29tcG9uZW50cy9jb25zdGFudHNcIjtcbmltcG9ydCB7IFJlc3BvbnNpdmVCZWhhdmlvciB9IGZyb20gXCJ1dGlscy9hdXRvTGF5b3V0L2NvbnN0YW50c1wiO1xuXG5pbXBvcnQgSWNvblNWRyBmcm9tIFwiLi9pY29uLnN2Z1wiO1xuaW1wb3J0IFdpZGdldCBmcm9tIFwiLi93aWRnZXRcIjtcblxuZXhwb3J0IGNvbnN0IENPTkZJRyA9IHtcbiAgdHlwZTogV2lkZ2V0LmdldFdpZGdldFR5cGUoKSxcbiAgbmFtZTogXCJSYW5nZSBTbGlkZXJcIixcbiAgbmVlZHNNZXRhOiB0cnVlLFxuICBpY29uU1ZHOiBJY29uU1ZHLFxuICBkZWZhdWx0czoge1xuICAgIG1pbjogMCxcbiAgICBtYXg6IDEwMCxcbiAgICBtaW5SYW5nZTogNSxcbiAgICBzdGVwOiAxLFxuICAgIHNob3dNYXJrc0xhYmVsOiB0cnVlLFxuICAgIGRlZmF1bHRTdGFydFZhbHVlOiAxMCxcbiAgICBkZWZhdWx0RW5kVmFsdWU6IDEwMCxcbiAgICBtYXJrczogW1xuICAgICAgeyB2YWx1ZTogMjUsIGxhYmVsOiBcIjI1JVwiIH0sXG4gICAgICB7IHZhbHVlOiA1MCwgbGFiZWw6IFwiNTAlXCIgfSxcbiAgICAgIHsgdmFsdWU6IDc1LCBsYWJlbDogXCI3NSVcIiB9LFxuICAgIF0sXG4gICAgaXNWaXNpYmxlOiB0cnVlLFxuICAgIGlzRGlzYWJsZWQ6IGZhbHNlLFxuICAgIHRvb2x0aXBBbHdheXNPbjogZmFsc2UsXG4gICAgbGFiZWxUZXh0OiBcIlBlcmNlbnRhZ2VcIixcbiAgICBsYWJlbFBvc2l0aW9uOiBMYWJlbFBvc2l0aW9uLlRvcCxcbiAgICBsYWJlbEFsaWdubWVudDogQWxpZ25tZW50LkxFRlQsXG4gICAgbGFiZWxXaWR0aDogOCxcbiAgICBsYWJlbFRleHRTaXplOiBcIjAuODc1cmVtXCIsXG4gICAgcm93czogOCxcbiAgICBjb2x1bW5zOiA0MCxcbiAgICB3aWRnZXROYW1lOiBcIlJhbmdlU2xpZGVyXCIsXG4gICAgc2hvdWxkU2Nyb2xsOiBmYWxzZSxcbiAgICBzaG91bGRUcnVuY2F0ZTogZmFsc2UsXG4gICAgdmVyc2lvbjogMSxcbiAgICBhbmltYXRlTG9hZGluZzogdHJ1ZSxcbiAgICBzbGlkZXJTaXplOiBcIm1cIixcbiAgICByZXNwb25zaXZlQmVoYXZpb3I6IFJlc3BvbnNpdmVCZWhhdmlvci5GaWxsLFxuICB9LFxuICBwcm9wZXJ0aWVzOiB7XG4gICAgZGVyaXZlZDogV2lkZ2V0LmdldERlcml2ZWRQcm9wZXJ0aWVzTWFwKCksXG4gICAgZGVmYXVsdDogV2lkZ2V0LmdldERlZmF1bHRQcm9wZXJ0aWVzTWFwKCksXG4gICAgbWV0YTogV2lkZ2V0LmdldE1ldGFQcm9wZXJ0aWVzTWFwKCksXG4gICAgY29udGVudENvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbnRlbnRDb25maWcoKSxcbiAgICBzdHlsZUNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZVN0eWxlQ29uZmlnKCksXG4gICAgc3R5bGVzaGVldENvbmZpZzogV2lkZ2V0LmdldFN0eWxlc2hlZXRDb25maWcoKSxcbiAgICBhdXRvY29tcGxldGVEZWZpbml0aW9uczogV2lkZ2V0LmdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zKCksXG4gIH0sXG4gIGF1dG9MYXlvdXQ6IHtcbiAgICBkaXNhYmxlZFByb3BzRGVmYXVsdHM6IHtcbiAgICAgIGxhYmVsUG9zaXRpb246IExhYmVsUG9zaXRpb24uVG9wLFxuICAgICAgbGFiZWxUZXh0U2l6ZTogXCIwLjg3NXJlbVwiLFxuICAgIH0sXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgIHJvd3M6IDcsXG4gICAgICBjb2x1bW5zOiA0MCxcbiAgICB9LFxuICAgIHdpZGdldFNpemU6IFtcbiAgICAgIHtcbiAgICAgICAgdmlld3BvcnRNaW5XaWR0aDogMCxcbiAgICAgICAgY29uZmlndXJhdGlvbjogKCkgPT4ge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtaW5XaWR0aDogXCIxODBweFwiLFxuICAgICAgICAgICAgbWluSGVpZ2h0OiBcIjcwcHhcIixcbiAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdLFxuICAgIGRpc2FibGVSZXNpemVIYW5kbGVzOiB7XG4gICAgICB2ZXJ0aWNhbDogdHJ1ZSxcbiAgICB9LFxuICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgV2lkZ2V0O1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsYUFBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsYUFBQTtBQWZaLFNBQVNFLFNBQVMsUUFBUSxtQkFBbUI7QUFDN0MsU0FBU0MsYUFBYSxRQUFRLHNCQUFzQjtBQUNwRCxTQUFTQyxrQkFBa0IsUUFBUSw0QkFBNEI7QUFFL0QsT0FBT0MsT0FBTyxNQUFNLFlBQVk7QUFDaEMsT0FBT0MsTUFBTSxNQUFNLFVBQVU7QUFFN0IsT0FBTyxNQUFNQyxNQUFNLElBQUFQLGFBQUEsR0FBQVEsQ0FBQSxPQUFHO0VBQ3BCQyxJQUFJLEVBQUVILE1BQU0sQ0FBQ0ksYUFBYSxDQUFDLENBQUM7RUFDNUJDLElBQUksRUFBRSxjQUFjO0VBQ3BCQyxTQUFTLEVBQUUsSUFBSTtFQUNmQyxPQUFPLEVBQUVSLE9BQU87RUFDaEJTLFFBQVEs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