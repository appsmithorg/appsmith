import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import type { MapColorObject, MapTypes } from "../constants";
import type { MapData } from "./types";
import { getChartOption, loadMapGenerator } from "./utilities";
import * as echarts from "echarts";
import countryDetails from "./countryDetails";
import clsx from "clsx";

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

export default function EchartComponent(props: MapChartComponentProps) {
  const [isLoading, setIsLoading] = useState(false);

  const loadMap = useMemo(loadMapGenerator, []);

  const [key, setKey] = useState(0);

  const { caption, colorRange, data, onDataPointClick, showLabels, type } =
    props;

  const fontFamily =
    props.fontFamily === "System Default" ? "" : props.fontFamily;

  const colorRangePieces = useMemo(() => {
    return colorRange.map((color) => {
      const alpha = color.alpha ?? 100;

      return {
        min: color.minValue,
        max: color.maxValue,
        color: color.code,
        colorAlpha: alpha ? alpha / 100 : 0,
        label: color.displayValue,
      };
    });
  }, [colorRange]);

  const transformedData = useMemo(() => {
    return data.map((each) => ({
      name: each.id,
      value: each.value,
    }));
  }, [data]);

  const chartContainer = useRef<HTMLDivElement>(null);

  const chartInstance = useRef<echarts.ECharts | null>();

  useEffect(() => {
    chartInstance.current = echarts.init(
      chartContainer.current,
      {},
      {
        renderer: "svg",
        width: props.width,
        height: props.height,
      },
    );
  }, [chartContainer]);

  useEffect(() => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (event: any) => {
      const id = event.data.name;

      const regionDetail = countryDetails[type][id];

      onDataPointClick({
        value: parseFloat(event.data.value),
        label: regionDetail.label,
        shortLabel: regionDetail.short_label,
        originalId: id,
        id: id.toLowerCase(),
      });
    };

    chartInstance.current?.on("click", "series", handler);

    return () => {
      chartInstance.current?.off("click", handler);
    };
  }, [onDataPointClick, chartInstance.current, type]);

  useEffect(() => {
    setIsLoading(true);

    loadMap(type).then(() => {
      setIsLoading(false);
      // we are using Math.random to force the chart to set options again
      // to avoid the race conditions while loading maps
      setKey(Math.random());
    });
  }, [type]);

  useEffect(() => {
    if (!isLoading && !!echarts.getMap(type)) {
      chartInstance.current?.setOption(
        getChartOption(
          caption,
          showLabels,
          colorRangePieces,
          transformedData,
          type,
          props.height,
          props.width,
          fontFamily,
        ),
        true,
      );
    }
  }, [
    isLoading,
    caption,
    showLabels,
    colorRangePieces,
    transformedData,
    fontFamily,
    chartInstance.current,
    type,
    key,
    props.height,
    props.width,
  ]);

  useEffect(() => {
    chartInstance.current?.resize({
      width: props.width,
      height: props.height,
    });
  }, [props.width, props.height]);

  return (
    <MapChartContainer
      borderRadius={props.borderRadius}
      boxShadow={props.boxShadow}
      className={clsx({
        "bp3-skeleton": isLoading,
      })}
      data-testid="t--map-chart-container"
      onClick={(e) => e.stopPropagation()}
    >
      <div ref={chartContainer} />
    </MapChartContainer>
  );
}

export interface MapChartComponentProps {
  caption: string;
  colorRange: MapColorObject[];
  data: MapData[];
  isVisible: boolean;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDataPointClick: (evt: any) => void;
  showLabels: boolean;
  type: MapTypes;
  borderRadius?: string;
  boxShadow?: string;
  fontFamily?: string;
  height: number;
  width: number;
}
