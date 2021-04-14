import Widget from "./widget";
import IconSVG from "./icon.svg";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Form",
  iconSVG: IconSVG,
  defaults: {
    rows: 13,
    columns: 7,
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
                  size: { rows: 1, cols: 12 },
                  position: { top: 0, left: 0 },
                  props: {
                    text: "Form",
                    textStyle: "HEADING",
                    version: 1,
                  },
                },
                {
                  type: "FORM_BUTTON_WIDGET",
                  size: { rows: 1, cols: 4 },
                  position: { top: 11, left: 12 },
                  props: {
                    text: "Submit",
                    buttonStyle: "PRIMARY_BUTTON",
                    disabledWhenInvalid: true,
                    resetFormOnClick: true,
                    version: 1,
                  },
                },
                {
                  type: "FORM_BUTTON_WIDGET",
                  size: { rows: 1, cols: 4 },
                  position: { top: 11, left: 8 },
                  props: {
                    text: "Reset",
                    buttonStyle: "SECONDARY_BUTTON",
                    disabledWhenInvalid: false,
                    resetFormOnClick: true,
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
    validations: Widget.getPropertyValidationMap(),
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
