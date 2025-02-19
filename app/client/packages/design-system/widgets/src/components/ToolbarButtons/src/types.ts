import type { SpectrumActionGroupProps } from "@react-types/actiongroup";
import type { Key } from "@react-types/shared";
import type { StyleProps } from "@react-types/shared";
import type { ButtonProps } from "../../Button";
import type { SIZES } from "../../../shared";

export const TOOLBAR_BUTTONS_ALIGNMENTS = {
  start: "Start",
  end: "End",
} as const;

export interface ToolbarButtonsProps<T>
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
      | "children"
      | "overflowMode"
      | "id"
      | keyof StyleProps
    >,
    Pick<ButtonProps, "variant" | "color"> {
  /** Size of buttons
   * @default medium
   */
  size?: Exclude<keyof typeof SIZES, "large">;
  /** Alignment of buttons inside the container
   * @default start
   */
  alignment?: keyof typeof TOOLBAR_BUTTONS_ALIGNMENTS;
  /**
   * Whether to exclude the element from the sequential tab order. If true, the element will not be focusable via the keyboard by tabbing. This should be avoided except in rare scenarios where an alternative means of accessing the element or its functionality via the keyboard is available.
   * @default false
   */
  excludeFromTabOrder?: boolean;
}

export interface ToolbarButtonsItem
  extends Pick<ButtonProps, "icon" | "isLoading" | "isDisabled"> {
  id: Key;
  label?: string;
  isSeparator?: boolean;
}
