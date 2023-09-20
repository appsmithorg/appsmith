import type { WidgetProps } from "widgets/BaseWidget";

import type { BaseInputComponentProps } from "../component/types";

export interface BaseInputWidgetProps extends WidgetProps {
  text: string;
  isDisabled?: boolean;
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
  labelPosition?: BaseInputComponentProps["labelPosition"];
  labelAlignment?: BaseInputComponentProps["labelAlign"];
  labelWidth?: BaseInputComponentProps["labelWidth"];

  // misc
  tooltip?: string;
}
