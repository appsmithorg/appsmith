import type { AppState } from "@appsmith/reducers";
import type { LayoutProps } from "../utils/anvilTypes";

// ToDo: This is a placeholder implementation this is bound to change
export function getDropTargetLayoutId(state: AppState, canvasId: string) {
  const layout: LayoutProps[] = state.entities.canvasWidgets[canvasId].layout;
  return layout[0].layoutId;
}
