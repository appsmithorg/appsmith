import type { WidgetProps } from "widgets/BaseWidget";
import type { COMPONENT_SIZE } from "./constants";

export interface CustomWidgetProps extends WidgetProps {
  /* model is the appsmith data that we send to the iframe.
  This data can be grabbed from a datasource, query or it can be just static data. 
  The iframe can read, write and listen to changes to this data. */
  model: Record<string, unknown>;
  /** the custom widget can either take the full canvas size or can take height as per its content */
  size?: keyof typeof COMPONENT_SIZE;
  /** We create full page HTML from user provided HTML, JS and CSS with the help of a template. */
  srcDoc: {
    html: string;
    js: string;
    css: string;
  };
  /** The iframe can trigger any events that is defined on the widget. To do this, it calls this function.
   * These events are dynamic in a sense that they are not defined in the widget config but created by users.
   * For example, if a user wants to trigger an event when a button is clicked, they can define an event called "onButtonClick"
   * and then trigger it when the button is clicked with triggerEvent("onButtonClick") and associated actions will be executed.
   */
  events: string[];
}

export interface CustomWidgetComponentProps {
  model: WidgetProps["model"];
  srcDoc: WidgetProps["srcDoc"];
  widgetId: WidgetProps["widgetId"];
  size?: WidgetProps["size"];
  /** Why can't we use WidgetProps["renderMode"]?
   * Because the "BUILDER" renderMode is not available in that context.It's a new renderMode that we have added. */
  renderMode: "EDITOR" | "DEPLOYED" | "BUILDER";
  /** The iframe can trigger any events that is defined on the widget. To do this, it calls this function. */
  onTriggerEvent: (
    eventName: string,
    contextObj: Record<string, unknown>,
  ) => void;
  /** The iframe can update the model, whenever it needs to, it can call this function. */
  onUpdateModel: (data: Record<string, unknown>) => void;
  /** In the custom widget builder page, we show all console logs in the console tab. and
   * this onConsole function is used that intercepts all console logs in the iframe and shows them in the console tab. */
  onConsole?: (type: string, message: string) => void;
}

export interface IframeMessage {
  type: string;
  data?: unknown;
  key?: string;
  model?: Record<string, unknown>;
  theme?: unknown;
  success?: boolean;
  mode?: CustomWidgetComponentProps["renderMode"];
}
