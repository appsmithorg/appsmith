import type { SelectProps } from "@appsmith/wds";
import type { WidgetProps } from "widgets/BaseWidget";

export interface WDSSelectWidgetProps extends WidgetProps {
  options: SelectProps["items"];
  selectedOptionValue: string;
  onSelectionChange: string;
  defaultOptionValue: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  label: string;
  labelTooltip?: string;
  isDirty: boolean;
}
