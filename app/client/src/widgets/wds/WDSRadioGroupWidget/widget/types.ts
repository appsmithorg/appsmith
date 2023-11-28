import type { RadioGroupProps, RadioProps } from "@design-system/widgets";
import type { WidgetProps } from "widgets/BaseWidget";

export interface RadioOption {
  label: string;
  value: string;
}

export interface RadioGroupWidgetProps extends WidgetProps {
  options: RadioOption[];
  selectedOptionValue: string;
  onSelectionChange: string;
  defaultOptionValue: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  label: string;
  labelTooltip?: string;
  isDirty: boolean;
  orientation?: RadioGroupProps["orientation"];
  labelPosition?: RadioProps["labelPosition"];
}
