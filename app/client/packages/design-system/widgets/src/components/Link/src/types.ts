import type { LinkProps as AriaLinkProps } from "react-aria-components";

import type { TextProps } from "../../Text";

export interface LinkProps
  extends TextProps,
    Omit<AriaLinkProps, "style" | "className" | "children"> {}
