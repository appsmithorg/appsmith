import React, { useEffect, useState } from "react";
import styled from "styled-components";
// Include the react-fusioncharts component
import ReactFC from "react-fusioncharts";
// Include the fusioncharts library
import FusionCharts, { ChartObject } from "fusioncharts";

// Import FusionMaps
import FusionMaps from "fusioncharts/fusioncharts.maps";
import World from "fusioncharts/maps/fusioncharts.world";
import WorldWithAntarctica from "fusionmaps/maps/fusioncharts.worldwithantarctica";
import Europe from "fusionmaps/maps/fusioncharts.europe";
import NorthAmerica from "fusionmaps/maps/fusioncharts.northamerica";
import SouthAmerica from "fusionmaps/maps/fusioncharts.southamerica";
import Asia from "fusionmaps/maps/fusioncharts.asia";
import Oceania from "fusionmaps/maps/fusioncharts.oceania";
import Africa from "fusionmaps/maps/fusioncharts.africa";

// Include the theme as fusion
import FusionTheme from "fusioncharts/themes/fusioncharts.theme.fusion";

import { WIDGET_PADDING } from "constants/WidgetConstants";

// Adding the chart and theme as dependency to the core fusioncharts
ReactFC.fcRoot(FusionCharts, FusionMaps, World, FusionTheme);
ReactFC.fcRoot(FusionCharts, FusionMaps, WorldWithAntarctica, FusionTheme);
ReactFC.fcRoot(FusionCharts, FusionMaps, Europe, FusionTheme);
ReactFC.fcRoot(FusionCharts, FusionMaps, NorthAmerica, FusionTheme);
ReactFC.fcRoot(FusionCharts, FusionMaps, SouthAmerica, FusionTheme);
ReactFC.fcRoot(FusionCharts, FusionMaps, Asia, FusionTheme);
ReactFC.fcRoot(FusionCharts, FusionMaps, Oceania, FusionTheme);
ReactFC.fcRoot(FusionCharts, FusionMaps, Africa, FusionTheme);

//STEP 2 - Define the dataset and the colorRange of the map
export const dataSetForWorld = [
  {
    id: "NA",
    value: ".82",
  },
  {
    id: "SA",
    value: "2.04",
  },
  {
    id: "AS",
    value: "1.78",
  },
  {
    id: "EU",
    value: ".40",
  },
  {
    id: "AF",
    value: "2.58",
  },
  {
    id: "AU",
    value: "1.30",
  },
];

export const dataSetForWorldWithAntarctica = [
  {
    id: "NA",
    value: ".82",
  },
  {
    id: "SA",
    value: "2.04",
  },
  {
    id: "AS",
    value: "1.78",
  },
  {
    id: "EU",
    value: ".40",
  },
  {
    id: "AF",
    value: "2.58",
  },
  {
    id: "AU",
    value: "1.30",
  },
  {
    id: "AT",
    value: "1",
  },
];

