export enum Size {
  SMALL = "small",
  MEDIUM = "medium",
}

export interface JSONViewerProps {
  src: unknown;
  size: Size;
}
