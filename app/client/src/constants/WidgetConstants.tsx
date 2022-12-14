import { SupportedLayouts } from "reducers/entityReducers/pageListReducer";
import { WidgetType as FactoryWidgetType } from "utils/WidgetFactory";
import { THEMEING_TEXT_SIZES } from "./ThemeConstants";
export type WidgetType = FactoryWidgetType;

export const SKELETON_WIDGET_TYPE = "SKELETON_WIDGET";

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

export interface LayoutConfig {
  minWidth: number;
  maxWidth: number;
}

type LayoutConfigurations = Record<SupportedLayouts, LayoutConfig>;
export const DefaultLayoutType: SupportedLayouts = "FLUID";
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

export const LATEST_PAGE_VERSION = 72;

export const GridDefaults = {
  DEFAULT_CELL_SIZE: 1,
  DEFAULT_WIDGET_WIDTH: 200,
  DEFAULT_WIDGET_HEIGHT: 100,
  DEFAULT_GRID_COLUMNS: 64,
  DEFAULT_GRID_ROW_HEIGHT: 10,
  CANVAS_EXTENSION_OFFSET: 2,
  VIEW_MODE_MAIN_CANVAS_EXTENSION_OFFSET: 5,
  MAIN_CANVAS_EXTENSION_OFFSET: 8,
};

export const CANVAS_MIN_HEIGHT = 380;

// Note: Widget Padding + Container Padding === DEFAULT_GRID_ROW_HEIGHT to gracefully lose one row when a container is used,
// which wud allow the user to place elements centered inside a container(columns are rendered proportionally so it take cares of itself).

export const CONTAINER_GRID_PADDING =
  GridDefaults.DEFAULT_GRID_ROW_HEIGHT * 0.6;

export const WIDGET_PADDING = GridDefaults.DEFAULT_GRID_ROW_HEIGHT * 0.4;

export const WIDGET_CLASSNAME_PREFIX = "WIDGET_";
export const MAIN_CONTAINER_WIDGET_ID = "0";
export const MAIN_CONTAINER_WIDGET_NAME = "MainContainer";
export const MODAL_PORTAL_CLASSNAME = "bp3-modal-widget";
export const MODAL_PORTAL_OVERLAY_CLASSNAME = "bp3-overlay-zindex";
export const CANVAS_SELECTOR = "canvas";

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

export const WIDGET_STATIC_PROPS = {
  leftColumn: true,
  rightColumn: true,
  topRow: true,
  bottomRow: true,
  minHeight: true,
  parentColumnSpace: true,
  parentRowSpace: true,
  children: true,
  type: true,
  widgetId: true,
  widgetName: true,
  parentId: true,
  renderMode: true,
  detachFromLayout: true,
  noContainerOffset: false,
  height: false,
};

export const WIDGET_DSL_STRUCTURE_PROPS = {
  children: true,
  type: true,
  widgetId: true,
  parentId: true,
  topRow: true,
  bottomRow: true,
};

export type TextSize = keyof typeof TextSizes;

export const DEFAULT_FONT_SIZE = THEMEING_TEXT_SIZES.base;

// The max and min height limits for widgets in rows.
// 9000 is an arbitrarily large value for the height of a widget
// In pixels this would be 90000px, which is a fairly large number.

// 4 is the minimum for any widget, as we donot support zero height widgets today.
// This also makes sure that widgets have sufficient area in which users can interact.
export const WidgetHeightLimits = {
  MAX_HEIGHT_IN_ROWS: 9000,
  MIN_HEIGHT_IN_ROWS: 4,
  MIN_CANVAS_HEIGHT_IN_ROWS: 10,
};

export const WIDGET_PROPS_TO_SKIP_FROM_EVAL = {
  children: true,
  parentId: true,
  renderMode: true,
  detachFromLayout: true,
  noContainerOffset: false,
  hideCard: true,
  isDeprecated: true,
  searchTags: true,
  iconSVG: true,
  version: true,
  displayName: true,
};
