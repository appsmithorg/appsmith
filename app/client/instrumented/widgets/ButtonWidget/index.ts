function cov_1523igbyr8() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/ButtonWidget/index.ts";
  var hash = "4eeb32bbf4abc4e1f65fb94e75b1a75384ecf080";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/ButtonWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 12,
          column: 22
        },
        end: {
          line: 70,
          column: 1
        }
      },
      "1": {
        start: {
          line: 58,
          column: 10
        },
        end: {
          line: 61,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 57,
            column: 23
          },
          end: {
            line: 57,
            column: 24
          }
        },
        loc: {
          start: {
            line: 57,
            column: 29
          },
          end: {
            line: 62,
            column: 9
          }
        },
        line: 57
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
    hash: "4eeb32bbf4abc4e1f65fb94e75b1a75384ecf080"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1523igbyr8 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1523igbyr8();
import { ButtonPlacementTypes, ButtonVariantTypes, RecaptchaTypes } from "components/constants";
import { BUTTON_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_1523igbyr8().s[0]++, {
  type: Widget.getWidgetType(),
  name: "Button",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["click", "submit"],
  defaults: {
    animateLoading: true,
    text: "Submit",
    buttonVariant: ButtonVariantTypes.PRIMARY,
    placement: ButtonPlacementTypes.CENTER,
    rows: 4,
    columns: 16,
    widgetName: "Button",
    isDisabled: false,
    isVisible: true,
    isDefaultClickDisabled: true,
    disabledWhenInvalid: false,
    resetFormOnClick: false,
    recaptchaType: RecaptchaTypes.V3,
    version: 1,
    responsiveBehavior: ResponsiveBehavior.Hug,
    minWidth: BUTTON_MIN_WIDTH
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
      columns: 6.453
    },
    autoDimension: {
      width: true
    },
    widgetSize: [{
      viewportMinWidth: 0,
      configuration: () => {
        cov_1523igbyr8().f[0]++;
        cov_1523igbyr8().s[1]++;
        return {
          minWidth: "120px",
          maxWidth: "360px"
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMTUyM2lnYnlyOCIsImFjdHVhbENvdmVyYWdlIiwiQnV0dG9uUGxhY2VtZW50VHlwZXMiLCJCdXR0b25WYXJpYW50VHlwZXMiLCJSZWNhcHRjaGFUeXBlcyIsIkJVVFRPTl9NSU5fV0lEVEgiLCJSZXNwb25zaXZlQmVoYXZpb3IiLCJJY29uU1ZHIiwiV2lkZ2V0IiwiQ09ORklHIiwicyIsInR5cGUiLCJnZXRXaWRnZXRUeXBlIiwibmFtZSIsImljb25TVkciLCJuZWVkc01ldGEiLCJzZWFyY2hUYWdzIiwiZGVmYXVsdHMiLCJhbmltYXRlTG9hZGluZyIsInRleHQiLCJidXR0b25WYXJpYW50IiwiUFJJTUFSWSIsInBsYWNlbWVudCIsIkNFTlRFUiIsInJvd3MiLCJjb2x1bW5zIiwid2lkZ2V0TmFtZSIsImlzRGlzYWJsZWQiLCJpc1Zpc2libGUiLCJpc0RlZmF1bHRDbGlja0Rpc2FibGVkIiwiZGlzYWJsZWRXaGVuSW52YWxpZCIsInJlc2V0Rm9ybU9uQ2xpY2siLCJyZWNhcHRjaGFUeXBlIiwiVjMiLCJ2ZXJzaW9uIiwicmVzcG9uc2l2ZUJlaGF2aW9yIiwiSHVnIiwibWluV2lkdGgiLCJwcm9wZXJ0aWVzIiwiZGVyaXZlZCIsImdldERlcml2ZWRQcm9wZXJ0aWVzTWFwIiwiZGVmYXVsdCIsImdldERlZmF1bHRQcm9wZXJ0aWVzTWFwIiwibWV0YSIsImdldE1ldGFQcm9wZXJ0aWVzTWFwIiwiY29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lQ29uZmlnIiwiY29udGVudENvbmZpZyIsImdldFByb3BlcnR5UGFuZUNvbnRlbnRDb25maWciLCJzdHlsZUNvbmZpZyIsImdldFByb3BlcnR5UGFuZVN0eWxlQ29uZmlnIiwic3R5bGVzaGVldENvbmZpZyIsImdldFN0eWxlc2hlZXRDb25maWciLCJhdXRvY29tcGxldGVEZWZpbml0aW9ucyIsImdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiYXV0b0xheW91dCIsImF1dG9EaW1lbnNpb24iLCJ3aWR0aCIsIndpZGdldFNpemUiLCJ2aWV3cG9ydE1pbldpZHRoIiwiY29uZmlndXJhdGlvbiIsImYiLCJtYXhXaWR0aCIsImRpc2FibGVSZXNpemVIYW5kbGVzIiwiaG9yaXpvbnRhbCIsInZlcnRpY2FsIl0sInNvdXJjZXMiOlsiaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQnV0dG9uUGxhY2VtZW50VHlwZXMsXG4gIEJ1dHRvblZhcmlhbnRUeXBlcyxcbiAgUmVjYXB0Y2hhVHlwZXMsXG59IGZyb20gXCJjb21wb25lbnRzL2NvbnN0YW50c1wiO1xuaW1wb3J0IHsgQlVUVE9OX01JTl9XSURUSCB9IGZyb20gXCJjb25zdGFudHMvbWluV2lkdGhDb25zdGFudHNcIjtcbmltcG9ydCB7IFJlc3BvbnNpdmVCZWhhdmlvciB9IGZyb20gXCJ1dGlscy9hdXRvTGF5b3V0L2NvbnN0YW50c1wiO1xuXG5pbXBvcnQgSWNvblNWRyBmcm9tIFwiLi9pY29uLnN2Z1wiO1xuaW1wb3J0IFdpZGdldCBmcm9tIFwiLi93aWRnZXRcIjtcblxuZXhwb3J0IGNvbnN0IENPTkZJRyA9IHtcbiAgdHlwZTogV2lkZ2V0LmdldFdpZGdldFR5cGUoKSxcbiAgbmFtZTogXCJCdXR0b25cIixcbiAgaWNvblNWRzogSWNvblNWRyxcbiAgbmVlZHNNZXRhOiB0cnVlLFxuICBzZWFyY2hUYWdzOiBbXCJjbGlja1wiLCBcInN1Ym1pdFwiXSxcbiAgZGVmYXVsdHM6IHtcbiAgICBhbmltYXRlTG9hZGluZzogdHJ1ZSxcbiAgICB0ZXh0OiBcIlN1Ym1pdFwiLFxuICAgIGJ1dHRvblZhcmlhbnQ6IEJ1dHRvblZhcmlhbnRUeXBlcy5QUklNQVJZLFxuICAgIHBsYWNlbWVudDogQnV0dG9uUGxhY2VtZW50VHlwZXMuQ0VOVEVSLFxuICAgIHJvd3M6IDQsXG4gICAgY29sdW1uczogMTYsXG4gICAgd2lkZ2V0TmFtZTogXCJCdXR0b25cIixcbiAgICBpc0Rpc2FibGVkOiBmYWxzZSxcbiAgICBpc1Zpc2libGU6IHRydWUsXG4gICAgaXNEZWZhdWx0Q2xpY2tEaXNhYmxlZDogdHJ1ZSxcbiAgICBkaXNhYmxlZFdoZW5JbnZhbGlkOiBmYWxzZSxcbiAgICByZXNldEZvcm1PbkNsaWNrOiBmYWxzZSxcbiAgICByZWNhcHRjaGFUeXBlOiBSZWNhcHRjaGFUeXBlcy5WMyxcbiAgICB2ZXJzaW9uOiAxLFxuICAgIHJlc3BvbnNpdmVCZWhhdmlvcjogUmVzcG9uc2l2ZUJlaGF2aW9yLkh1ZyxcbiAgICBtaW5XaWR0aDogQlVUVE9OX01JTl9XSURUSCxcbiAgfSxcbiAgcHJvcGVydGllczoge1xuICAgIGRlcml2ZWQ6IFdpZGdldC5nZXREZXJpdmVkUHJvcGVydGllc01hcCgpLFxuICAgIGRlZmF1bHQ6IFdpZGdldC5nZXREZWZhdWx0UHJvcGVydGllc01hcCgpLFxuICAgIG1ldGE6IFdpZGdldC5nZXRNZXRhUHJvcGVydGllc01hcCgpLFxuICAgIGNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbmZpZygpLFxuICAgIGNvbnRlbnRDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnKCksXG4gICAgc3R5bGVDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVTdHlsZUNvbmZpZygpLFxuICAgIHN0eWxlc2hlZXRDb25maWc6IFdpZGdldC5nZXRTdHlsZXNoZWV0Q29uZmlnKCksXG4gICAgYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnM6IFdpZGdldC5nZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucygpLFxuICB9LFxuICBhdXRvTGF5b3V0OiB7XG4gICAgZGVmYXVsdHM6IHtcbiAgICAgIHJvd3M6IDQsXG4gICAgICBjb2x1bW5zOiA2LjQ1MyxcbiAgICB9LFxuICAgIGF1dG9EaW1lbnNpb246IHtcbiAgICAgIHdpZHRoOiB0cnVlLFxuICAgIH0sXG4gICAgd2lkZ2V0U2l6ZTogW1xuICAgICAge1xuICAgICAgICB2aWV3cG9ydE1pbldpZHRoOiAwLFxuICAgICAgICBjb25maWd1cmF0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1pbldpZHRoOiBcIjEyMHB4XCIsXG4gICAgICAgICAgICBtYXhXaWR0aDogXCIzNjBweFwiLFxuICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF0sXG4gICAgZGlzYWJsZVJlc2l6ZUhhbmRsZXM6IHtcbiAgICAgIGhvcml6b250YWw6IHRydWUsXG4gICAgICB2ZXJ0aWNhbDogdHJ1ZSxcbiAgICB9LFxuICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgV2lkZ2V0O1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsY0FBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsY0FBQTtBQWZaLFNBQ0VFLG9CQUFvQixFQUNwQkMsa0JBQWtCLEVBQ2xCQyxjQUFjLFFBQ1Qsc0JBQXNCO0FBQzdCLFNBQVNDLGdCQUFnQixRQUFRLDZCQUE2QjtBQUM5RCxTQUFTQyxrQkFBa0IsUUFBUSw0QkFBNEI7QUFFL0QsT0FBT0MsT0FBTyxNQUFNLFlBQVk7QUFDaEMsT0FBT0MsTUFBTSxNQUFNLFVBQVU7QUFFN0IsT0FBTyxNQUFNQyxNQUFNLElBQUFULGNBQUEsR0FBQVUsQ0FBQSxPQUFHO0VBQ3BCQyxJQUFJLEVBQUVILE1BQU0sQ0FBQ0ksYUFBYSxDQUFDLENBQUM7RUFDNUJDLElBQUksRUFBRSxRQUFRO0VBQ2RDLE9BQU8sRUFBRVAsT0FBTztFQUNoQlEsU0FBUyxFQUFFLElBQUk7RUFDZkMsVUFBVSxFQUFFLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQztFQUMvQkMsUUFBUSxFQUFFO0lBQ1JDLGNBQWMsRUFBRSxJQUFJO0lBQ3BCQyxJQUFJLEVBQUUsUUFBUTtJQUNkQyxhQUFhLEVBQUVqQixrQkFBa0IsQ0FBQ2tCLE9BQU87SUFDekNDLFNBQVMsRUFBRXBCLG9CQUFvQixDQUFDcUIsTUFBTTtJQUN0Q0MsSUFBSSxFQUFFLENBQUM7SUFDUEMsT0FBTyxFQUFFLEVBQUU7SUFDWEMsVUFBVSxFQUFFLFFBQVE7SUFDcEJDLFVBQVUsRUFBRSxLQUFLO0lBQ2pCQyxTQUFTLEVBQUUsSUFBSTtJQUNmQyxzQkFBc0IsRUFBRSxJQUFJO0lBQzVCQyxtQkFBbUIsRUFBRSxLQUFLO0lBQzFCQyxnQkFBZ0IsRUFBRSxLQUFLO0lBQ3ZCQyxhQUFhLEVBQUU1QixjQUFjLENBQUM2QixFQUFFO0lBQ2hDQyxPQUFPLEVBQUUsQ0FBQztJQUNWQyxrQkFBa0IsRUFBRTdCLGtCQUFrQixDQUFDOEIsR0FBRztJQUMxQ0MsUUFBUSxFQUFFaEM7RUFDWixDQUFDO0VBQ0RpQyxVQUFVLEVBQUU7SUFDVkMsT0FBTyxFQUFFL0IsTUFBTSxDQUFDZ0MsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsT0FBTyxFQUFFakMsTUFBTSxDQUFDa0MsdUJBQXVCLENBQUMsQ0FBQztJQUN6Q0MsSUFBSSxFQUFFbkMsTUFBTSxDQUFDb0Msb0JBQW9CLENBQUMsQ0FBQztJQUNuQ0MsTUFBTSxFQUFFckMsTUFBTSxDQUFDc0MscUJBQXFCLENBQUMsQ0FBQztJQUN0Q0MsYUFBYSxFQUFFdkMsTUFBTSxDQUFDd0MsNEJBQTRCLENBQUMsQ0FBQztJQUNwREMsV0FBVyxFQUFFekMsTUFBTSxDQUFDMEMsMEJBQTBCLENBQUMsQ0FBQztJQUNoREMsZ0JBQWdCLEVBQUUzQyxNQUFNLENBQUM0QyxtQkFBbUIsQ0FBQyxDQUFDO0lBQzlDQyx1QkFBdUIsRUFBRTdDLE1BQU0sQ0FBQzhDLDBCQUEwQixDQUFDO0VBQzdELENBQUM7RUFDREMsVUFBVSxFQUFFO0lBQ1Z0QyxRQUFRLEVBQUU7TUFDUk8sSUFBSSxFQUFFLENBQUM7TUFDUEMsT0FBTyxFQUFFO0lBQ1gsQ0FBQztJQUNEK0IsYUFBYSxFQUFFO01BQ2JDLEtBQUssRUFBRTtJQUNULENBQUM7SUFDREMsVUFBVSxFQUFFLENBQ1Y7TUFDRUMsZ0JBQWdCLEVBQUUsQ0FBQztNQUNuQkMsYUFBYSxFQUFFQSxDQUFBLEtBQU07UUFBQTVELGNBQUEsR0FBQTZELENBQUE7UUFBQTdELGNBQUEsR0FBQVUsQ0FBQTtRQUNuQixPQUFPO1VBQ0wyQixRQUFRLEVBQUUsT0FBTztVQUNqQnlCLFFBQVEsRUFBRTtRQUNaLENBQUM7TUFDSDtJQUNGLENBQUMsQ0FDRjtJQUNEQyxvQkFBb0IsRUFBRTtNQUNwQkMsVUFBVSxFQUFFLElBQUk7TUFDaEJDLFFBQVEsRUFBRTtJQUNaO0VBQ0Y7QUFDRixDQUFDO0FBRUQsZUFBZXpELE1BQU0ifQ==