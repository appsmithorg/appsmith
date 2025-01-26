import type { SpectrumActionGroupProps } from "@react-types/actiongroup";
import type { Key } from "@react-types/shared";
import type { StyleProps } from "@react-types/shared";
import type { ButtonProps } from "../../Button";
import type { SIZES } from "../../../shared";

export interface InlineButtonsProps<T>
  extends Omit<
      SpectrumActionGroupProps<T>,
      | "staticColor"
      | "isQuiet"
      | "isJustified"
      | "isEmphasized"
      | "buttonLabelBehavior"
      | "summaryIcon"
      | "orientation"
      | "selectionMode"
      | "defaultSelectedKeys"
      | "disallowEmptySelection"
      | "onSelectionChange"
      | "selectedKeys"
      | "density"
      | "children"
      | "overflowMode"
      | "id"
      | keyof StyleProps
    >,
    Pick<ButtonProps, "variant" | "color"> {
  /**
   * Whether to exclude the element from the sequential tab order. If true, the element will not be focusable via the keyboard by tabbing. This should be avoided except in rare scenarios where an alternative means of accessing the element or its functionality via the keyboard is available.
   * @default false
   */
  excludeFromTabOrder?: boolean;
  /** Size of buttons
   * @default medium
   */
  size?: Exclude<keyof typeof SIZES, "large">;
}

export interface InlineButtonsItem
  extends Pick<
    ButtonProps,
    "icon" | "iconPosition" | "isLoading" | "isDisabled" | "variant" | "color"
  > {
  id: Key;
  label?: string;
  isSeparator?: boolean;
}
