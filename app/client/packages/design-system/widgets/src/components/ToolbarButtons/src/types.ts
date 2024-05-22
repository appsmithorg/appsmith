import type { SpectrumActionGroupProps } from "@react-types/actiongroup";
import type { StyleProps } from "@react-types/shared";
import type { ButtonProps } from "../../Button";
import type { SIZES } from "../../../shared";

export const ACTION_GROUP_ALIGNMENTS = {
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
      | keyof StyleProps
    >,
    Pick<ButtonProps, "variant" | "color"> {
  size?: Omit<keyof typeof SIZES, "large">;
  alignment?: keyof typeof ACTION_GROUP_ALIGNMENTS;
}

export interface ToolbarButtonsItem
  extends Pick<
    ButtonProps,
    "icon" | "iconPosition" | "isLoading" | "isDisabled"
  > {
  id: string | number;
  label?: string;
  isSeparator?: boolean;
}
