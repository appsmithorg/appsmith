import type { WidgetProps } from "widgets/BaseWidget";

export interface WDSDatePickerWidgetProps extends WidgetProps {
  selectedDate: string;
  defaultDate: string;
  onDateSelected: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  label: string;
  labelTooltip?: string;
}
