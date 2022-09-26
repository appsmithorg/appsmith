import { WidgetProps } from "widgets/BaseWidget";

export interface IframeWidgetProps extends WidgetProps {
  source: string;
  srcDoc?: string;
  title?: string;
  onURLChanged?: string;
  onSrcDocChanged?: string;
  onMessageReceived?: string;
  borderColor?: string;
  borderOpacity?: number;
  borderWidth?: number;
  borderRadius: string;
  boxShadow?: string;
}
