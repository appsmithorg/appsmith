import { ButtonVariantTypes, RecaptchaTypes } from "components/constants";
import { Colors } from "constants/Colors";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Form",
  iconSVG: IconSVG,
  needsMeta: true,
  isCanvas: true,
  defaults: {
    rows: 40,
    columns: 24,
    animateLoading: true,
    widgetName: "Form",
    backgroundColor: "white",
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
                    fontSize: "HEADING1",
                    version: 1,
                  },
                },
                {
                  type: "FORM_BUTTON_WIDGET",
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
                    buttonColor: Colors.GREEN,
                    disabledWhenInvalid: true,
                    resetFormOnClick: true,
                    recaptchaType: RecaptchaTypes.V3,
                    version: 1,
                  },
                },
                {
                  type: "FORM_BUTTON_WIDGET",
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
                    buttonColor: Colors.GREEN,
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
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
