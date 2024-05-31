import type { WidgetProps } from "widgets/BaseWidget";

export interface ModalWidgetProps extends WidgetProps {
  showFooter: boolean;
  showHeader: boolean;
  size: "small" | "medium" | "large";
  showSubmitButton: boolean;
  submitButtonText: string;
  cancelButtonText: string;
  className: string;
  closeOnSubmit: boolean;
}
