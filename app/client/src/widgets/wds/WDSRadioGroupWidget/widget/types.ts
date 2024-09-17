import type { RadioGroupProps } from "@appsmith/wds";
import type { WidgetProps } from "widgets/BaseWidget";

export interface RadioGroupWidgetProps extends WidgetProps {
  options: RadioGroupProps["items"];
  selectedOptionValue: string;
  onSelectionChange: string;
  defaultOptionValue: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  label: string;
  labelTooltip?: string;
  isDirty: boolean;
  orientation?: RadioGroupProps["orientation"];
}
