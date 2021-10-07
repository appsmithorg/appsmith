import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import { ButtonVariantTypes } from "components/constants";
import { Colors } from "constants/Colors";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Form",
  iconSVG: IconSVG,
  needsMeta: true,
  isCanvas: true,
  defaults: {
    rows: 10 * GRID_DENSITY_MIGRATION_V1,
    columns: 6 * GRID_DENSITY_MIGRATION_V1,
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
                    rows: 1 * GRID_DENSITY_MIGRATION_V1,
                    cols: 6 * GRID_DENSITY_MIGRATION_V1,
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
                    rows: 1 * GRID_DENSITY_MIGRATION_V1,
                    cols: 4 * GRID_DENSITY_MIGRATION_V1,
                  },
                  position: {
                    top: 8.25 * GRID_DENSITY_MIGRATION_V1,
                    left: 11.6 * GRID_DENSITY_MIGRATION_V1,
                  },
                  props: {
                    text: "Submit",
                    buttonVariant: ButtonVariantTypes.SOLID,
                    buttonColor: Colors.GREEN,
                    disabledWhenInvalid: true,
                    resetFormOnClick: true,
                    recaptchaV2: false,
                    version: 1,
                  },
                },
                {
                  type: "FORM_BUTTON_WIDGET",
                  size: {
                    rows: 1 * GRID_DENSITY_MIGRATION_V1,
                    cols: 4 * GRID_DENSITY_MIGRATION_V1,
                  },
                  position: {
                    top: 8.25 * GRID_DENSITY_MIGRATION_V1,
                    left: 7.5 * GRID_DENSITY_MIGRATION_V1,
                  },
                  props: {
                    text: "Reset",
                    buttonVariant: ButtonVariantTypes.OUTLINE,
                    buttonColor: Colors.GREEN,
                    disabledWhenInvalid: false,
                    resetFormOnClick: true,
                    recaptchaV2: false,
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
