import type { ListState } from "@react-stately/list";
import type { SpectrumActionGroupProps } from "@react-types/actiongroup";
import type { Node } from "@react-types/shared";
import type { StyleProps } from "@react-types/shared";
import type { ButtonProps } from "../../Button";
import type { SIZES } from "../../../shared";
import type { IconProps } from "../../Icon";

export const ACTION_GROUP_ALIGNMENTS = {
  start: "Start",
  end: "End",
} as const;

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
      | "children"
      | keyof StyleProps
    >,
    Pick<ButtonProps, "variant" | "color"> {
  size?: Omit<keyof typeof SIZES, "large">;
  alignment?: keyof typeof ACTION_GROUP_ALIGNMENTS;
}

export interface ActionGroupItem {
  id: string | number;
  label?: string;
  icon?: IconProps["name"];
  isSeparator?: boolean;
}

export interface ActionGroupButtonProps<T> extends ButtonProps {
  state: ListState<T>;
  item: Node<T>;
}
