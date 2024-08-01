import type { WidgetType } from "WidgetProvider/factory";
import type { RenderMode } from "constants/WidgetConstants";
import type {
  FlexLayerAlignment,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import type {
  LayoutElementPosition,
  LayoutElementPositions,
} from "layoutSystems/common/types";

export type LayoutComponentType =
  | "ALIGNED_LAYOUT_COLUMN"
  | "ALIGNED_WIDGET_COLUMN"
  | "ALIGNED_WIDGET_ROW"
  | "LAYOUT_COLUMN"
  | "LAYOUT_ROW"
  | "SECTION"
  | "WIDGET_COLUMN"
  | "WIDGET_ROW"
  | "ZONE";

export enum LayoutComponentTypes {
  ALIGNED_LAYOUT_COLUMN = "ALIGNED_LAYOUT_COLUMN",
  ALIGNED_WIDGET_COLUMN = "ALIGNED_WIDGET_COLUMN",
  ALIGNED_WIDGET_ROW = "ALIGNED_WIDGET_ROW",
  LAYOUT_COLUMN = "LAYOUT_COLUMN",
  LAYOUT_ROW = "LAYOUT_ROW",
  SECTION = "SECTION",
  WIDGET_COLUMN = "WIDGET_COLUMN",
  WIDGET_ROW = "WIDGET_ROW",
  ZONE = "ZONE",
}

export interface WidgetLayoutProps {
  alignment: FlexLayerAlignment;
  widgetId: string;
  widgetType: string;
}

export interface LayoutProps {
  layout: LayoutProps[] | WidgetLayoutProps[]; // Array of layout components or widgets to render.
  layoutId: string; // Identifier of layout
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  layoutStyle?: { [key: string]: any }; // React.CSSProperties for overriding default layout style.
  layoutType: LayoutComponentTypes; // Used to identify the correct layout component to render.

  allowedWidgetTypes?: string[]; // Array of widget types that can be dropped on the layout component.
  childTemplate?: LayoutProps | null; // The template of child layout components to wrap new widgets in.
  isContainer?: boolean; // Whether the layout component support container queries.
  isDropTarget?: boolean; // Whether the layout component is a drop target. Accordingly, renders
  insertChild?: boolean; // Identifies which of the child layout components in childTemplate to add new widgets to.
  isPermanent?: boolean; // Whether the layout component can exist without any children.
  maxChildLimit?: number; // Maximum number of children that can be added to the layout component.
}

export interface LayoutComponentProps extends LayoutProps {
  canvasId: string; // Parent canvas of the layout.
  children?: React.ReactNode; // The children of the layout component.
  layoutIndex: number; // Index of the layout component in the parent layout.
  layoutOrder: string[]; // Top - down hierarchy of layoutIds.
  parentDropTarget: string; // layoutId of the immediate drop target parent. Could be self as well.
  className?: string;
  renderMode: RenderMode;
}

export interface LayoutComponentState {
  order: string[]; // Top - down hierarchy of layoutIds.
}

export interface LayoutComponent extends React.FC<LayoutComponentProps> {
  // add all other static props here
  type: LayoutComponentType;
  // Add a child widget / layout to the parent layout component.
  addChild: (
    props: LayoutProps,
    children: WidgetLayoutProps[] | LayoutProps[],
    highlight: AnvilHighlightInfo,
  ) => LayoutProps;
  // get template of layout component to wrap new widgets in.
  getChildTemplate: (
    props: LayoutProps,
    widgets?: WidgetLayoutProps[],
  ) => LayoutProps | undefined;
  // Get types of widgets that are allowed in this layout component.
  getWhitelistedTypes: (props: LayoutProps) => string[];
  // Get a list of highlights to demarcate the drop positions within the layout.
  deriveHighlights: (
    layoutProps: LayoutProps, // Properties of layout for which highlights have to be derived.
    widgetPositions: LayoutElementPositions, // Positions and dimensions of all widgets and layouts.
    canvasId: string, // widget Id of the parent canvas widget.
    draggedWidgets: DraggedWidget[], // List of dragged widgets/
    layoutOrder: string[], // Top - down hierarchy of layoutIds.
    parentDropTarget: string, // layoutId of immediate drop target ancestor.
  ) => AnvilHighlightInfo[];
  // Get a list of child widgetIds rendered by the layout.
  extractChildWidgetIds: (props: LayoutProps) => string[];
  // Remove a child widget / layout from the layout component.
  // return undefined if layout is not permanent and is empty after deletion.
  removeChild: (
    props: LayoutProps,
    child: WidgetLayoutProps | LayoutProps,
  ) => LayoutProps | undefined;
  // Render child widgets using the layout property.
  renderChildWidgets: (props: LayoutComponentProps) => React.ReactNode;
  // Check if the layout component renders widgets or layouts.
  rendersWidgets: (props: LayoutProps) => boolean;
}

export interface HighlightRenderInfo {
  height: number; // height of the highlight.
  isVertical: boolean; // Whether the highlight is vertical or horizontal.
  width: number; // width of the highlight.
  posX: number; // x position of the highlight.
  posY: number; // y position of the highlight.
  edgeDetails: {
    top: boolean; // Whether the highlight is at the top edge of the layout.
    bottom: boolean; // Whether the highlight is at the bottom edge of the layout.
    left: boolean; // Whether the highlight is at the left edge of the layout.
    right: boolean; // Whether the highlight is at the right edge of the layout.
  };
}

export interface HighlightDropInfo {
  layoutId: string;
  alignment: FlexLayerAlignment; // Alignment of the child in the layout.
  canvasId: string; // WidgetId of the canvas widget to which the highlight (/ layout) belongs.
  layoutOrder: string[]; // (Top - down) Hierarchy list of layouts to which the highlight belongs. The last entry in the array is the immediate parent layout.
  rowIndex: number; // Index with in the layout array to insert the child at.
  existingPositionHighlight?: boolean; // Whether the highlight is targeting the current position in the layout.
}

export interface AnvilHighlightInfo
  extends HighlightRenderInfo,
    HighlightDropInfo {}

export interface DraggedWidget {
  parentId?: string;
  responsiveBehavior?: ResponsiveBehavior;
  type: WidgetType;
  widgetId: string;
}

export type GetInitialHighlights = (
  layoutProps: LayoutProps,
  baseHighlight: AnvilHighlightInfo,
  getDimensions: GetDimensions,
  isDropTarget: boolean,
  hasAlignments: boolean,
  hasFillWidget?: boolean,
) => HighlightPayload;

export type GetWidgetHighlights = (
  layoutProps: LayoutProps,
  baseHighlight: AnvilHighlightInfo,
  draggedWidgets: DraggedWidget[],
  getDimensions: GetDimensions,
  hasAlignments: boolean,
  hasFillWidget?: boolean,
) => HighlightPayload;

export type GetLayoutHighlights = (
  layoutProps: LayoutProps,
  widgetPositions: LayoutElementPositions,
  baseHighlight: AnvilHighlightInfo,
  draggedWidgets: DraggedWidget[],
  canvasId: string,
  layoutOrder: string[],
  parentDropTargetId: string,
  getDimensions: GetDimensions,
  hasAlignments: boolean,
  hasFillWidget?: boolean,
) => HighlightPayload;

export type GetDimensions = (id: string) => LayoutElementPosition;

export type DeriveHighlightsFn = (
  props: LayoutProps,
  canvasId: string,
  layoutOrder: string[],
  parentDropTarget: string,
) => GetHighlights;

export type GetHighlights = (
  widgetPositions: LayoutElementPositions,
  draggedWidgets: DraggedWidget[],
) => HighlightPayload;

export interface HighlightPayload {
  highlights: AnvilHighlightInfo[];
  skipEntity: boolean;
}
