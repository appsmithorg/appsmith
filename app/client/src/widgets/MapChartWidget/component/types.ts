import type { MapTypes } from "widgets/MapChartWidget/constants";

export interface MapData {
  id: string;
  value: number;
}

export type MapType = keyof typeof MapTypes;
