import React, { useEffect, useState } from "react";
import styled from "styled-components";
// Include the react-fusioncharts component
import ReactFC from "react-fusioncharts";
// Include the fusioncharts library
import type { ChartObject } from "fusioncharts";
import FusionCharts from "fusioncharts";

// Import FusionMaps
import FusionMaps from "fusioncharts/fusioncharts.maps";
import World from "fusioncharts/maps/fusioncharts.world";
import USA from "fusioncharts/maps/fusioncharts.usa";

// Include the theme as fusion
import FusionTheme from "fusioncharts/themes/fusioncharts.theme.fusion";

// Import the dataset and the colorRange of the map
import type { MapColorObject } from "../constants";
import { dataSetForWorld, MapTypes } from "../constants";
import { CUSTOM_MAP_PLUGINS } from "../CustomMapConstants";
import { Colors } from "constants/Colors";

// Adding the chart and theme as dependency to the core fusioncharts
ReactFC.fcRoot(FusionCharts, FusionMaps, World, FusionTheme, USA);

const MapChartContainer = styled.div<{
  borderRadius?: string;
  boxShadow?: string;
}>`
  display: flex;
  height: 100%;
  width: 100%;
  background: white;
  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${({ boxShadow }) => `${boxShadow}`};
  overflow: hidden;

  & > div {
    width: 100%;
  }
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
  const { caption, colorRange, data, onDataPointClick, showLabels, type } =
    props;

  const fontFamily =
    props.fontFamily === "System Default" ? "inherit" : props.fontFamily;

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
        includevalueinlabels: "1",
        labelsepchar: ": ",
        entityFillHoverColor: "#FFF9C4",
        theme: "fusion",

        // Caption
        captionFontSize: "24",
        captionAlignment: "center",
        captionPadding: "20",
        captionFontColor: Colors.THUNDER,
        captionFontBold: "1",

        // Legend
        legendIconSides: "4",
        legendIconBgAlpha: "100",
        legendIconAlpha: "100",
        legendItemFont: fontFamily,
        legendPosition: "top",
        valueFont: fontFamily,

        // Spacing
        chartLeftMargin: "10",
        chartTopMargin: "15",
        chartRightMargin: "10",
        chartBottomMargin: "10",

        // Base Styling
        baseFont: fontFamily,
        bgColor: Colors.WHITE,
      },
      // Aesthetics; ranges synced with the slider
      colorRange: {
        gradient: "0",
      },
      // Source data as JSON --> id represents countries of the world.
      data: dataSetForWorld,
    },
    events: {},
  };

  const [chartConfigs, setChartConfigs] = useState(defaultChartConfigs);
  const [chart, setChart] = useState(new FusionCharts(defaultChartConfigs));

  useEffect(() => {
    // Attach event handlers
    const newChartConfigs: any = {
      ...chartConfigs,
    };
    newChartConfigs["events"]["entityClick"] = onDataPointClick;
    setChartConfigs(newChartConfigs);

    return () => {
      chart.removeEventListener("entityClick", onDataPointClick);
    };
  }, [onDataPointClick]);

  useEffect(() => {
    const newChartConfigs: any = {
      ...chartConfigs,
    };
    const fontFamily =
      props.fontFamily === "System Default" ? "inherit" : props.fontFamily;

    newChartConfigs["dataSource"]["chart"]["legendItemFont"] = fontFamily;
    newChartConfigs["dataSource"]["chart"]["valueFont"] = fontFamily;
    newChartConfigs["dataSource"]["chart"]["baseFont"] = fontFamily;

    setChartConfigs(newChartConfigs);
  }, [props.fontFamily]);

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

  useEffect(() => {
    const newChartConfigs: any = {
      ...chartConfigs,
    };
    newChartConfigs["dataSource"]["colorRange"]["color"] = colorRange;
    chart.setChartData(newChartConfigs.dataSource, "json");
  }, [JSON.stringify(colorRange)]);

  useEffect(() => {
    const newChartConfigs = {
      ...chartConfigs,
      dataSource: {
        ...(chartConfigs.dataSource || {}),
        data,
      },
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
      case MapTypes.USA:
        newChartConfigs.type = "maps/usa";
        break;

      default:
        newChartConfigs.type = "maps/world";
        break;
    }

    if (type === MapTypes.WORLD) {
      setChartConfigs(newChartConfigs);
      return;
    }

    initializeMap(newChartConfigs);
  }, [JSON.stringify(data), type]);

  // Called by FC-React component to return the rendered chart
  const renderComplete = (chart: FusionCharts.FusionCharts) => {
    setChart(chart);
  };

  const initializeMap = (configs: ChartObject) => {
    const { type: mapType } = configs;
    if (mapType) {
      const alias = mapType.substring(5);
      const mapDefinition = CUSTOM_MAP_PLUGINS[alias];
      ReactFC.fcRoot(FusionCharts, FusionMaps, mapDefinition, FusionTheme);
      setChartConfigs(configs);
    }
  };

  return (
    <MapChartContainer
      borderRadius={props.borderRadius}
      boxShadow={props.boxShadow}
    >
      <ReactFC {...chartConfigs} onRender={renderComplete} />
    </MapChartContainer>
  );
}

export interface MapChartComponentProps {
  caption: string;
  colorRange: MapColorObject[];
  data: MapData[];
  isVisible: boolean;
  onDataPointClick: (evt: any) => void;
  showLabels: boolean;
  type: MapType;
  borderRadius?: string;
  boxShadow?: string;
  fontFamily?: string;
}

export default MapChartComponent;
