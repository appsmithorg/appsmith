import type { RadioGroupProps as HeadlessRadioGroupProps } from "react-aria-components";
import type { ORIENTATION } from "../../../shared";

interface RadioGroupItemProps {
  value: string;
  label?: string;
  isSelected?: boolean;
  isDisabled?: boolean;
  index?: number;
}

export interface RadioGroupProps extends HeadlessRadioGroupProps {
  /**
   * A ContextualHelp element to place next to the label.
   */
  contextualHelp?: string;
  /**
   * The content to display as the label.
   */
  label?: string;
  /**
   * Radio that belong to this group.
   */
  items: RadioGroupItemProps[];
  /**
   * The axis the checkboxes should align with.
   * @default 'horizontal'
   */
  orientation?: keyof typeof ORIENTATION;
  /**
   * An error message for the field.
   */
  errorMessage?: string;
}
