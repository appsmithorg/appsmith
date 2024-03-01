import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";

import type { LayoutElementPositions } from "layoutSystems/common/types";
import type {
  AnvilHighlightInfo,
  DraggedWidget,
  HighlightPayload,
} from "../utils/anvilTypes";

export enum AnvilDraggedWidgetTypesEnum {
  SECTION = "SECTION",
  ZONE = "ZONE",
  WIDGETS = "WIDGETS",
}
export enum AnvilDropTargetTypesEnum {
  MAIN_CANVAS = "MAIN_CANVAS",
  SECTION = "SECTION",
  ZONE = "ZONE",
  PRESET = "PRESET",
}
export type AnvilDropTargetType = keyof typeof AnvilDropTargetTypesEnum;
export type AnvilDraggedWidgetTypes = keyof typeof AnvilDraggedWidgetTypesEnum;
export interface AnvilDragMeta {
  draggedOn: AnvilDropTargetType;
  draggedWidgetTypes: AnvilDraggedWidgetTypesEnum;
}

export interface AnvilDnDStates {
  activateOverlayWidgetDrop: boolean;
  allowToDrop: boolean;
  draggedBlocks: DraggedWidget[];
  dragDetails: DragDetails;
  isCurrentDraggedCanvas: boolean;
  isDragging: boolean;
  isNewWidget: boolean;
  layoutElementPositions: LayoutElementPositions;
  dragMeta: AnvilDragMeta;
  mainCanvasLayoutId: string;
}

export interface AnvilHighlightingCanvasProps {
  anvilDragStates: AnvilDnDStates;
  layoutId: string;
  deriveAllHighlightsFn: (
    layoutElementPositions: LayoutElementPositions,
    draggedWidgets: DraggedWidget[],
  ) => HighlightPayload;
  onDrop: (renderedBlock: AnvilHighlightInfo) => void;
}
