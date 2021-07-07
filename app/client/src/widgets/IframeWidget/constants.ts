import { WidgetProps } from "widgets/BaseWidget";

export interface IframeWidgetProps extends WidgetProps {
  source: string;
  title?: string;
  onURLChanged?: string;
  onMessageReceived?: string;
  borderColor?: string;
  borderOpacity?: number;
  borderWidth?: number;
}
