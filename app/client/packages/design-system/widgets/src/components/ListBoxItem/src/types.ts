import type { ListBoxItemProps as AriaListBoxItemProps } from "react-aria-components";
import type { IconProps } from "@appsmith/wds";

export interface ListBoxItemProps extends AriaListBoxItemProps<object> {
  icon?: IconProps["name"];
}
