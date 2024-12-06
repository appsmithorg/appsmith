import type { WidgetProps } from "widgets/BaseWidget";
import type { COMPONENT_SIZE } from "./constants";

export interface CustomWidgetProps extends WidgetProps {
  events: string[];
}

export interface IframeMessage {
  type: string;
  data?: unknown;
  key?: string;
  model?: Record<string, unknown>;
  theme?: unknown;
  success?: boolean;
  mode?: "EDITOR" | "DEPLOYED" | "BUILDER";
}

export interface CustomComponentProps {
  onTriggerEvent: (
    eventName: string,
    contextObj: Record<string, unknown>,
  ) => void;
  onUpdateModel: (data: Record<string, unknown>) => void;
  model: Record<string, unknown>;
  srcDoc: {
    html: string;
    js: string;
    css: string;
  };
  onConsole?: (type: string, message: string) => void;
  renderMode: "EDITOR" | "DEPLOYED" | "BUILDER";
  widgetId: string;
  size?: keyof typeof COMPONENT_SIZE;
}
