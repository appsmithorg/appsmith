import {
  LayoutDirection,
  Positioning,
} from "layoutSystems/common/utils/constants";

/**
 * This utility function returns the direction of the layout based on the positioning
 * @param positioning
 * @returns
 */

export const getDirection = (positioning?: Positioning): LayoutDirection => {
  return positioning === Positioning.Vertical
    ? LayoutDirection.Vertical
    : LayoutDirection.Horizontal;
};