export const dataSetForEurope = [
  {
    id: "001",
    value: ".82",
  },
  {
    id: "002",
    value: "2.04",
  },
  {
    id: "003",
    value: "1.78",
  },
  {
    id: "004",
    value: ".40",
  },
  {
    id: "005",
    value: "2.58",
  },
  {
    id: "006",
    value: "1.30",
  },
  {
    id: "007",
    value: ".82",
  },
  {
    id: "008",
    value: "2.04",
  },
  {
    id: "009",
    value: "1.78",
  },
  {
    id: "010",
    value: ".40",
  },
  {
    id: "011",
    value: "2.58",
  },
  {
    id: "012",
    value: "1.30",
  },
  {
    id: "013",
    value: ".82",
  },
  {
    id: "014",
    value: "2.04",
  },
  {
    id: "015",
    value: "1.78",
  },
  {
    id: "016",
    value: ".40",
  },
  {
    id: "017",
    value: "2.58",
  },
  {
    id: "018",
    value: "1.30",
  },

  {
    id: "019",
    value: ".82",
  },
  {
    id: "020",
    value: "2.04",
  },
  {
    id: "021",
    value: "1.78",
  },
  {
    id: "022",
    value: ".40",
  },
  {
    id: "023",
    value: "2.58",
  },
  {
    id: "024",
    value: "1.30",
  },
  {
    id: "025",
    value: ".82",
  },
  {
    id: "026",
    value: "2.04",
  },
  {
    id: "027",
    value: "1.78",
  },
  {
    id: "028",
    value: ".40",
  },
  {
    id: "029",
    value: "2.58",
  },
  {
    id: "030",
    value: "1.30",
  },
  {
    id: "031",
    value: ".82",
  },
  {
    id: "032",
    value: "2.04",
  },
  {
    id: "033",
    value: "1.78",
  },
  {
    id: "034",
    value: ".40",
  },
  {
    id: "035",
    value: "2.58",
  },
  {
    id: "036",
    value: "1.30",
  },
  {
    id: "037",
    value: ".82",
  },
  {
    id: "038",
    value: "2.04",
  },
  {
    id: "039",
    value: "1.78",
  },
  {
    id: "040",
    value: ".40",
  },
  {
    id: "041",
    value: "2.58",
  },
  {
    id: "042",
    value: "1.30",
  },

  {
    id: "043",
    value: ".82",
  },
  {
    id: "044",
    value: "2.04",
  },
  {
    id: "045",
    value: "1.78",
  },
  {
    id: "046",
    value: ".40",
  },
  {
    id: "047",
    value: "2.58",
  },
];

export const dataSetForNorthAmerica = [
  {
    id: "001",
    value: ".82",
  },
  {
    id: "002",
    value: "2.04",
  },
  {
    id: "003",
    value: "1.78",
  },
  {
    id: "004",
    value: ".40",
  },
  {
    id: "005",
    value: "2.58",
  },
  {
    id: "006",
    value: "1.30",
  },
  {
    id: "007",
    value: ".82",
  },
  {
    id: "008",
    value: "2.04",
  },
  {
    id: "009",
    value: "1.78",
  },
  {
    id: "010",
    value: ".40",
  },
  {
    id: "011",
    value: "2.58",
  },
  {
    id: "012",
    value: "1.30",
  },
  {
    id: "013",
    value: ".82",
  },
  {
    id: "014",
    value: "2.04",
  },
  {
    id: "015",
    value: "1.78",
  },
  {
    id: "016",
    value: ".40",
  },
  {
    id: "017",
    value: "2.58",
  },
  {
    id: "018",
    value: "1.30",
  },

  {
    id: "019",
    value: ".82",
  },
  {
    id: "020",
    value: "2.04",
  },
  {
    id: "021",
    value: "1.78",
  },
  {
    id: "022",
    value: ".40",
  },
  {
    id: "023",
    value: "2.58",
  },
];

export const dataSetForSouthAmerica = [
  {
    id: "001",
    value: ".82",
  },
  {
    id: "002",
    value: "2.04",
  },
  {
    id: "003",
    value: "1.78",
  },
  {
    id: "004",
    value: ".40",
  },
  {
    id: "005",
    value: "2.58",
  },
  {
    id: "006",
    value: "1.30",
  },
  {
    id: "007",
    value: ".82",
  },
  {
    id: "008",
    value: "2.04",
  },
  {
    id: "009",
    value: "1.78",
  },
  {
    id: "010",
    value: ".40",
  },
  {
    id: "011",
    value: "2.58",
  },
  {
    id: "012",
    value: "1.30",
  },
  {
    id: "013",
    value: ".82",
  },
];

