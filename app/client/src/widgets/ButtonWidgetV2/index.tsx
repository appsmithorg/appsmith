import { ButtonWidget } from "./widget";
import IconSVG from "./icon.svg";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import { ButtonPlacementTypes, RecaptchaTypes } from "components/constants";
import { BUTTON_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "layoutSystems/anvil/utils/constants";
import { BUTTON_COLORS, BUTTON_VARIANTS } from "@design-system/widgets";

export const CONFIG = {
  type: ButtonWidget.getWidgetType(),
  name: "Button",
  iconSVG: IconSVG,
  needsMeta: false,
  isCanvas: false,
  tags: [WIDGET_TAGS.BUTTONS],
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
    derived: ButtonWidget.getDerivedPropertiesMap(),
    default: ButtonWidget.getDefaultPropertiesMap(),
    meta: ButtonWidget.getMetaPropertiesMap(),
    contentConfig: ButtonWidget.getPropertyPaneContentConfig(),
    styleConfig: ButtonWidget.getPropertyPaneStyleConfig(),
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

export { ButtonWidget };
