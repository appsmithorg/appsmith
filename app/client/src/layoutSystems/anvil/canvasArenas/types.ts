export type AnvilDropTargetType = "MAIN_CANVAS" | "SECTION" | "ZONE" | "PRESET";
export type DraggedWidgetTypes = "SECTION" | "ZONE" | "WIDGETS";
export interface AnvilDragMeta {
  draggedOn: AnvilDropTargetType;
  draggedWidgetTypes: DraggedWidgetTypes;
}
