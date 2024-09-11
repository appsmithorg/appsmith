import type { BoxProps } from "../Box";

interface DisplayProps {
  display?: "grid" | "inline-grid";
}

export type GridProps = Omit<
  BoxProps,
  "display" | "flex" | "flexDirection" | "flexWrap" | "flexGrow" | "flexShrink"
> &
  DisplayProps;
