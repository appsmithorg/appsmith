import React from "react";
import ReactFC from "react-fusioncharts";
import FusionCharts from "fusioncharts";
import Column2D from "fusioncharts/fusioncharts.charts";
import FusionTheme from "fusioncharts/themes/fusioncharts.theme.fusion";
import { ChartType, ChartData } from "widgets/ChartWidget";
import styled from "styled-components";
import { invisible } from "constants/DefaultTheme";

ReactFC.fcRoot(FusionCharts, Column2D, FusionTheme);

export interface ChartComponentProps {
  chartType: ChartType;
  chartData: ChartData[];
  xAxisName: string;
  yAxisName: string;
  chartName: string;
  componentWidth: number;
  componentHeight: number;
  isVisible?: boolean;
}

const CanvasContainer = styled.div<ChartComponentProps>`
  border: none;
  border-radius: ${props => `${props.theme.radii[1]}px`};
  height: 100%;
  width: 100%;
  background: white;
  box-shadow: 0 1px 1px 0 rgba(60,75,100,.14),0 2px 1px -1px rgba(60,75,100,.12),0 1px 3px 0 rgba(60,75,100,.2);
  position: relative;
  ${props => (!props.isVisible ? invisible : "")};
}`;

/* eslint-disable react/display-name */
const ChartComponent = (props: ChartComponentProps) => {
  const getChartType = (chartType: ChartType) => {
    switch (chartType) {
      case "LINE_CHART":
        return "line";
      case "BAR_CHART":
        return "bar2d";
      case "PIE_CHART":
        return "pie2d";
      case "COLUMN_CHART":
        return "column2d";
      case "AREA_CHART":
        return "area2d";
      default:
        return "column2d";
    }
  };

  const getChartData = (chartData: ChartData[]) => {
    return chartData.map(item => {
      return {
        label: item.x,
        value: item.y,
      };
    });
  };

  return (
    <CanvasContainer {...props}>
      <ReactFC
        type={getChartType(props.chartType)}
        width={props.componentWidth.toString()}
        height={props.componentHeight.toString()}
        dataForma="json"
        dataSource={{
          chart: {
            xAxisName: props.xAxisName,
            yAxisName: props.yAxisName,
            theme: "fusion",
            caption: props.chartName,
          },
          data: getChartData(props.chartData),
        }}
      />
    </CanvasContainer>
  );
};

export default ChartComponent;
