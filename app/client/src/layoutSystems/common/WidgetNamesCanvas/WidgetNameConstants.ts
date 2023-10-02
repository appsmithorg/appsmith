import { Colors } from "constants/Colors";
import type { CSSProperties } from "react";

export const WIDGET_NAME_CANVAS = "widget-name-canvas";
export const WIDGET_NAME_FONT_SIZE = 14;
export const WIDGET_NAME_LINE_HEIGHT = Math.floor(WIDGET_NAME_FONT_SIZE * 1.2);
export const WIDGET_NAME_VERTICAL_PADDING = 4;
export const WIDGET_NAME_HORIZONTAL_PADDING = 6;
export const WIDGET_NAME_ICON_PADDING = 16;

export const DEFAULT_WIDGET_NAME_CANVAS_HEIGHT = 600;
export const WIDGET_NAME_CANVAS_PADDING = 20;

export const WIDGET_NAME_HEIGHT = Math.floor(
  WIDGET_NAME_LINE_HEIGHT + WIDGET_NAME_VERTICAL_PADDING * 1.5,
);

export const WIDGET_NAME_TEXT_COLOR = Colors.WHITE;

//Adding this here as Konva accepts this type of path for SVG
export const warningSVGPath =
  "M 18 9 C 18 13.9706 13.9706 18 9 18 C 4.0294 18 0 13.9706 0 9 C 0 4.0294 4.0294 0 9 0 C 13.9706 0 18 4.0294 18 9 Z M 7.875 3.9375 V 10.125 H 10.125 V 3.9375 H 7.875 Z M 9 14.0625 C 9.6213 14.0625 10.125 13.5588 10.125 12.9375 C 10.125 12.3162 9.6213 11.8125 9 11.8125 C 8.3787 11.8125 7.875 12.3162 7.875 12.9375 C 7.875 13.5588 8.3787 14.0625 9 14.0625 Z";

//Indicates the state of widget name
export enum WidgetNameState {
  SELECTED = "SELECTED",
  ERROR = "ERROR",
  FOCUSED = "FOCUSED",
}

//fill colors of widget name based on state
export const WIDGET_NAME_FILL_COLORS = {
  [WidgetNameState.SELECTED]: Colors.JAFFA_DARK,
  [WidgetNameState.FOCUSED]: Colors.WATUSI,
  [WidgetNameState.ERROR]: Colors.DANGER_SOLID,
};

//CSS properties of the wrapper object of the html canvas
export const widgetNameWrapperStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  zIndex: 2,
  pointerEvents: "none",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  width: "100%",
  height: "100%",
};
