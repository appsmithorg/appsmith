import { SupportedLayouts } from "reducers/entityReducers/pageListReducer";

export enum WidgetTypes {
  BUTTON_WIDGET = "BUTTON_WIDGET",
  TEXT_WIDGET = "TEXT_WIDGET",
  IMAGE_WIDGET = "IMAGE_WIDGET",
  INPUT_WIDGET = "INPUT_WIDGET",
  CONTAINER_WIDGET = "CONTAINER_WIDGET",
  DATE_PICKER_WIDGET = "DATE_PICKER_WIDGET",
  DATE_PICKER_WIDGET2 = "DATE_PICKER_WIDGET2",
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
  VIDEO_WIDGET = "VIDEO_WIDGET",
  SKELETON_WIDGET = "SKELETON_WIDGET",
  LIST_WIDGET = "LIST_WIDGET",
  SWITCH_WIDGET = "SWITCH_WIDGET",
  TABS_MIGRATOR_WIDGET = "TABS_MIGRATOR_WIDGET",
  IFRAME_WIDGET = "IFRAME_WIDGET",
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

interface LayoutConfig {
  minWidth: number;
  maxWidth: number;
}

type LayoutConfigurations = Record<SupportedLayouts, LayoutConfig>;
export const DefaultLayoutType: SupportedLayouts = "DESKTOP";
export const layoutConfigurations: LayoutConfigurations = {
  TABLET_LARGE: {
    minWidth: 960,
    maxWidth: 1080,
  },
  MOBILE: {
    minWidth: 350,
    maxWidth: 450,
  },
  DESKTOP: { minWidth: 1160, maxWidth: 1280 },
  TABLET: { minWidth: 650, maxWidth: 800 },
  FLUID: { minWidth: -1, maxWidth: -1 },
};

export const LATEST_PAGE_VERSION = 26;

export const GridDefaults = {
  DEFAULT_CELL_SIZE: 1,
  DEFAULT_WIDGET_WIDTH: 200,
  DEFAULT_WIDGET_HEIGHT: 100,
  DEFAULT_GRID_COLUMNS: 64,
  DEFAULT_GRID_ROW_HEIGHT: 10,
  CANVAS_EXTENSION_OFFSET: 2,
};

// Note: Widget Padding + Container Padding === DEFAULT_GRID_ROW_HEIGHT to gracefully lose one row when a container is used,
// which wud allow the user to place elements centered inside a container(columns are rendered proportionaly so it take cares of itselves).

export const CONTAINER_GRID_PADDING =
  GridDefaults.DEFAULT_GRID_ROW_HEIGHT * 0.6;

export const WIDGET_PADDING = GridDefaults.DEFAULT_GRID_ROW_HEIGHT * 0.4;

export const WIDGET_CLASSNAME_PREFIX = "WIDGET_";
export const MAIN_CONTAINER_WIDGET_ID = "0";
export const MAIN_CONTAINER_WIDGET_NAME = "MainContainer";

export const WIDGET_DELETE_UNDO_TIMEOUT = 7000;

export const DEFAULT_CENTER = { lat: -34.397, lng: 150.644 };

export enum FontStyleTypes {
  BOLD = "BOLD",
  ITALIC = "ITALIC",
  REGULAR = "REGULAR",
  UNDERLINE = "UNDERLINE",
}

export enum TextSizes {
  HEADING1 = "HEADING1",
  HEADING2 = "HEADING2",
  HEADING3 = "HEADING3",
  PARAGRAPH = "PARAGRAPH",
  PARAGRAPH2 = "PARAGRAPH2",
}

export const TEXT_SIZES = {
  HEADING1: "24px",
  HEADING2: "18px",
  HEADING3: "16px",
  PARAGRAPH: "14px",
  PARAGRAPH2: "12px",
};

export type TextSize = keyof typeof TextSizes;
