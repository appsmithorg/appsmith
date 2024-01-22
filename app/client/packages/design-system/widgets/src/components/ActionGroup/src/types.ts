import type { SpectrumActionGroupProps } from "@react-types/actiongroup";
import type { ListState } from "@react-stately/list";

import type { Node, StyleProps } from "@react-types/shared";

import type { ButtonProps } from "../../Button";

export const ACTION_GROUP_ORIENTATIONS = {
  vertical: "vertical",
  horizontal: "horizontal",
};

export interface InheritedActionButtonProps
  extends Pick<ButtonProps, "variant" | "color"> {}

export interface ActionGroupProps<T>
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
      | keyof StyleProps
    >,
    InheritedActionButtonProps {
  orientation?: keyof typeof ACTION_GROUP_ORIENTATIONS;
}

export interface ActionGroupItemProps<T> extends ButtonProps {
  state: ListState<T>;
  item: Node<T>;
}
