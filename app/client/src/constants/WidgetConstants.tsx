export type WidgetType =
  | "TEXT_WIDGET"
  | "IMAGE_WIDGET"
  | "CONTAINER_WIDGET"
  | "LIST_WIDGET"
  | "CALLOUT_WIDGET"
  | "ICON_WIDGET"
  | "INPUT_GROUP_WIDGET"
  | "SPINNER_WIDGET"
  | "BUTTON_WIDGET"
  | "BREADCRUMBS_WIDGET"
  | "TAG_INPUT_WIDGET"
  | "NUMERIC_INPUT_WIDGET"
  | "CHECKBOX_WIDGET"
  | "RADIO_GROUP_WIDGET"
export type ContainerOrientation = "HORIZONTAL" | "VERTICAL"
export type PositionType = "ABSOLUTE" | "CONTAINER_DIRECTION"
export type CSSUnit =
  | "px"
  | "cm"
  | "mm"
  | "in"
  | "pt"
  | "pc"
  | "em"
  | "ex"
  | "ch"
  | "rem"
  | "vw"
  | "vh"
  | "vmin"
  | "vmax"
  | "%"

export type RenderMode =
  | "COMPONENT_PANE"
  | "CANVAS"
  | "PAGE"
  | "CANVAS_SELECTED"

export const RenderModes: { [id: string]: RenderMode } = {
  COMPONENT_PANE: "COMPONENT_PANE",
  CANVAS: "CANVAS",
  PAGE: "PAGE",
  CANVAS_SELECTED: "CANVAS_SELECTED"
}

export const CSSUnits: { [id: string]: CSSUnit } = {
  PIXEL: "px",
  RELATIVE_FONTSIZE: "em",
  RELATIVE_PARENT: "%"
}
