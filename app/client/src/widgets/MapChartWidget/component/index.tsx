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

// Import the dataset and the colorRange of the map
import { colorRange, dataSetForWorld, MapTypes } from "../constants";

// Adding the chart and theme as dependency to the core fusioncharts
ReactFC.fcRoot(FusionCharts, FusionMaps, World, FusionTheme);
ReactFC.fcRoot(FusionCharts, FusionMaps, WorldWithAntarctica, FusionTheme);
ReactFC.fcRoot(FusionCharts, FusionMaps, Europe, FusionTheme);
ReactFC.fcRoot(FusionCharts, FusionMaps, NorthAmerica, FusionTheme);
ReactFC.fcRoot(FusionCharts, FusionMaps, SouthAmerica, FusionTheme);
ReactFC.fcRoot(FusionCharts, FusionMaps, Asia, FusionTheme);
ReactFC.fcRoot(FusionCharts, FusionMaps, Oceania, FusionTheme);
ReactFC.fcRoot(FusionCharts, FusionMaps, Africa, FusionTheme);

// Creating the JSON object to store the chart configurations
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
    colorrange: colorRange,
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

export type MapType = keyof typeof MapTypes;

export interface EntityData {
  id: string;
  label: string;
  originalId: string;
  shortLabel: string;
  value: number;
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
  const [chart, setChart] = useState(new FusionCharts(defaultChartConfigs));

  useEffect(() => {
    // Attach event handlers
    const newChartConfigs: any = { ...chartConfigs };
    newChartConfigs["events"]["entityClick"] = entityClick;

    return () => {
      chart.removeEventListener("entityClick", entityClick);
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

    const newChartConfigs = {
      ...chartConfigs,
      height: newHeight,
      width: newWidth,
    };
    setChartConfigs(newChartConfigs);
  }, [height, width]);

  useEffect(() => {
    const newChartConfigs: any = {
      ...chartConfigs,
    };
    newChartConfigs["dataSource"]["chart"]["caption"] = caption;
    setChartConfigs(newChartConfigs);
  }, [caption]);

  useEffect(() => {
    const targetValue = showLabels ? "1" : "0";

    const newChartConfigs: any = {
      ...chartConfigs,
    };
    newChartConfigs["dataSource"]["chart"]["showLabels"] = targetValue;
    setChartConfigs(newChartConfigs);
  }, [showLabels]);

  // Called by FC-React component to return the rendered chart
  const renderComplete = (chart: FusionCharts.FusionCharts) => {
    setChart(chart);
  };

  const entityClick = (eventObj: any) => {
    onEntityClick(eventObj.data);
  };

  return (
    <MapChartContainer>
      <ReactFC {...chartConfigs} onRender={renderComplete} />
    </MapChartContainer>
  );
}

export interface MapChartComponentProps {
  caption: string;
  data: MapData[];
  height: number;
  isVisible: boolean;
  onEntityClick: (data: EntityData) => void;
  showLabels: boolean;
  type: MapType;
  width: number;
}

export default MapChartComponent;
