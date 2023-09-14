import { LayoutDirection, Positioning } from "../utils/constants";

export const getDirection = (positioning?: Positioning): LayoutDirection => {
  return positioning === Positioning.Vertical
    ? LayoutDirection.Vertical
    : LayoutDirection.Horizontal;
};
