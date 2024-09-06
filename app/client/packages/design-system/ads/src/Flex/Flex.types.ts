import type { BoxProps } from "../Box";

interface DisplayProps {
  display?: "flex" | "inline-flex";
}

export type FlexProps = Omit<
  BoxProps,
  | "display"
  | "rowGap"
  | "colGap"
  | "gridAutoColumns"
  | "gridAutoRows"
  | "gridTemplateColumns"
  | "gridTemplateRows"
> &
  DisplayProps;
