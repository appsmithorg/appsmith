import { ButtonVariantTypes, RecaptchaTypes } from "components/constants";
import { Colors } from "constants/Colors";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { GridDefaults } from "constants/WidgetConstants";
import { Positioning } from "utils/autoLayout/constants";
import { getDefaultResponsiveBehavior } from "utils/layoutPropertiesUtils";
import { WidgetProps } from "widgets/BaseWidget";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Form",
  iconSVG: IconSVG,
  needsMeta: true,
  isCanvas: true,
  features: {
    dynamicHeight: {
      sectionIndex: 0,
      active: true,
    },
  },
  canvasHeightOffset: (props: WidgetProps): number => {
    const offset =
      props.borderWidth && props.borderWidth > 1
        ? Math.round(
            (2 * parseInt(props.borderWidth, 10) || 0) /
              GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
          )
        : 0;

    return offset;
  },
  searchTags: ["group"],
  defaults: {
    rows: 40,
    columns: 24,
    borderColor: Colors.GREY_5,
    borderWidth: "1",
    animateLoading: true,
    widgetName: "Form",
    backgroundColor: Colors.WHITE,
    children: [],
    positioning: Positioning.Fixed,
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
            version: 1,
            blueprint: {
              view: [
                {
                  type: "TEXT_WIDGET",
                  size: {
                    rows: 4,
                    cols: 24,
                  },
                  position: { top: 1, left: 1.5 },
                  props: {
                    text: "Form",
                    fontSize: "1.25rem",
                    version: 1,
                  },
                },
                {
                  type: "BUTTON_WIDGET",
                  size: {
                    rows: 4,
                    cols: 16,
                  },
                  position: {
                    top: 33,
                    left: 46,
                  },
                  props: {
                    text: "Submit",
                    buttonVariant: ButtonVariantTypes.PRIMARY,
                    disabledWhenInvalid: true,
                    resetFormOnClick: true,
                    recaptchaType: RecaptchaTypes.V3,
                    version: 1,
                  },
                },
                {
                  type: "BUTTON_WIDGET",
                  size: {
                    rows: 4,
                    cols: 16,
                  },
                  position: {
                    top: 33,
                    left: 30,
                  },
                  props: {
                    text: "Reset",
                    buttonVariant: ButtonVariantTypes.SECONDARY,
                    disabledWhenInvalid: false,
                    resetFormOnClick: true,
                    recaptchaType: RecaptchaTypes.V3,
                    version: 1,
                  },
                },
              ],
            },
          },
        },
      ],
    },
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
