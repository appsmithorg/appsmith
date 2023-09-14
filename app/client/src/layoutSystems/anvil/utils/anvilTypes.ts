export interface LayoutComponentProps {
  layout: LayoutComponentProps[] | string[] | string[][]; // Array of layout components or widgets to render.
  layoutId: string; // Identifier of layout
  layoutStyle?: { [key: string]: any }; // React.CSSProperties for overriding default layout style.
  layoutType: string; // Used to identify the correct layout component to render.

  allowedWidgetTypes?: string[]; // Array of widget types that can be dropped on the layout component.
  childTemplate?: LayoutComponentProps; // The template of child layout components to wrap new widgets in.
  isDropTarget?: boolean; // Whether the layout component is a drop target. Accordingly, renders
  insertChild?: boolean; // Identifies which of the child layout components in childTemplate to add new widgets to.
  isPermanent?: boolean; // Whether the layout component can exist without any children.
}
