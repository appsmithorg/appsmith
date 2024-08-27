import type { WidgetProps } from "widgets/BaseWidget";

export interface WDSSelectWidgetProps extends WidgetProps {
  options: { label: "string"; value: "string" | number }[];
  selectedOptionValue: string;
  onSelectionChange: string;
  defaultOptionValue: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  label: string;
  labelTooltip?: string;
  isDirty: boolean;
}
