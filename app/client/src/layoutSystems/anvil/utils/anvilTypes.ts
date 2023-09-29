import type { RenderModes } from "constants/WidgetConstants";
import type { HighlightInfo } from "layoutSystems/common/utils/types";
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
  children?: React.ReactNode; // Children of layout component.
  childTemplate?: LayoutComponentProps; // The template of child layout components to wrap new widgets in.
  isDropTarget?: boolean; // Whether the layout component is a drop target. Accordingly, renders
  insertChild?: boolean; // Identifies which of the child layout components in childTemplate to add new widgets to.
  isPermanent?: boolean; // Whether the layout component can exist without any children.

  childrenMap?: Record<string, WidgetProps>; // Map of child widget ids to their props.
  renderMode?: RenderModes;
}

export interface LayoutComponent extends React.FC<LayoutComponentProps> {
  // add all other static props here
  type: LayoutComponentType;
  getWidth: (arg0: any) => number;
  deriveHighlights: (canvasId: string) => HighlightInfo[];
  extractChildWidgetIds: (props: LayoutComponentProps) => string[];
  rendersWidgets: (props: LayoutComponentProps) => boolean;
}
