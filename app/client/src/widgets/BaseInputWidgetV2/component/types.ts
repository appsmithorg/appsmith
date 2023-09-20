import type { ComponentProps } from "widgets/BaseComponent";
import type { TextInputProps } from "@design-system/widgets";

export interface BaseInputComponentProps extends ComponentProps {
  autoFocus?: boolean;
  autoComplete?: string;

  maxChars?: number;
  widgetId: string;
  spellCheck?: boolean;
  shouldUseLocale?: boolean;

  // input props
  value?: string;
  isLoading?: boolean;
  placeholder?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
  defaultValue?: string | number;
  onValueChange?: (value: string) => void;
  onFocusChange?: (isFocused: boolean) => void;

  // label props
  label: string;
  labelWidth?: number;
  labelAlign?: TextInputProps["labelAlign"];
  labelPosition?: TextInputProps["labelPosition"];

  // validation props
  validationStatus?: TextInputProps["validationState"];
  errorMessage?: string;

  // misc
  tooltip?: string;
}