export const dataSetForAsia = [
  {
    id: "001",
    value: ".82",
  },
  {
    id: "002",
    value: "2.04",
  },
  {
    id: "003",
    value: "1.78",
  },
  {
    id: "004",
    value: ".40",
  },
  {
    id: "005",
    value: "2.58",
  },
  {
    id: "006",
    value: "1.30",
  },
  {
    id: "007",
    value: ".82",
  },
  {
    id: "008",
    value: "2.04",
  },
  {
    id: "009",
    value: "1.78",
  },
  {
    id: "010",
    value: ".40",
  },
  {
    id: "011",
    value: "2.58",
  },
  {
    id: "012",
    value: "1.30",
  },
  {
    id: "013",
    value: ".82",
  },
  {
    id: "014",
    value: "2.04",
  },
  {
    id: "015",
    value: "1.78",
  },
  {
    id: "016",
    value: ".40",
  },
  {
    id: "017",
    value: "2.58",
  },
  {
    id: "018",
    value: "1.30",
  },

  {
    id: "019",
    value: ".82",
  },
  {
    id: "020",
    value: "2.04",
  },
  {
    id: "021",
    value: "1.78",
  },
  {
    id: "022",
    value: ".40",
  },
  {
    id: "023",
    value: "2.58",
  },
  {
    id: "024",
    value: "1.30",
  },
  {
    id: "025",
    value: ".82",
  },
  {
    id: "026",
    value: "2.04",
  },
  {
    id: "027",
    value: "1.78",
  },
  {
    id: "028",
    value: ".40",
  },
  {
    id: "029",
    value: "2.58",
  },
  {
    id: "030",
    value: "1.30",
  },
  {
    id: "031",
    value: ".82",
  },
  {
    id: "032",
    value: "2.04",
  },
  {
    id: "033",
    value: "1.78",
  },
  {
    id: "034",
    value: ".40",
  },
  {
    id: "035",
    value: "2.58",
  },
  {
    id: "036",
    value: "1.30",
  },
  {
    id: "037",
    value: ".82",
  },
  {
    id: "038",
    value: "2.04",
  },
  {
    id: "039",
    value: "1.78",
  },
  {
    id: "040",
    value: ".40",
  },
  {
    id: "041",
    value: "2.58",
  },
  {
    id: "042",
    value: "1.30",
  },

  {
    id: "043",
    value: ".82",
  },
  {
    id: "044",
    value: "2.04",
  },
  {
    id: "045",
    value: "1.78",
  },
  {
    id: "046",
    value: ".40",
  },
  {
    id: "047",
    value: "2.58",
  },
  {
    id: "048",
    value: ".82",
  },
  {
    id: "049",
    value: "2.04",
  },
  {
    id: "050",
    value: "1.78",
  },
  {
    id: "051",
    value: ".40",
  },
  {
    id: "052",
    value: "2.58",
  },
  {
    id: "053",
    value: "1.30",
  },
  {
    id: "054",
    value: ".82",
  },
  {
    id: "055",
    value: "2.04",
  },
  {
    id: "056",
    value: "1.78",
  },
  {
    id: "057",
    value: ".40",
  },
  {
    id: "058",
    value: "2.58",
  },
  {
    id: "059",
    value: "1.30",
  },
  {
    id: "060",
    value: ".82",
  },
  {
    id: "061",
    value: "2.04",
  },
  {
    id: "062",
    value: "1.78",
  },
  {
    id: "063",
    value: ".40",
  },
  {
    id: "064",
    value: "2.58",
  },
];

export const dataSetForOceania = [
  {
    id: "001",
    value: ".82",
  },
  {
    id: "002",
    value: "2.04",
  },
  {
    id: "003",
    value: "1.78",
  },
  {
    id: "004",
    value: ".40",
  },
  {
    id: "005",
    value: "2.58",
  },
  {
    id: "006",
    value: "1.30",
  },
  {
    id: "007",
    value: ".82",
  },
  {
    id: "008",
    value: "2.04",
  },
  {
    id: "009",
    value: "1.78",
  },
  {
    id: "010",
    value: ".40",
  },
  {
    id: "011",
    value: "2.58",
  },
  {
    id: "012",
    value: "1.30",
  },
  {
    id: "013",
    value: ".82",
  },
  {
    id: "014",
    value: "2.04",
  },
];

