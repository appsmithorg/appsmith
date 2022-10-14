// This file contains common constants which can be used across the widget configuration file (index.ts), widget and component folders.
export const LEAFLET_WIDGET_CONSTANT = "";
export interface MarkerProps {
  lat: number;
  long: number;
  title?: string;
  description?: string;
  color?: string;
}
export interface CircleProps {
  lat: number;
  long: number;
  radius: number;
  title?: string;
  description?: string;
  options?: CircleOptions;
}
export interface CircleOptions {
  radius: number;
  color?: string;
  fillColor?: string;
}
export interface PolygonProps {
  path: [];
  title?: string;
  description?: string;
  color?: string;
}
