import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import { CameraModeTypes } from "./constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Camera", // The display name which will be made in uppercase and show in the widgets panel ( can have spaces )
  iconSVG: IconSVG,
  needsMeta: true, // Defines if this widget adds any meta properties
  isCanvas: false, // Defines if this widget has a canvas within in which we can drop other widgets
  defaults: {
    widgetName: "Camera",
    rows: 10.5 * GRID_DENSITY_MIGRATION_V1,
    columns: 7.5 * GRID_DENSITY_MIGRATION_V1,
    mode: CameraModeTypes.CAMERA,
    isDisabled: false,
    isVisible: true,
    isMirrored: false,
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
