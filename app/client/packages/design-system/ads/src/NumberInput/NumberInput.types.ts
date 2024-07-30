import type { InputProps } from "../Input/Input.types";

// NumberInput props
export type NumberInputProps = InputProps & {
  /** (try not to) pass addition classes here */
  className?: string;
  /** Whether the input is disabled. */
  isDisabled?: boolean;
  /** Whether the input can be selected but not changed by the user. */
  isReadOnly?: boolean;
  /** Whether the input is required. */
  isRequired?: boolean;
  /** Label of the input. */
  label?: string;
  /** Label position */
  labelPosition?: "top" | "left";
  /** Description of the input. */
  description?: string;
  /** Whether text input is allowed. */
  disableTextInput?: boolean;
  /** Error message of the input. Based on this, the input will show error state. */
  errorMessage?: string;
  /** Value */
  value?: string | undefined;
  /** prefix */
  prefix?: string;
  /** suffix */
  suffix?: string;
  /** Scale factor which value should increment or decrement. */
  scale?: number;
  /** placeholder */
  placeholder?: string;
  /** onValue change trigger */
  onChange?: (value: string | undefined) => void;
  /** Whether the input given passes the validation parameters. */
  isValid?: boolean;
  /** Maximum value of the input. */
  max?: number;
  /** Minimum value of the input. */
  min?: number;
};
