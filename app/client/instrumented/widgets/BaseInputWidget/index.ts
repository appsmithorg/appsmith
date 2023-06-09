function cov_2dhtlhwdcy() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/BaseInputWidget/index.ts";
  var hash = "5dc471694c956e377fad46fc3efbbfb3a5c51f19";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/BaseInputWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 9,
          column: 22
        },
        end: {
          line: 43,
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
    hash: "5dc471694c956e377fad46fc3efbbfb3a5c51f19"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_2dhtlhwdcy = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_2dhtlhwdcy();
import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_2dhtlhwdcy().s[0]++, {
  type: Widget.getWidgetType(),
  name: "Input",
  hideCard: true,
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 4,
    label: "Label",
    labelPosition: LabelPosition.Left,
    labelAlignment: Alignment.LEFT,
    labelTextSize: "0.875rem",
    labelWidth: 5,
    columns: 20,
    widgetName: "Input",
    version: 1,
    defaultText: "",
    iconAlign: "left",
    autoFocus: false,
    labelStyle: "",
    resetOnSubmit: true,
    isRequired: false,
    isDisabled: false,
    animateLoading: true,
    responsiveBehavior: ResponsiveBehavior.Fill,
    minWidth: FILL_WIDGET_MIN_WIDTH
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    autocompleteDefinitions: Widget.getAutocompleteDefinitions()
  }
});
export default Widget;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMmRodGxod2RjeSIsImFjdHVhbENvdmVyYWdlIiwiQWxpZ25tZW50IiwiTGFiZWxQb3NpdGlvbiIsIkZJTExfV0lER0VUX01JTl9XSURUSCIsIlJlc3BvbnNpdmVCZWhhdmlvciIsIkljb25TVkciLCJXaWRnZXQiLCJDT05GSUciLCJzIiwidHlwZSIsImdldFdpZGdldFR5cGUiLCJuYW1lIiwiaGlkZUNhcmQiLCJpY29uU1ZHIiwibmVlZHNNZXRhIiwiZGVmYXVsdHMiLCJyb3dzIiwibGFiZWwiLCJsYWJlbFBvc2l0aW9uIiwiTGVmdCIsImxhYmVsQWxpZ25tZW50IiwiTEVGVCIsImxhYmVsVGV4dFNpemUiLCJsYWJlbFdpZHRoIiwiY29sdW1ucyIsIndpZGdldE5hbWUiLCJ2ZXJzaW9uIiwiZGVmYXVsdFRleHQiLCJpY29uQWxpZ24iLCJhdXRvRm9jdXMiLCJsYWJlbFN0eWxlIiwicmVzZXRPblN1Ym1pdCIsImlzUmVxdWlyZWQiLCJpc0Rpc2FibGVkIiwiYW5pbWF0ZUxvYWRpbmciLCJyZXNwb25zaXZlQmVoYXZpb3IiLCJGaWxsIiwibWluV2lkdGgiLCJwcm9wZXJ0aWVzIiwiZGVyaXZlZCIsImdldERlcml2ZWRQcm9wZXJ0aWVzTWFwIiwiZGVmYXVsdCIsImdldERlZmF1bHRQcm9wZXJ0aWVzTWFwIiwibWV0YSIsImdldE1ldGFQcm9wZXJ0aWVzTWFwIiwiY29uZmlnIiwiZ2V0UHJvcGVydHlQYW5lQ29uZmlnIiwiYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiLCJnZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucyJdLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFsaWdubWVudCB9IGZyb20gXCJAYmx1ZXByaW50anMvY29yZVwiO1xuaW1wb3J0IHsgTGFiZWxQb3NpdGlvbiB9IGZyb20gXCJjb21wb25lbnRzL2NvbnN0YW50c1wiO1xuaW1wb3J0IHsgRklMTF9XSURHRVRfTUlOX1dJRFRIIH0gZnJvbSBcImNvbnN0YW50cy9taW5XaWR0aENvbnN0YW50c1wiO1xuaW1wb3J0IHsgUmVzcG9uc2l2ZUJlaGF2aW9yIH0gZnJvbSBcInV0aWxzL2F1dG9MYXlvdXQvY29uc3RhbnRzXCI7XG5cbmltcG9ydCBJY29uU1ZHIGZyb20gXCIuL2ljb24uc3ZnXCI7XG5pbXBvcnQgV2lkZ2V0IGZyb20gXCIuL3dpZGdldFwiO1xuXG5leHBvcnQgY29uc3QgQ09ORklHID0ge1xuICB0eXBlOiBXaWRnZXQuZ2V0V2lkZ2V0VHlwZSgpLFxuICBuYW1lOiBcIklucHV0XCIsXG4gIGhpZGVDYXJkOiB0cnVlLFxuICBpY29uU1ZHOiBJY29uU1ZHLFxuICBuZWVkc01ldGE6IHRydWUsXG4gIGRlZmF1bHRzOiB7XG4gICAgcm93czogNCxcbiAgICBsYWJlbDogXCJMYWJlbFwiLFxuICAgIGxhYmVsUG9zaXRpb246IExhYmVsUG9zaXRpb24uTGVmdCxcbiAgICBsYWJlbEFsaWdubWVudDogQWxpZ25tZW50LkxFRlQsXG4gICAgbGFiZWxUZXh0U2l6ZTogXCIwLjg3NXJlbVwiLFxuICAgIGxhYmVsV2lkdGg6IDUsXG4gICAgY29sdW1uczogMjAsXG4gICAgd2lkZ2V0TmFtZTogXCJJbnB1dFwiLFxuICAgIHZlcnNpb246IDEsXG4gICAgZGVmYXVsdFRleHQ6IFwiXCIsXG4gICAgaWNvbkFsaWduOiBcImxlZnRcIixcbiAgICBhdXRvRm9jdXM6IGZhbHNlLFxuICAgIGxhYmVsU3R5bGU6IFwiXCIsXG4gICAgcmVzZXRPblN1Ym1pdDogdHJ1ZSxcbiAgICBpc1JlcXVpcmVkOiBmYWxzZSxcbiAgICBpc0Rpc2FibGVkOiBmYWxzZSxcbiAgICBhbmltYXRlTG9hZGluZzogdHJ1ZSxcbiAgICByZXNwb25zaXZlQmVoYXZpb3I6IFJlc3BvbnNpdmVCZWhhdmlvci5GaWxsLFxuICAgIG1pbldpZHRoOiBGSUxMX1dJREdFVF9NSU5fV0lEVEgsXG4gIH0sXG4gIHByb3BlcnRpZXM6IHtcbiAgICBkZXJpdmVkOiBXaWRnZXQuZ2V0RGVyaXZlZFByb3BlcnRpZXNNYXAoKSxcbiAgICBkZWZhdWx0OiBXaWRnZXQuZ2V0RGVmYXVsdFByb3BlcnRpZXNNYXAoKSxcbiAgICBtZXRhOiBXaWRnZXQuZ2V0TWV0YVByb3BlcnRpZXNNYXAoKSxcbiAgICBjb25maWc6IFdpZGdldC5nZXRQcm9wZXJ0eVBhbmVDb25maWcoKSxcbiAgICBhdXRvY29tcGxldGVEZWZpbml0aW9uczogV2lkZ2V0LmdldEF1dG9jb21wbGV0ZURlZmluaXRpb25zKCksXG4gIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBXaWRnZXQ7XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsY0FBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsY0FBQTtBQWZaLFNBQVNFLFNBQVMsUUFBUSxtQkFBbUI7QUFDN0MsU0FBU0MsYUFBYSxRQUFRLHNCQUFzQjtBQUNwRCxTQUFTQyxxQkFBcUIsUUFBUSw2QkFBNkI7QUFDbkUsU0FBU0Msa0JBQWtCLFFBQVEsNEJBQTRCO0FBRS9ELE9BQU9DLE9BQU8sTUFBTSxZQUFZO0FBQ2hDLE9BQU9DLE1BQU0sTUFBTSxVQUFVO0FBRTdCLE9BQU8sTUFBTUMsTUFBTSxJQUFBUixjQUFBLEdBQUFTLENBQUEsT0FBRztFQUNwQkMsSUFBSSxFQUFFSCxNQUFNLENBQUNJLGFBQWEsQ0FBQyxDQUFDO0VBQzVCQyxJQUFJLEVBQUUsT0FBTztFQUNiQyxRQUFRLEVBQUUsSUFBSTtFQUNkQyxPQUFPLEVBQUVSLE9BQU87RUFDaEJTLFNBQVMsRUFBRSxJQUFJO0VBQ2ZDLFFBQVEsRUFBRTtJQUNSQyxJQUFJLEVBQUUsQ0FBQztJQUNQQyxLQUFLLEVBQUUsT0FBTztJQUNkQyxhQUFhLEVBQUVoQixhQUFhLENBQUNpQixJQUFJO0lBQ2pDQyxjQUFjLEVBQUVuQixTQUFTLENBQUNvQixJQUFJO0lBQzlCQyxhQUFhLEVBQUUsVUFBVTtJQUN6QkMsVUFBVSxFQUFFLENBQUM7SUFDYkMsT0FBTyxFQUFFLEVBQUU7SUFDWEMsVUFBVSxFQUFFLE9BQU87SUFDbkJDLE9BQU8sRUFBRSxDQUFDO0lBQ1ZDLFdBQVcsRUFBRSxFQUFFO0lBQ2ZDLFNBQVMsRUFBRSxNQUFNO0lBQ2pCQyxTQUFTLEVBQUUsS0FBSztJQUNoQkMsVUFBVSxFQUFFLEVBQUU7SUFDZEMsYUFBYSxFQUFFLElBQUk7SUFDbkJDLFVBQVUsRUFBRSxLQUFLO0lBQ2pCQyxVQUFVLEVBQUUsS0FBSztJQUNqQkMsY0FBYyxFQUFFLElBQUk7SUFDcEJDLGtCQUFrQixFQUFFL0Isa0JBQWtCLENBQUNnQyxJQUFJO0lBQzNDQyxRQUFRLEVBQUVsQztFQUNaLENBQUM7RUFDRG1DLFVBQVUsRUFBRTtJQUNWQyxPQUFPLEVBQUVqQyxNQUFNLENBQUNrQyx1QkFBdUIsQ0FBQyxDQUFDO0lBQ3pDQyxPQUFPLEVBQUVuQyxNQUFNLENBQUNvQyx1QkFBdUIsQ0FBQyxDQUFDO0lBQ3pDQyxJQUFJLEVBQUVyQyxNQUFNLENBQUNzQyxvQkFBb0IsQ0FBQyxDQUFDO0lBQ25DQyxNQUFNLEVBQUV2QyxNQUFNLENBQUN3QyxxQkFBcUIsQ0FBQyxDQUFDO0lBQ3RDQyx1QkFBdUIsRUFBRXpDLE1BQU0sQ0FBQzBDLDBCQUEwQixDQUFDO0VBQzdEO0FBQ0YsQ0FBQztBQUVELGVBQWUxQyxNQUFNIn0=