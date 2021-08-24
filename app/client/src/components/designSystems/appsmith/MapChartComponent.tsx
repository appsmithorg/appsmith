import React from "react";
import styled from "styled-components";
// Include the react-fusioncharts component
import ReactFC from "react-fusioncharts";
// Include the fusioncharts library
import FusionCharts from "fusioncharts";

// Import FusionMaps
import FusionMaps from "fusioncharts/fusioncharts.maps";
import World from "fusioncharts/maps/fusioncharts.world";

// Include the theme as fusion
import FusionTheme from "fusioncharts/themes/fusioncharts.theme.fusion";

// Adding the chart and theme as dependency to the core fusioncharts
ReactFC.fcRoot(FusionCharts, FusionMaps, World, FusionTheme);

//STEP 2 - Define the dataset and the colorRange of the map
const dataset = [
  {
    id: "NA",
    value: ".82",
    showLabel: "1",
  },
  {
    id: "SA",
    value: "2.04",
    showLabel: "1",
  },
  {
    id: "AS",
    value: "1.78",
    showLabel: "1",
  },
  {
    id: "EU",
    value: ".40",
    showLabel: "1",
  },
  {
    id: "AF",
    value: "2.58",
    showLabel: "1",
  },
  {
    id: "AU",
    value: "1.30",
    showLabel: "1",
  },
];

const colorrange = {
  minvalue: "0",
  code: "#FFE0B2",
  gradient: "1",
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
const chartConfigs = {
  type: "world", // The chart type
  width: "700", // Width of the chart
  height: "400", // Height of the chart
  dataFormat: "json", // Data type
  dataSource: {
    // Map Configuration
    chart: {
      caption: "Average Annual Population Growth",
      subcaption: " 1955-2015",
      numbersuffix: "%",
      includevalueinlabels: "1",
      labelsepchar: ": ",
      entityFillHoverColor: "#FFF9C4",
      theme: "fusion",
    },
    // Aesthetics; ranges synced with the slider
    colorrange: colorrange,
    // Source data as JSON --> id represents countries of the world.
    data: dataset,
  },
};

const MapChartContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;

export interface MapChartComponentProps {
  isVisible: boolean;
}

class MapChartComponent extends React.Component<MapChartComponentProps> {
  render() {
    return (
      <MapChartContainer>
        <ReactFC {...chartConfigs} />
      </MapChartContainer>
    );
  }
}

export default MapChartComponent;
