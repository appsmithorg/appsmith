import type { IconProps } from "@appsmith/wds";
import type { ListBoxItemProps as AriaListBoxItemProps } from "react-aria-components";

export interface ListBoxItemProps extends AriaListBoxItemProps<object> {
  icon?: IconProps["name"];
}
