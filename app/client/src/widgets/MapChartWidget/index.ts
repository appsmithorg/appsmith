import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import { colorRange, dataSetForWorld, MapTypes } from "./constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Map Chart", // The display name which will be made in uppercase and show in the widgets panel ( can have spaces )
  iconSVG: IconSVG,
  needsMeta: true, // Defines if this widget adds any meta properties
  isCanvas: false, // Defines if this widget has a canvas within in which we can drop other widgets
  defaults: {
    rows: 8 * GRID_DENSITY_MIGRATION_V1,
    columns: 6 * GRID_DENSITY_MIGRATION_V1,
    widgetName: "MapChart",
    version: 1,
    mapType: MapTypes.WORLD,
    mapTitle: "Global Population",
    showLabels: true,
    data: [
      {
        id: "NA",
        value: "515",
      },
      {
        id: "SA",
        value: "373",
      },
      {
        id: "AS",
        value: "3875",
      },
      {
        id: "EU",
        value: "727",
      },
      {
        id: "AF",
        value: "885",
      },
      {
        id: "AU",
        value: "32",
      },
    ],
    customFusionMapConfig: {
      type: "maps/world", // The chart type
      width: "100%", // Width of the chart
      height: "100%", // Height of the chart
      dataFormat: "json", // Data type
      dataSource: {
        // Map Configuration
        chart: {
          caption: "Average Annual Population Growth",
          // subcaption: " 1955-2015",
          // numbersuffix: "%",
          includevalueinlabels: "1",
          labelsepchar: ": ",
          entityFillHoverColor: "#FFF9C4",
          showLabels: true,
          theme: "fusion",
        },
        // Aesthetics; ranges synced with the slider
        colorrange: colorRange,
        // Source data as JSON --> id represents countries of the world.
        data: dataSetForWorld,
      },
      events: {},
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
