import type { WidgetProps } from "widgets/BaseWidget";

export interface BaseInputWidgetProps extends WidgetProps {
  text: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  placeholderText?: string;
  isFocused?: boolean;
  autoFocus?: boolean;
  onSubmit?: string;

  // validation props
  validation: boolean;
  regex?: string;
  errorMessage?: string;
  isDirty?: boolean;
  isRequired?: boolean;

  // label Props
  label: string;

  // misc
  tooltip?: string;
}
