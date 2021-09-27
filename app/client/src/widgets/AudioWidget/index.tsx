import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Audio",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 1 * GRID_DENSITY_MIGRATION_V1,
    columns: 7 * GRID_DENSITY_MIGRATION_V1,
    widgetName: "Audio",
    url:
      "https://cdn.simplecast.com/audio/10488ddf-3ca4-4300-9391-c2967d806334/episodes/8c8341f0-0a3a-4f2c-bfe0-0abb6b3c1c87/audio/03e2e3d8-e703-4953-adc0-e72687f31178/default_tc.mp3",
    autoPlay: false,
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
