export enum AnnotationSelectorTypes {
  RECTANGLE = "RECTANGLE",
  POINT = "POINT",
  OVAL = "OVAL",
}

export type AnnotationSelector = keyof typeof AnnotationSelectorTypes;

export enum SelectionMode {
  New = "NEW",
  Selecting = "SELECTING",
  Editing = "EDITING",
  Final = "FINAL",
}

export interface AnnotationObject {
  shape: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
}
