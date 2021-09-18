import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import { Alignment } from "@blueprintjs/core";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Switch Group", // The display name which will be made in uppercase and show in the widgets panel ( can have spaces )
  iconSVG: IconSVG,
  needsMeta: true, // Defines if this widget adds any meta properties
  isCanvas: false, // Defines if this widget has a canvas within in which we can drop other widgets
  defaults: {
    widgetName: "SwitchGroup",
    rows: 1.5 * GRID_DENSITY_MIGRATION_V1,
    columns: 4.5 * GRID_DENSITY_MIGRATION_V1,
    groupItems: {
      item1: {
        id: "item1",
        label: "Apple",
        value: "apple",
        alignIndicator: Alignment.LEFT,
        defaultChecked: true,
        widgetId: "",
        isVisible: true,
        isDisabled: false,
        index: 0,
      },
      item2: {
        id: "item2",
        label: "Orange",
        value: "orange",
        alignIndicator: Alignment.LEFT,
        widgetId: "",
        isVisible: true,
        isDisabled: false,
        index: 1,
      },
      item3: {
        id: "item3",
        label: "Lemon",
        value: "lemon",
        alignIndicator: Alignment.LEFT,
        widgetId: "",
        isVisible: true,
        isDisabled: false,
        index: 2,
      },
    },
    isDisabled: false,
    isInline: true,
    isVisible: true,
    version: 1,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
