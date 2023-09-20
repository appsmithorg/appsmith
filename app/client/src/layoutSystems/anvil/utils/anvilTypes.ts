import type { WidgetProps } from "widgets/BaseWidget";
import type { HighlightInfo } from "./autoLayoutTypes";

export type LayoutComponentType = "ROW";

export interface LayoutComponentProps {
  children?: React.ReactNode; // Children of layout component.
  layout: LayoutComponentProps[] | string[] | string[][]; // Array of layout components or widgets to render.
  layoutId: string; // Identifier of layout
  layoutStyle?: { [key: string]: any }; // React.CSSProperties for overriding default layout style.
  layoutType: LayoutComponentType; // Used to identify the correct layout component to render.

  rendersWidgets?: boolean; // Whether the layout component renders widgets.
  allowedWidgetTypes?: string[]; // Array of widget types that can be dropped on the layout component.
  childTemplate?: LayoutComponentProps; // The template of child layout components to wrap new widgets in.
  isDropTarget?: boolean; // Whether the layout component is a drop target. Accordingly, renders
  insertChild?: boolean; // Identifies which of the child layout components in childTemplate to add new widgets to.
  isPermanent?: boolean; // Whether the layout component can exist without any children.

  childrenMap?: Record<string, WidgetProps>; // Map of child widget ids to their props.
}

export interface LayoutComponent extends React.FC<LayoutComponentProps> {
  // add all other static props here
  type: LayoutComponentType;
  getWidth: (arg0: any) => number;
  renderChildren: (
    props: LayoutComponentProps,
    widgetsMap: Record<string, React.ReactNode>,
  ) => React.ReactNode;
  deriveHighlights: (canvasId: string) => HighlightInfo[];
  extactChildWidgetIds: (
    props: LayoutComponentProps,
  ) => LayoutComponentProps["layout"];
}
