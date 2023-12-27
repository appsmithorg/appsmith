/*
  Holds the position of a layout system elements (widgets, layers, layouts, etc) in pixels from the top left of the MainContainer
*/
export interface LayoutElementPosition {
  left: number;
  top: number;
  height: number;
  width: number;
  offsetLeft: number;
  offsetTop: number;
}

export interface LayoutElementPositions {
  [widgetId: string]: LayoutElementPosition;
}
