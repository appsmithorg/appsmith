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
  size?: Omit<keyof typeof SIZES, "large">;
  alignment?: keyof typeof TOOLBAR_BUTTONS_ALIGNMENTS;
}

export interface ToolbarButtonsItem
  extends Pick<ButtonProps, "icon" | "isLoading" | "isDisabled"> {
  id: Key;
  label?: string;
  isSeparator?: boolean;
}
