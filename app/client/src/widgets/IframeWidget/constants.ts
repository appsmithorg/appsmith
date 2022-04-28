import { WidgetProps, WidgetMethodProps } from "widgets/BaseWidget";

export interface IframeWidgetProps extends WidgetProps, WidgetMethodProps {
  source: string;
  srcDoc?: string;
  title?: string;
  onURLChanged?: string;
  onSrcDocChanged?: string;
  onMessageReceived?: string;
  borderColor?: string;
  borderOpacity?: number;
  borderWidth?: number;
}
