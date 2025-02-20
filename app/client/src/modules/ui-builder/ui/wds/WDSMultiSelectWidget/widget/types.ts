import type { WidgetProps } from "widgets/BaseWidget";

export interface WDSMultiSelectWidgetProps extends WidgetProps {
  options: Record<string, unknown>[] | string;
  selectedOptionValues: Set<string>;
  onSelectionChange: string;
  defaultOptionValues: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  label: string;
  labelTooltip?: string;
  isDirty: boolean;
}
