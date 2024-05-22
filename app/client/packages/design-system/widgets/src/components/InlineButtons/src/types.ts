import type { SpectrumActionGroupProps } from "@react-types/actiongroup";
import type { StyleProps } from "@react-types/shared";
import type { ButtonProps } from "../../Button";
import type { SIZES } from "../../../shared";

export const INLINE_BUTTONS_ORIENTATIONS = {
  vertical: "vertical",
  horizontal: "horizontal",
};

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
      | keyof StyleProps
    >,
    Pick<ButtonProps, "variant" | "color"> {
  size?: Omit<keyof typeof SIZES, "large">;
  orientation?: keyof typeof INLINE_BUTTONS_ORIENTATIONS;
}

export interface InlineButtonsItem
  extends Pick<
    ButtonProps,
    "icon" | "iconPosition" | "isLoading" | "isDisabled"
  > {
  id: string | number;
  label?: string;
  isSeparator?: boolean;
}
