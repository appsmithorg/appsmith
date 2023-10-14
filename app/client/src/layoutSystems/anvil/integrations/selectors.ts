import type { AppState } from "@appsmith/reducers";
import type { LayoutProps } from "../utils/anvilTypes";

export function getDropTargetLayoutId(state: AppState, canvasId: string) {
  const layout: LayoutProps[] = state.entities.canvasWidgets[canvasId].layout;
  return layout[0].layoutId;
}