export const dataSetForAfrica = [
  {
    id: "001",
    value: ".82",
  },
  {
    id: "002",
    value: "2.04",
  },
  {
    id: "003",
    value: "1.78",
  },
  {
    id: "004",
    value: ".40",
  },
  {
    id: "005",
    value: "2.58",
  },
  {
    id: "006",
    value: "1.30",
  },
  {
    id: "007",
    value: ".82",
  },
  {
    id: "008",
    value: "2.04",
  },
  {
    id: "009",
    value: "1.78",
  },
  {
    id: "010",
    value: ".40",
  },
  {
    id: "011",
    value: "2.58",
  },
  {
    id: "012",
    value: "1.30",
  },
  {
    id: "013",
    value: ".82",
  },
  {
    id: "014",
    value: "2.04",
  },
  {
    id: "015",
    value: "1.78",
  },
  {
    id: "016",
    value: ".40",
  },
  {
    id: "017",
    value: "2.58",
  },
  {
    id: "018",
    value: "1.30",
  },

  {
    id: "019",
    value: ".82",
  },
  {
    id: "020",
    value: "2.04",
  },
  {
    id: "021",
    value: "1.78",
  },
  {
    id: "022",
    value: ".40",
  },
  {
    id: "023",
    value: "2.58",
  },
  {
    id: "024",
    value: "1.30",
  },
  {
    id: "025",
    value: ".82",
  },
  {
    id: "026",
    value: "2.04",
  },
  {
    id: "027",
    value: "1.78",
  },
  {
    id: "028",
    value: ".40",
  },
  {
    id: "029",
    value: "2.58",
  },
  {
    id: "030",
    value: "1.30",
  },
  {
    id: "031",
    value: ".82",
  },
  {
    id: "032",
    value: "2.04",
  },
  {
    id: "033",
    value: "1.78",
  },
  {
    id: "034",
    value: ".40",
  },
  {
    id: "035",
    value: "2.58",
  },
  {
    id: "036",
    value: "1.30",
  },
  {
    id: "037",
    value: ".82",
  },
  {
    id: "038",
    value: "2.04",
  },
  {
    id: "039",
    value: "1.78",
  },
  {
    id: "040",
    value: ".40",
  },
  {
    id: "041",
    value: "2.58",
  },
  {
    id: "042",
    value: "1.30",
  },

  {
    id: "043",
    value: ".82",
  },
  {
    id: "044",
    value: "2.04",
  },
  {
    id: "045",
    value: "1.78",
  },
  {
    id: "046",
    value: ".40",
  },
  {
    id: "047",
    value: "2.58",
  },
  {
    id: "048",
    value: ".82",
  },
  {
    id: "049",
    value: "2.04",
  },
  {
    id: "050",
    value: "1.78",
  },
  {
    id: "051",
    value: ".40",
  },
  {
    id: "052",
    value: "2.58",
  },
  {
    id: "053",
    value: "1.30",
  },
  {
    id: "054",
    value: ".82",
  },
  {
    id: "055",
    value: "2.04",
  },
  {
    id: "056",
    value: "1.78",
  },
  {
    id: "057",
    value: ".40",
  },
  {
    id: "058",
    value: "2.58",
  },
  {
    id: "059",
    value: "1.30",
  },
  {
    id: "060",
    value: ".82",
  },
];

const colorrange = {
  minvalue: "0",
  code: "#FFE0B2",
  gradient: "0",
  color: [
    {
      minvalue: "0.5",
      maxvalue: "1.0",
      color: "#FFD74D",
    },
    {
      minvalue: "1.0",
      maxvalue: "2.0",
      color: "#FB8C00",
    },
    {
      minvalue: "2.0",
      maxvalue: "3.0",
      color: "#E65100",
    },
  ],
};

// STEP 3 - Creating the JSON object to store the chart configurations
const defaultChartConfigs: ChartObject = {
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
      theme: "fusion",
    },
    // Aesthetics; ranges synced with the slider
    colorrange: colorrange,
    // Source data as JSON --> id represents countries of the world.
    data: dataSetForWorld,
  },
  events: {},
};

const MapChartContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;

export interface MapData {
  value?: string;
  displayValue?: string;
  toolText?: string;
  color?: string;
  alpha?: number;
  link?: string;
  font?: string;
  fontSize?: string;
  fontColor?: string;
  fontBold?: boolean;
  showLabel?: boolean;
  showToolTip?: boolean;
  labelConnectorColor?: string;
  labelConnectorAlpha?: number;
  useHoverColor?: boolean;
}

