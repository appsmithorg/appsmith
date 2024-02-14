import { getLayoutElementPositions } from "layoutSystems/common/selectors";
import type {
  LayoutElementPosition,
  LayoutElementPositions,
} from "layoutSystems/common/types";
import { createSelector } from "reselect";
import { AlignmentIndexMap } from "../utils/constants";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";

export const ALIGNMENT_WIDTH_THRESHOLD = 0.95;

export function shouldOverrideAlignmentStyle(layoutId: string) {
  return createSelector(
    getLayoutElementPositions,
    (positions: LayoutElementPositions): boolean => {
      if (!layoutId || !positions || !positions[layoutId]) return false;

      // If positions don't exist for start alignment, return false as this layout is not aligned.
      if (!positions[`${layoutId}-0`]) return false;

      const layoutPosition: LayoutElementPosition = positions[layoutId];
      const threshold = layoutPosition.width * ALIGNMENT_WIDTH_THRESHOLD;

      // return true if width of any alignment exceeds the limit.
      return [
        FlexLayerAlignment.Start,
        FlexLayerAlignment.Center,
        FlexLayerAlignment.End,
      ].some((each: FlexLayerAlignment) => {
        const alignmentPosition: LayoutElementPosition =
          positions[`${layoutId}-${AlignmentIndexMap[each]}`];
        return alignmentPosition.width >= threshold;
      });
    },
  );
}
