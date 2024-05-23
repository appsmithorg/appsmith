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
  size?: Omit<keyof typeof SIZES, "large">;
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
