import {
  ButtonBoxShadowTypes,
  FlexGap,
  Positioning,
} from "components/constants";
import { Colors } from "constants/Colors";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { WidgetHeightLimits } from "constants/WidgetConstants";
import { getDefaultResponsiveBehavior } from "utils/layoutPropertiesUtils";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Container",
  iconSVG: IconSVG,
  isCanvas: true,
  features: {
    dynamicHeight: {
      sectionIndex: 0,
      active: true,
    },
  },
  searchTags: ["div", "parent", "group"],
  defaults: {
    backgroundColor: "#FFFFFF",
    rows: WidgetHeightLimits.MIN_CANVAS_HEIGHT_IN_ROWS,
    columns: 24,
    widgetName: "Container",
    containerStyle: "card",
    borderColor: Colors.GREY_5,
    borderWidth: "1",
    boxShadow: ButtonBoxShadowTypes.NONE,
    animateLoading: true,
    children: [],
    blueprint: {
      view: [
        {
          type: "CANVAS_WIDGET",
          position: { top: 0, left: 0 },
          props: {
            containerStyle: "none",
            canExtend: false,
            detachFromLayout: true,
            children: [],
          },
        },
      ],
    },
    version: 1,
    positioning: Positioning.Vertical,
    flexGap: FlexGap.None,
    responsiveBehavior: getDefaultResponsiveBehavior(Widget.getWidgetType()),
    minWidth: FILL_WIDGET_MIN_WIDTH,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
    stylesheetConfig: Widget.getStylesheetConfig(),
  },
};

export default Widget;
