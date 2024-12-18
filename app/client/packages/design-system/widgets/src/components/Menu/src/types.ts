import type { MenuProps as AriaMenuProps } from "react-aria-components";

export interface MenuProps extends Omit<AriaMenuProps<object>, "slot"> {}
