export type WidgetType =
  | "TEXT_WIDGET"
  | "IMAGE_WIDGET"
  | "CONTAINER_WIDGET"
  | "SPINNER_WIDGET"
  | "BUTTON_WIDGET"
  | "CHECKBOX_WIDGET"
  | "RADIO_BUTTON_WIDGET"
  | "INPUT_WIDGET"
  | "TOGGLE_WIDGET"
  | "CALLOUT_WIDGET"
  | "TABLE_WIDGET"
  | "DATEPICKER_WIDGET"
  | "DROPDOWN_WIDGET"
  | "RICH_TEXT_WIDGET"
  | "MODAL_WIDGET";

export const WidgetTypes: { [id: string]: WidgetType } = {
  BUTTON_WIDGET: "BUTTON_WIDGET",
  TEXT_WIDGET: "TEXT_WIDGET",
  INPUT_WIDGET: "INPUT_WIDGET",
  TOGGLE_WIDGET: "TOGGLE_WIDGET",
};

export type ContainerOrientation = "HORIZONTAL" | "VERTICAL";
export type PositionType = "ABSOLUTE" | "CONTAINER_DIRECTION";
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
  | "%";

export type RenderMode =
  | "COMPONENT_PANE"
  | "CANVAS"
  | "PAGE"
  | "CANVAS_SELECTED";

export const RenderModes: { [id: string]: RenderMode } = {
  COMPONENT_PANE: "COMPONENT_PANE",
  CANVAS: "CANVAS",
  PAGE: "PAGE",
  CANVAS_SELECTED: "CANVAS_SELECTED",
};

export const CSSUnits: { [id: string]: CSSUnit } = {
  PIXEL: "px",
  RELATIVE_FONTSIZE: "rem",
  RELATIVE_PARENT: "%",
};
