import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import { MapTypes } from "./constants";

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
      type: "maps/world",
      renderAt: "chart-container",
      width: "600",
      height: "400",
      dataFormat: "json",
      dataSource: {
        chart: {
          caption: "World's Two Most Populous Continents",
          theme: "fusion",
          formatNumberScale: "0",
          numberSuffix: "M",
          useSNameInLabels: "0",
        },
        colorrange: {
          color: [
            {
              minvalue: "0",
              maxvalue: "100",
              code: "#D0DFA3",
              displayValue: "< 100M",
            },
            {
              minvalue: "100",
              maxvalue: "500",
              code: "#B0BF92",
              displayValue: "100-500M",
            },
            {
              minvalue: "500",
              maxvalue: "1000",
              code: "#91AF64",
              displayValue: "500M-1B",
            },
            {
              minvalue: "1000",
              maxvalue: "5000",
              code: "#A9FF8D",
              displayValue: "> 1B",
            },
          ],
        },

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
            showLabel: "1",
          },
          {
            id: "EU",
            value: "727",
          },
          {
            id: "AF",
            value: "885",
            showLabel: "1",
          },
          {
            id: "AU",
            value: "32",
          },
        ],
      },
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
