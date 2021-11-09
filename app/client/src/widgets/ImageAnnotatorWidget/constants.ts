export enum AnnotationSelectorTypes {
  RECTANGLE = "RECTANGLE",
  POINT = "POINT",
  OVAL = "OVAL",
}

export type AnnotationSelector = keyof typeof AnnotationSelectorTypes;
