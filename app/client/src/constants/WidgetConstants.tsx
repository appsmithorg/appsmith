export enum WidgetTypes {
  BUTTON_WIDGET = "BUTTON_WIDGET",
  TEXT_WIDGET = "TEXT_WIDGET",
  IMAGE_WIDGET = "IMAGE_WIDGET",
  INPUT_WIDGET = "INPUT_WIDGET",
  CONTAINER_WIDGET = "CONTAINER_WIDGET",
  DATE_PICKER_WIDGET = "DATE_PICKER_WIDGET",
  TABLE_WIDGET = "TABLE_WIDGET",
  DROP_DOWN_WIDGET = "DROP_DOWN_WIDGET",
  CHECKBOX_WIDGET = "CHECKBOX_WIDGET",
  RADIO_GROUP_WIDGET = "RADIO_GROUP_WIDGET",
  TABS_WIDGET = "TABS_WIDGET",
  MODAL_WIDGET = "MODAL_WIDGET",
  RICH_TEXT_EDITOR_WIDGET = "RICH_TEXT_EDITOR_WIDGET",
  CHART_WIDGET = "CHART_WIDGET",
  FORM_WIDGET = "FORM_WIDGET",
  FORM_BUTTON_WIDGET = "FORM_BUTTON_WIDGET",
  MAP_WIDGET = "MAP_WIDGET",
  CANVAS_WIDGET = "CANVAS_WIDGET",
  ICON_WIDGET = "ICON_WIDGET",
  FILE_PICKER_WIDGET = "FILE_PICKER_WIDGET",
}

export type WidgetType = keyof typeof WidgetTypes;

export type ContainerOrientation = "HORIZONTAL" | "VERTICAL";

export const PositionTypes: { [id: string]: string } = {
  ABSOLUTE: "ABSOLUTE",
  CONTAINER_DIRECTION: "CONTAINER_DIRECTION",
};
export type PositionType = typeof PositionTypes[keyof typeof PositionTypes];

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
  DEFAULT_GRID_ROW_HEIGHT: 40,
  CANVAS_EXTENSION_OFFSET: 2,
};

export const CONTAINER_GRID_PADDING =
  (GridDefaults.DEFAULT_GRID_ROW_HEIGHT / 2) * 0.8;

export const WIDGET_PADDING = (GridDefaults.DEFAULT_GRID_ROW_HEIGHT / 2) * 0.2;

export const WIDGET_CLASSNAME_PREFIX = "WIDGET_";
export const MAIN_CONTAINER_WIDGET_ID = "0";
export const MAIN_CONTAINER_WIDGET_NAME = "MainContainer";
