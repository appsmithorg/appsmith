import { ComponentProps } from "widgets/BaseComponent";
import { WidgetProps } from "widgets/BaseWidget";

export interface SignaturePadWidgetProps extends WidgetProps {
  label: string;
  isDisabled: boolean;
  penColor?: string;
  padBackgroundColor?: string;
  borderRadius: string;
  boxShadow?: string;
  onSigning?: string;
}

export interface SignaturePadComponentProps extends ComponentProps {
  label: string;
  isDisabled: boolean;
  penColor?: string;
  padBackgroundColor?: string;
  borderRadius: string;
  boxShadow?: string;
  onSigning: (value: string) => void;
}
