import type { AutoHeightLayoutTreePayload } from "./autoHeightLayoutTreeReducer.types";

export type CanvasLevelsPayload = Record<string, number>;

export interface CanvasLevelsReduxState {
  [widgetId: string]: number;
}
