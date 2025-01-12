import type { SupportedLayouts } from "reducers/entityReducers/types";
import type { WidgetType as FactoryWidgetType } from "WidgetProvider/factory";
import { THEMEING_TEXT_SIZES } from "./ThemeConstants";
import type { WidgetCardProps } from "widgets/BaseWidget";
export type WidgetType = FactoryWidgetType;

export const SKELETON_WIDGET_TYPE = "SKELETON_WIDGET";

export type ContainerOrientation = "HORIZONTAL" | "VERTICAL";

export const PositionTypes: { [id: string]: string } = {
  ABSOLUTE: "ABSOLUTE",
  CONTAINER_DIRECTION: "CONTAINER_DIRECTION",
};
export type PositionType = (typeof PositionTypes)[keyof typeof PositionTypes];

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

export enum RenderModes {
  COMPONENT_PANE = "COMPONENT_PANE",
  CANVAS = "CANVAS",
  PAGE = "PAGE",
  CANVAS_SELECTED = "CANVAS_SELECTED",
}

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

export const LATEST_PAGE_VERSION = 87;

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

export const DefaultDimensionMap = {
  leftColumn: "leftColumn",
  rightColumn: "rightColumn",
  topRow: "topRow",
  bottomRow: "bottomRow",
};

// Note: Widget Padding + Container Padding === DEFAULT_GRID_ROW_HEIGHT to gracefully lose one row when a container is used,
// which wud allow the user to place elements centered inside a container(columns are rendered proportionally so it take cares of itself).

export const CONTAINER_GRID_PADDING =
  GridDefaults.DEFAULT_GRID_ROW_HEIGHT * 0.6;

/**
 * Padding introduced by container-like widgets in AutoLayout mode.
 * FlexComponent - margin: 2px (2 * 2 = 4px) [Deploy mode = 4px ( 4 * 2 = 8px)]
 * ResizeWrapper - padding: 1px, border: 1px (2 * 2 = 4px) [Deploy mode = 0px]
 * ContainerComponent - border: 1px (1 * 2 = 2px) [Deploy mode = 2px]
 * Total - 5px (5 * 2 = 10px)
 */
export const AUTO_LAYOUT_CONTAINER_PADDING = 5;

export const WIDGET_PADDING = GridDefaults.DEFAULT_GRID_ROW_HEIGHT * 0.4;

export const WIDGET_CLASSNAME_PREFIX = "WIDGET_";
export const MAIN_CONTAINER_WIDGET_ID = "0";
export const MAIN_CONTAINER_WIDGET_NAME = "MainContainer";
export const MODAL_PORTAL_CLASSNAME = "bp3-modal-widget";
export const MODAL_PORTAL_OVERLAY_CLASSNAME = "bp3-overlay-zindex";
export const CANVAS_SELECTOR = "canvas";

export const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 };

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
  mobileTopRow: true,
  mobileBottomRow: true,
  mobileLeftColumn: true,
  mobileRightColumn: true,
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
  topRowBeforeCollapse: false,
  bottomRowBeforeCollapse: false,
};

export const WIDGET_DSL_STRUCTURE_PROPS = {
  bottomRow: true,
  children: true,
  requiresFlatWidgetChildren: true,
  hasMetaWidgets: true,
  isMetaWidget: true,
  parentId: true,
  referencedWidgetId: true,
  topRow: true,
  type: true,
  widgetId: true,
  layout: true,
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
  thumbnailSVG: true,
  version: true,
  displayName: true,
  topRowBeforeCollapse: false,
  bottomRowBeforeCollapse: false,
  tags: false,
};

/**
 * This is the padding that is applied to the flexbox container.
 * It is also used to calculate widget positions and highlight placements.
 */
export const FLEXBOX_PADDING = 4;

/**
 * max width of modal widget constant as a multiplier of Main canvasWidth
 */
export const MAX_MODAL_WIDTH_FROM_MAIN_WIDTH = 0.95;

export const FILE_SIZE_LIMIT_FOR_BLOBS = 5000 * 1024; // 5MB

export const WIDGET_TAGS = {
  SUGGESTED_WIDGETS: "Suggested",
  INPUTS: "Inputs",
  BUTTONS: "Buttons",
  SELECT: "Select",
  DISPLAY: "Display",
  LAYOUT: "Layout",
  MEDIA: "Media",
  TOGGLES: "Toggles",
  SLIDERS: "Sliders",
  CONTENT: "Content",
  EXTERNAL: "External",
  BUILDING_BLOCKS: "Building Blocks",
  MYDATEPICKER : "MyDatePicker",
} as const;

export type WidgetTags = (typeof WIDGET_TAGS)[keyof typeof WIDGET_TAGS];

export type WidgetCardsGroupedByTags = Record<WidgetTags, WidgetCardProps[]>;

// Initial items to display as default when loading entities in the explorer
export const initialEntityCountForExplorerTag: Partial<
  Record<WidgetTags, number>
> = {
  "Building Blocks": 9, // render only 9 items initially
};

export const SUGGESTED_WIDGETS_ORDER: Record<WidgetType, number> = {
  TABLE_WIDGET_V2: 1,
  INPUT_WIDGET_V2: 2,
  TEXT_WIDGET: 3,
  SELECT_WIDGET: 4,
};

// Constant key to show walkthrough for a widget -> stores widget id
export const WIDGET_ID_SHOW_WALKTHROUGH = "WIDGET_ID_SHOW_WALKTHROUGH";

export const DEFAULT_ROWS_FOR_EXPLORER_BUILDING_BLOCKS = 60;
export const DEFAULT_COLUMNS_FOR_EXPLORER_BUILDING_BLOCKS = 62;
export const BUILDING_BLOCK_MIN_HORIZONTAL_LIMIT = 2000;
export const BUILDING_BLOCK_MIN_VERTICAL_LIMIT = 800;
export const BUILDING_BLOCK_EXPLORER_TYPE = "BUILDING_BLOCK";

export type EitherMouseLocationORGridPosition =
  | { mouseLocation: { x: number; y: number }; gridPosition?: never }
  | { mouseLocation?: never; gridPosition: { top: number; left: number } };

export type PasteWidgetReduxAction = {
  groupWidgets: boolean;
  existingWidgets?: unknown;
} & EitherMouseLocationORGridPosition;
