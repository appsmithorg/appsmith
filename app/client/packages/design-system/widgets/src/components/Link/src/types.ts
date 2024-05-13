import type { ComponentProps } from "react";

import type { TextProps } from "../../Text";

export interface LinkProps extends TextProps {
  href?: string;
  target?: ComponentProps<"a">["target"];
  rel?: string;
}
