import Widget from "./widget";
import IconSVG from "./icon.svg";
import { ButtonPlacementTypes, RecaptchaTypes } from "components/constants";
import { BUTTON_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { BUTTON_COLORS, BUTTON_VARIANTS } from "@design-system/widgets";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Button",
  iconSVG: IconSVG,
  needsMeta: false,
  isCanvas: false,
  searchTags: ["click", "submit"],
  features: {
    dynamicHeight: {
      sectionIndex: 0,
      active: false,
    },
  },
  defaults: {
    animateLoading: true,
    text: "Submit",
    buttonVariant: BUTTON_VARIANTS.FILLED,
    buttonColor: BUTTON_COLORS.ACCENT,
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
    minWidth: BUTTON_MIN_WIDTH,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
  },
  autoLayout: {
    defaults: {
      rows: 4,
      columns: 6.453,
    },
    autoDimension: {
      width: true,
    },
    widgetSize: [
      {
        viewportMinWidth: 0,
        configuration: () => {
          return {
            minWidth: "120px",
            maxWidth: "360px",
            minHeight: "40px",
          };
        },
      },
    ],
    disableResizeHandles: {
      horizontal: true,
      vertical: true,
    },
  },
};

export default Widget;
