import type { ReactNode } from "react";
import type { IconProps } from "@appsmith/wds";
import type { ListBoxItemProps as AriaListBoxItemProps } from "react-aria-components";

export interface ListBoxItemProps extends AriaListBoxItemProps<object> {
  icon?: IconProps["name"];
  /**
   * The prefix is the element that is rendered before the icon and text.
   * It is used in MultiSelect to render the checkbox before the text.
   */
  prefix?: ReactNode;
}
