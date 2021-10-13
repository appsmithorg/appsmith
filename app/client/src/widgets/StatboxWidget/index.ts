import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import { Colors } from "constants/Colors";
import { ButtonVariantTypes } from "components/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Stats Box",
  iconSVG: IconSVG,
  needsMeta: true,
  isCanvas: true,
  defaults: {
    rows: 3.5 * GRID_DENSITY_MIGRATION_V1,
    columns: 4 * GRID_DENSITY_MIGRATION_V1,
    widgetName: "Statbox",
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
                    cols: 9 * GRID_DENSITY_MIGRATION_V1,
                  },
                  position: { top: 0, left: 1 },
                  props: {
                    text: "Page Views",
                    fontSize: "PARAGRAPH2",
                    textColor: "#999999",
                    version: 1,
                  },
                },
                {
                  type: "TEXT_WIDGET",
                  size: {
                    rows: 1 * GRID_DENSITY_MIGRATION_V1,
                    cols: 9 * GRID_DENSITY_MIGRATION_V1,
                  },
                  position: {
                    top: 1 * GRID_DENSITY_MIGRATION_V1,
                    left: 1,
                  },
                  props: {
                    text: "2.6 M",
                    fontSize: "HEADING1",
                    fontStyle: "BOLD",
                    version: 1,
                  },
                },
                {
                  type: "TEXT_WIDGET",
                  size: {
                    rows: 1 * GRID_DENSITY_MIGRATION_V1,
                    cols: 9 * GRID_DENSITY_MIGRATION_V1,
                  },
                  position: {
                    top: 2 * GRID_DENSITY_MIGRATION_V1,
                    left: 1,
                  },
                  props: {
                    text: "21% more than last month",
                    fontSize: "PARAGRAPH2",
                    textColor: Colors.GREEN,
                    version: 1,
                  },
                },
                {
                  type: "ICON_BUTTON_WIDGET",
                  size: {
                    rows: 2 * GRID_DENSITY_MIGRATION_V1,
                    cols: 4 * GRID_DENSITY_MIGRATION_V1,
                  },
                  position: {
                    top: 2,
                    left: 11.5 * GRID_DENSITY_MIGRATION_V1,
                  },
                  props: {
                    iconName: "arrow-top-right",
                    buttonStyle: "PRIMARY",
                    buttonVariant: ButtonVariantTypes.PRIMARY,
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