export enum MapTypes {
  WORLD = "WORLD",
  WORLD_WITH_ANTARCTICA = "WORLD_WITH_ANTARCTICA",
  EUROPE = "EUROPE",
  NORTH_AMERICA = "NORTH_AMERICA",
  SOURTH_AMERICA = "SOURTH_AMERICA",
  ASIA = "ASIA",
  OCEANIA = "OCEANIA",
  AFRICA = "AFRICA",
  CUSTOM = "CUSTOM",
}

export type MapType = keyof typeof MapTypes;

export interface MapChartComponentProps {
  caption: string;
  data: MapData[];
  height: number;
  isVisible: boolean;
  onEntityClick: () => void;
  showLabels: boolean;
  type: MapType;
  width: number;
}

function MapChartComponent(props: MapChartComponentProps) {
  const {
    caption,
    data,
    height,
    onEntityClick,
    showLabels,
    type,
    width,
  } = props;

  const [chartConfigs, setChartConfigs] = useState(defaultChartConfigs);
  // const [chart, setChart] = useState(new FusionCharts(defaultChartConfigs));

  useEffect(() => {
    // Attach event handlers
    const newChartConfigs: any = { ...chartConfigs };
    newChartConfigs["events"]["entityClick"] = (
      evt: FusionCharts.EventObject,
      data: any,
    ) => {
      console.log(evt);
      console.log(data);
      onEntityClick();
    };
  }, []);

  useEffect(() => {
    const newChartConfigs = {
      ...chartConfigs,
    };

    switch (type) {
      case MapTypes.WORLD_WITH_ANTARCTICA:
        newChartConfigs.type = "maps/worldwithantarctica";
        break;
      case MapTypes.EUROPE:
        newChartConfigs.type = "maps/europe";
        break;
      case MapTypes.NORTH_AMERICA:
        newChartConfigs.type = "maps/northamerica";
        break;
      case MapTypes.SOURTH_AMERICA:
        newChartConfigs.type = "maps/southamerica";
        break;
      case MapTypes.ASIA:
        newChartConfigs.type = "maps/asia";
        break;
      case MapTypes.OCEANIA:
        newChartConfigs.type = "maps/oceania";
        break;
      case MapTypes.AFRICA:
        newChartConfigs.type = "maps/africa";
        break;

      default:
        newChartConfigs.type = "maps/world";
        break;
    }

    setChartConfigs({
      ...newChartConfigs,
      dataSource: {
        ...(newChartConfigs.dataSource || {}),
        data,
      },
    });
  }, [data, type]);

  useEffect(() => {
    const newHeight = height - WIDGET_PADDING * 2;
    const newWidth = width - WIDGET_PADDING * 2;
    // chart.resizeTo(newWidth, newHeight);

    const newChartConfigs = {
      ...chartConfigs,
      height: newHeight,
      width: newWidth,
    };
    setChartConfigs(newChartConfigs);
  }, [height, width]);

  useEffect(() => {
    // chart.setChartAttribute("caption", caption);
    const newChartConfigs: any = {
      ...chartConfigs,
    };
    newChartConfigs["dataSource"]["chart"]["caption"] = caption;
    setChartConfigs(newChartConfigs);
  }, [caption]);

  useEffect(() => {
    const targetValue = showLabels ? "1" : "0";
    // chart.setChartAttribute("showLabels", targetValue);

    const newChartConfigs: any = {
      ...chartConfigs,
    };
    newChartConfigs["dataSource"]["chart"]["showLabels"] = targetValue;
    setChartConfigs(newChartConfigs);
  }, [showLabels]);

  // Called by FC-React component to return the rendered chart
  const renderComplete = (chart: FusionCharts.FusionCharts) => {
    console.log(chart);
    // setChart(chart);
  };

  return (
    <MapChartContainer>
      <ReactFC {...chartConfigs} onRender={renderComplete} />
    </MapChartContainer>
  );
}

export default MapChartComponent;
