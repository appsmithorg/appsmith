export type WidgetType =
  | "TEXT_WIDGET"
  | "IMAGE_WIDGET"
  | "CONTAINER_WIDGET"
  | "SPINNER_WIDGET"
  | "BUTTON_WIDGET"
  | "DATE_PICKER_WIDGET"
  | "TABLE_WIDGET"
  | "DROP_DOWN_WIDGET"
  | "CHECKBOX_WIDGET"
  | "RADIO_GROUP_WIDGET"
  | "INPUT_WIDGET"
  | "SWITCH_WIDGET";

export const WidgetTypes: { [id: string]: WidgetType } = {
  BUTTON_WIDGET: "BUTTON_WIDGET",
  TEXT_WIDGET: "TEXT_WIDGET",
  IMAGE_WIDGET: "IMAGE_WIDGET",
  INPUT_WIDGET: "INPUT_WIDGET",
  SWITCH_WIDGET: "SWITCH_WIDGET",
  CONTAINER_WIDGET: "CONTAINER_WIDGET",
  SPINNER_WIDGET: "SPINNER_WIDGET",
  DATE_PICKER_WIDGET: "DATE_PICKER_WIDGET",
  TABLE_WIDGET: "TABLE_WIDGET",
  DROP_DOWN_WIDGET: "DROP_DOWN_WIDGET",
  CHECKBOX_WIDGET: "CHECKBOX_WIDGET",
  RADIO_GROUP_WIDGET: "RADIO_GROUP_WIDGET",
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

export const GridDefaults = {
  DEFAULT_CELL_SIZE: 1,
  DEFAULT_WIDGET_WIDTH: 200,
  DEFAULT_WIDGET_HEIGHT: 100,
  DEFAULT_GRID_COLUMNS: 16,
  DEFAULT_GRID_ROWS: 32,
  DEFAULT_GRID_ROW_HEIGHT: 40,
};
