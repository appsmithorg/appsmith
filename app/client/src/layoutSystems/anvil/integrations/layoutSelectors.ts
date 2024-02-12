import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { AlignmentIndexMap } from "../utils/constants";
import type { LayoutElementPosition, LayoutElementPositions } from "layoutSystems/common/types";
import { createSelector } from "reselect";
import { getLayoutElementPositions } from "layoutSystems/common/selectors";

/**
 *
 * @param layoutId
 * @returns boolean: whether the default styles for alignments should be overridden.
 */
export function shouldOverrideAlignmentStyle(layoutId: string) {
  return createSelector(
    getLayoutElementPositions,
    (positions: LayoutElementPositions): boolean => {
      if (!layoutId || !positions[layoutId]) return false;

      // If positions don't exist for start alignment, return false as this layout doesn't contain alignments.
      if (!positions[`${layoutId}-0`]) return false;

      const layoutPosition: LayoutElementPosition = positions[layoutId];
      const threshold = layoutPosition.width * 0.98;

      // return true if width of any alignment exceeds the limit.
      return [
        FlexLayerAlignment.Start,
        FlexLayerAlignment.Center,
        FlexLayerAlignment.End,
      ].some((alignment) => {
        const alignmentPosition: LayoutElementPosition =
          positions[`${layoutId}-${AlignmentIndexMap[alignment]}`];
        return alignmentPosition.width >= threshold;
      });
    },
  );
}
