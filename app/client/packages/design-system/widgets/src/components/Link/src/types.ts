import type { LinkProps as AriaLinkProps } from "react-aria-components";

import type { TextProps } from "../../Text";

export interface LinkProps
  extends Omit<TextProps, "color">,
    Omit<
      AriaLinkProps,
      | "style"
      | "className"
      | "children"
      | "isDisabled"
      | "onBlur"
      | "onFocus"
      | "onKeyDown"
      | "onKeyUp"
      | "slot"
    > {}
