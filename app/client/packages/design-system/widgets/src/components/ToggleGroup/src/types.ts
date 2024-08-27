import type { CheckboxGroupProps as HeadlessToggleGroupProps } from "react-aria-components";
import type { ORIENTATION } from "@appsmith/wds";

interface ToggleGroupItemProps {
  value: string;
  label?: string;
  isSelected?: boolean;
  isDisabled?: boolean;
  index?: number;
}

export interface ToggleGroupProps
  extends Omit<HeadlessToggleGroupProps, "slot" | "children"> {
  /**
   * The content to display as the label.
   */
  label?: string;
  /**
   * The axis the checkboxes should align with.
   * @default 'horizontal'
   */
  orientation?: keyof typeof ORIENTATION;
  /**
   * An error message for the field.
   */
  errorMessage?: string;
  /**
   * Checkboxes that belong to this group.
   */
  items: ToggleGroupItemProps[];
  /**
   *
   */
  children: (props: ToggleGroupItemProps) => JSX.Element;
  /**
   * A ContextualHelp element to place next to the label.
   */
  contextualHelp?: string;
}
