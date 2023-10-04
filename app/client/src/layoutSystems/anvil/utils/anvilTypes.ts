import type { RenderMode } from "constants/WidgetConstants";
import type { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import type { DropZone } from "layoutSystems/common/utils/types";
import type { WidgetProps } from "widgets/BaseWidget";

export type LayoutComponentType =
  | "ALIGNED_COLUMN"
  | "ALIGNED_ROW"
  | "COLUMN"
  | "ROW";

export interface LayoutComponentProps {
  layout: LayoutComponentProps[] | string[] | string[][]; // Array of layout components or widgets to render.
  layoutId: string; // Identifier of layout
  layoutStyle?: { [key: string]: any }; // React.CSSProperties for overriding default layout style.
  layoutType: LayoutComponentType; // Used to identify the correct layout component to render.

  allowedWidgetTypes?: string[]; // Array of widget types that can be dropped on the layout component.
  canvasId: string; // Parent canvas of the layout.
  children?: React.ReactNode; // Children of layout component.
  childTemplate?: LayoutComponentProps; // The template of child layout components to wrap new widgets in.
  isDropTarget?: boolean; // Whether the layout component is a drop target. Accordingly, renders
  insertChild?: boolean; // Identifies which of the child layout components in childTemplate to add new widgets to.
  isPermanent?: boolean; // Whether the layout component can exist without any children.

  childrenMap?: Record<string, WidgetProps>; // Map of child widget ids to their props.
  renderMode?: RenderMode;
}

export interface LayoutComponent extends React.FC<LayoutComponentProps> {
  // add all other static props here
  type: LayoutComponentType;
  // Add a child widget / layout to the parent layout component.
  addChild: (
    props: LayoutComponentProps,
    children: string[] | LayoutComponentProps[],
    highlight: AnvilHighlightInfo,
  ) => LayoutComponentProps;
  getWidth: (arg0: any) => number;
  // get template of layout component to wrap new widgets in.
  getChildTemplate: (
    props: LayoutComponentProps,
  ) => LayoutComponentProps | undefined;
  // Get a list of highlights to demarcate the drop positions within the layout.
  deriveHighlights: (canvasId: string) => AnvilHighlightInfo[];
  // Get a list of child widgetIds rendered by the layout.
  extractChildWidgetIds: (props: LayoutComponentProps) => string[];
  // Remove a child widget / layout from the layout component.
  // return undefined if layout is not permanent and is empty after deletion.
  removeChild: (
    props: LayoutComponentProps,
    child: string | LayoutComponentProps,
  ) => LayoutComponentProps | undefined;
  // Render child widgets using the layout property.
  renderChildWidgets: (props: LayoutComponentProps) => React.ReactNode;
  // Check if the layout component renders widgets or layouts.
  rendersWidgets: (props: LayoutComponentProps) => boolean;
}

export interface AnvilHighlightInfo {
  alignment: FlexLayerAlignment; // Alignment of the child in the layout.
  canvasId: string; // WidgetId of the canvas widget to which the highlight (/ layout) belongs.
  dropZone: DropZone; // size of the drop zone of this highlight.
  height: number; // height of the highlight.
  layoutOrder: string[]; // (Top - down) Hierarchy list of layouts to which the highlight belongs. The last entry in the array is the immediate parent layout.
  posX: number; // x position of the highlight.
  posY: number; // y position of the highlight.
  rowIndex: number; // Index with in the layout array to insert the child at.
  width: number; // width of the highlight.
}
