import type { ComponentProps } from "widgets/BaseComponent";
import type { TextInputProps } from "@appsmith/wds";

export type KeyDownEvent = React.KeyboardEvent<
  HTMLTextAreaElement | HTMLInputElement
>;

export interface BaseInputComponentProps extends ComponentProps {
  autoFocus?: boolean;
  autoComplete?: string;
  onKeyDown?: (e: KeyDownEvent) => void;

  maxChars?: number;
  widgetId: string;
  spellCheck?: boolean;
  shouldUseLocale?: boolean;
  excludeFromTabOrder?: boolean;

  // input props
  value?: string;
  isLoading?: boolean;
  placeholder?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  defaultValue?: string | number;
  onValueChange?: (value: string) => void;
  onFocusChange?: (isFocused: boolean) => void;

  // label props
  label: string;

  // validation props
  validationStatus?: TextInputProps["validationState"];
  errorMessage?: string;

  // misc
  tooltip?: string;
}
