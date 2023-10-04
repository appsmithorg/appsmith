import type { WidgetProps } from "widgets/BaseWidget";

// Layout system types that Appsmith provides
export enum LayoutSystemTypes {
  FIXED = "FIXED",
  AUTO = "AUTO",
  ANVIL = "ANVIL",
}

// interface for appPositioning(aka layoutStystem) details.
// It is part of applicationDetails Record of an Application
// Refer to ApplicationPayload
export type LayoutSystemTypeConfig = {
  type: LayoutSystemTypes;
};

/**
 * @type WidgetLayoutSystem
 *
 * type to define the structure of widget based entities on a specific layout system.
 *
 * @property WidgetWrapper - component that wraps around a widget
 * @property propertyEnhancer - function that is used to enhance/modify widget properties as per the layout system
 */

export type WidgetLayoutSystem = {
  WidgetWrapper: (props: WidgetProps) => JSX.Element;
  propertyEnhancer: (props: WidgetProps) => WidgetProps;
};

/**
 * @type CanvasLayoutSystem
 *
 * type to define the structure of canvas based entities on a specific layout system.
 * @property Canvas - component that renders/positions children as per the layout system.
 * @property propertyEnhancer - function that is used to enhance/modify canvas properties as per the layout system
 */

export type CanvasLayoutSystem = {
  Canvas: (props: WidgetProps) => JSX.Element;
  propertyEnhancer: (props: WidgetProps) => WidgetProps;
};

/**
 * @type LayoutSystem
 *
 * Layout System is the high level system that provides set of wrappers/implementations needed for widgets to function and
 * render on both Editor and Viewer of Appsmith.
 *
 * @property widgetSystem - provides widget specific entities
 * @property canvasSystem - provides canvas specific entities
 */

export type LayoutSystem = {
  widgetSystem: WidgetLayoutSystem;
  canvasSystem: CanvasLayoutSystem;
};
