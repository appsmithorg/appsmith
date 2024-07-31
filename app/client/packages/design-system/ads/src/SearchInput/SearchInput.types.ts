import type { InputProps } from "../Input";

export interface SearchInputProps
  extends Omit<InputProps, "renderAs" | "type"> {
  /** (try not to) pass additional classes here */
  className?: string;
  /** Value */
  value?: string;
  /** placeholder */
  placeholder?: string;
  /** onValue change trigger */
  onChange?: (value: string) => void;
}
