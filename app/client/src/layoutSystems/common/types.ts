/*
  Hols the position of a widget in pixels from the top left of the MainContainer
*/
export interface WidgetPosition {
  left: number;
  top: number;
  height: number;
  width: number;
}

export interface WidgetPositions {
  [widgetId: string]: WidgetPosition;
}
