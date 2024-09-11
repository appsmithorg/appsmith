import type { WidgetProps } from "widgets/BaseWidget";

export interface WDSSelectWidgetProps extends WidgetProps {
  options: Record<string, unknown>[] | string;
  selectedOptionValue: string;
  onSelectionChange: string;
  defaultOptionValue: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  label: string;
  labelTooltip?: string;
  isDirty: boolean;
}
