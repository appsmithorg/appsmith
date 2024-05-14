import type { SpectrumActionGroupProps } from "@react-types/actiongroup";
import type { ListState } from "@react-stately/list";
import type { Node, StyleProps } from "@react-types/shared";
import type { ButtonProps } from "../../Button";
import type { SIZES } from "../../../shared";
import type { IconProps } from "../../Icon";

export const BUTTON_GROUP_ORIENTATIONS = {
  vertical: "vertical",
  horizontal: "horizontal",
};

export interface ButtonGroupProps<T>
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
  orientation?: keyof typeof BUTTON_GROUP_ORIENTATIONS;
}

export interface ButtonGroupItem {
  id: string | number;
  label?: string;
  icon?: IconProps["name"];
  isSeparator?: boolean;
}

export interface ButtonGroupButtonProps<T> extends ButtonProps {
  state: ListState<T>;
  item: Node<T>;
}
