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
