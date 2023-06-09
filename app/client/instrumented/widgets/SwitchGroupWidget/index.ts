function cov_e8avp2ouk() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/SwitchGroupWidget/index.ts";
  var hash = "f12659496e7f64a2e3f0591012042ad937a6d3e0";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/SwitchGroupWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 7,
          column: 22
        },
        end: {
          line: 78,
          column: 1
        }
      },
      "1": {
        start: {
          line: 67,
          column: 10
        },
        end: {
          line: 70,
          column: 12
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 66,
            column: 23
          },
          end: {
            line: 66,
            column: 24
          }
        },
        loc: {
          start: {
            line: 66,
            column: 29
          },
          end: {
            line: 71,
            column: 9
          }
        },
        line: 66
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
    hash: "f12659496e7f64a2e3f0591012042ad937a6d3e0"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_e8avp2ouk = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_e8avp2ouk();
import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_e8avp2ouk().s[0]++, {
  features: {
    dynamicHeight: {
      sectionIndex: 3,
      active: true
    }
  },
  type: Widget.getWidgetType(),
  name: "Switch Group",
  // The display name which will be made in uppercase and show in the widgets panel ( can have spaces )
  iconSVG: IconSVG,
  needsMeta: true,
  // Defines if this widget adds any meta properties
  isCanvas: false,
  // Defines if this widget has a canvas within in which we can drop other widgets
  defaults: {
    widgetName: "SwitchGroup",
    rows: 6,
    columns: 26,
    options: [{
      label: "Blue",
      value: "BLUE"
    }, {
      label: "Green",
      value: "GREEN"
    }, {
      label: "Red",
      value: "RED"
    }],
    defaultSelectedValues: ["BLUE"],
    isDisabled: false,
    isRequired: false,
    isInline: true,
    isVisible: true,
    animateLoading: true,
    alignment: Alignment.LEFT,
    labelText: "Label",
    labelPosition: LabelPosition.Top,
    labelAlignment: Alignment.LEFT,
    labelWidth: 5,
    version: 1,
    labelTextSize: "0.875rem"
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
    disabledPropsDefaults: {
      labelPosition: LabelPosition.Top
    },
    defaults: {
      columns: 14,
      rows: 7
    },
    autoDimension: {
      height: true
    },
    widgetSize: [{
      viewportMinWidth: 0,
      configuration: () => {
        cov_e8avp2ouk().f[0]++;
        cov_e8avp2ouk().s[1]++;
        return {
          minWidth: "240px",
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfZThhdnAyb3VrIiwiYWN0dWFsQ292ZXJhZ2UiLCJBbGlnbm1lbnQiLCJMYWJlbFBvc2l0aW9uIiwiSWNvblNWRyIsIldpZGdldCIsIkNPTkZJRyIsInMiLCJmZWF0dXJlcyIsImR5bmFtaWNIZWlnaHQiLCJzZWN0aW9uSW5kZXgiLCJhY3RpdmUiLCJ0eXBlIiwiZ2V0V2lkZ2V0VHlwZSIsIm5hbWUiLCJpY29uU1ZHIiwibmVlZHNNZXRhIiwiaXNDYW52YXMiLCJkZWZhdWx0cyIsIndpZGdldE5hbWUiLCJyb3dzIiwiY29sdW1ucyIsIm9wdGlvbnMiLCJsYWJlbCIsInZhbHVlIiwiZGVmYXVsdFNlbGVjdGVkVmFsdWVzIiwiaXNEaXNhYmxlZCIsImlzUmVxdWlyZWQiLCJpc0lubGluZSIsImlzVmlzaWJsZSIsImFuaW1hdGVMb2FkaW5nIiwiYWxpZ25tZW50IiwiTEVGVCIsImxhYmVsVGV4dCIsImxhYmVsUG9zaXRpb24iLCJUb3AiLCJsYWJlbEFsaWdubWVudCIsImxhYmVsV2lkdGgiLCJ2ZXJzaW9uIiwibGFiZWxUZXh0U2l6ZSIsInByb3BlcnRpZXMiLCJkZXJpdmVkIiwiZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAiLCJkZWZhdWx0IiwiZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAiLCJtZXRhIiwiZ2V0TWV0YVByb3BlcnRpZXNNYXAiLCJjb25maWciLCJnZXRQcm9wZXJ0eVBhbmVDb25maWciLCJjb250ZW50Q29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lQ29udGVudENvbmZpZyIsInN0eWxlQ29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lU3R5bGVDb25maWciLCJzdHlsZXNoZWV0Q29uZmlnIiwiZ2V0U3R5bGVzaGVldENvbmZpZyIsImF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiLCJhdXRvTGF5b3V0IiwiZGlzYWJsZWRQcm9wc0RlZmF1bHRzIiwiYXV0b0RpbWVuc2lvbiIsImhlaWdodCIsIndpZGdldFNpemUiLCJ2aWV3cG9ydE1pbldpZHRoIiwiY29uZmlndXJhdGlvbiIsImYiLCJtaW5XaWR0aCIsIm1pbkhlaWdodCIsImRpc2FibGVSZXNpemVIYW5kbGVzIiwidmVydGljYWwiXSwic291cmNlcyI6WyJpbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBbGlnbm1lbnQgfSBmcm9tIFwiQGJsdWVwcmludGpzL2NvcmVcIjtcbmltcG9ydCB7IExhYmVsUG9zaXRpb24gfSBmcm9tIFwiY29tcG9uZW50cy9jb25zdGFudHNcIjtcblxuaW1wb3J0IEljb25TVkcgZnJvbSBcIi4vaWNvbi5zdmdcIjtcbmltcG9ydCBXaWRnZXQgZnJvbSBcIi4vd2lkZ2V0XCI7XG5cbmV4cG9ydCBjb25zdCBDT05GSUcgPSB7XG4gIGZlYXR1cmVzOiB7XG4gICAgZHluYW1pY0hlaWdodDoge1xuICAgICAgc2VjdGlvbkluZGV4OiAzLFxuICAgICAgYWN0aXZlOiB0cnVlLFxuICAgIH0sXG4gIH0sXG4gIHR5cGU6IFdpZGdldC5nZXRXaWRnZXRUeXBlKCksXG4gIG5hbWU6IFwiU3dpdGNoIEdyb3VwXCIsIC8vIFRoZSBkaXNwbGF5IG5hbWUgd2hpY2ggd2lsbCBiZSBtYWRlIGluIHVwcGVyY2FzZSBhbmQgc2hvdyBpbiB0aGUgd2lkZ2V0cyBwYW5lbCAoIGNhbiBoYXZlIHNwYWNlcyApXG4gIGljb25TVkc6IEljb25TVkcsXG4gIG5lZWRzTWV0YTogdHJ1ZSwgLy8gRGVmaW5lcyBpZiB0aGlzIHdpZGdldCBhZGRzIGFueSBtZXRhIHByb3BlcnRpZXNcbiAgaXNDYW52YXM6IGZhbHNlLCAvLyBEZWZpbmVzIGlmIHRoaXMgd2lkZ2V0IGhhcyBhIGNhbnZhcyB3aXRoaW4gaW4gd2hpY2ggd2UgY2FuIGRyb3Agb3RoZXIgd2lkZ2V0c1xuICBkZWZhdWx0czoge1xuICAgIHdpZGdldE5hbWU6IFwiU3dpdGNoR3JvdXBcIixcbiAgICByb3dzOiA2LFxuICAgIGNvbHVtbnM6IDI2LFxuICAgIG9wdGlvbnM6IFtcbiAgICAgIHsgbGFiZWw6IFwiQmx1ZVwiLCB2YWx1ZTogXCJCTFVFXCIgfSxcbiAgICAgIHsgbGFiZWw6IFwiR3JlZW5cIiwgdmFsdWU6IFwiR1JFRU5cIiB9LFxuICAgICAgeyBsYWJlbDogXCJSZWRcIiwgdmFsdWU6IFwiUkVEXCIgfSxcbiAgICBdLFxuICAgIGRlZmF1bHRTZWxlY3RlZFZhbHVlczogW1wiQkxVRVwiXSxcbiAgICBpc0Rpc2FibGVkOiBmYWxzZSxcbiAgICBpc1JlcXVpcmVkOiBmYWxzZSxcbiAgICBpc0lubGluZTogdHJ1ZSxcbiAgICBpc1Zpc2libGU6IHRydWUsXG4gICAgYW5pbWF0ZUxvYWRpbmc6IHRydWUsXG4gICAgYWxpZ25tZW50OiBBbGlnbm1lbnQuTEVGVCxcbiAgICBsYWJlbFRleHQ6IFwiTGFiZWxcIixcbiAgICBsYWJlbFBvc2l0aW9uOiBMYWJlbFBvc2l0aW9uLlRvcCxcbiAgICBsYWJlbEFsaWdubWVudDogQWxpZ25tZW50LkxFRlQsXG4gICAgbGFiZWxXaWR0aDogNSxcbiAgICB2ZXJzaW9uOiAxLFxuICAgIGxhYmVsVGV4dFNpemU6IFwiMC44NzVyZW1cIixcbiAgfSxcbiAgcHJvcGVydGllczoge1xuICAgIGRlcml2ZWQ6IFdpZGdldC5nZXREZXJpdmVkUHJvcGVydGllc01hcCgpLFxuICAgIGRlZmF1bHQ6IFdpZGdldC5nZXREZWZhdWx0UHJvcGVydGllc01hcCgpLFxuICAgIG1ldGE6IFdpZGdldC5nZXRNZXRhUHJvcGVydGllc01hcCgpLFxuICAgIGNvbmZpZzogV2lkZ2V0LmdldFByb3BlcnR5UGFuZUNvbmZpZygpLFxuICAgIGNvbnRlbnRDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVDb250ZW50Q29uZmlnKCksXG4gICAgc3R5bGVDb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVTdHlsZUNvbmZpZygpLFxuICAgIHN0eWxlc2hlZXRDb25maWc6IFdpZGdldC5nZXRTdHlsZXNoZWV0Q29uZmlnKCksXG4gICAgYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnM6IFdpZGdldC5nZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucygpLFxuICB9LFxuICBhdXRvTGF5b3V0OiB7XG4gICAgZGlzYWJsZWRQcm9wc0RlZmF1bHRzOiB7XG4gICAgICBsYWJlbFBvc2l0aW9uOiBMYWJlbFBvc2l0aW9uLlRvcCxcbiAgICB9LFxuICAgIGRlZmF1bHRzOiB7XG4gICAgICBjb2x1bW5zOiAxNCxcbiAgICAgIHJvd3M6IDcsXG4gICAgfSxcbiAgICBhdXRvRGltZW5zaW9uOiB7XG4gICAgICBoZWlnaHQ6IHRydWUsXG4gICAgfSxcbiAgICB3aWRnZXRTaXplOiBbXG4gICAgICB7XG4gICAgICAgIHZpZXdwb3J0TWluV2lkdGg6IDAsXG4gICAgICAgIGNvbmZpZ3VyYXRpb246ICgpID0+IHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWluV2lkdGg6IFwiMjQwcHhcIixcbiAgICAgICAgICAgIG1pbkhlaWdodDogXCI3MHB4XCIsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSxcbiAgICBkaXNhYmxlUmVzaXplSGFuZGxlczoge1xuICAgICAgdmVydGljYWw6IHRydWUsXG4gICAgfSxcbiAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFdpZGdldDtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGFBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGFBQUE7QUFmWixTQUFTRSxTQUFTLFFBQVEsbUJBQW1CO0FBQzdDLFNBQVNDLGFBQWEsUUFBUSxzQkFBc0I7QUFFcEQsT0FBT0MsT0FBTyxNQUFNLFlBQVk7QUFDaEMsT0FBT0MsTUFBTSxNQUFNLFVBQVU7QUFFN0IsT0FBTyxNQUFNQyxNQUFNLElBQUFOLGFBQUEsR0FBQU8s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