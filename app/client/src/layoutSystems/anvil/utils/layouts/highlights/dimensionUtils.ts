import type {
  LayoutElementPosition,
  LayoutElementPositions,
} from "layoutSystems/common/types";

/**
 *
 * @param id | string : widget or layout id.
 * @param parentLayoutId | string : layout id of drop target ancestor.
 * @param positions | LayoutElementPositions : positions and dimensions of widgets and layouts.
 * @returns LayoutElementPosition : Position and dimension of target widget / layout wrt to parent drop target layout.
 */
export const getRelativeDimensions =
  (parentLayoutId: string, positions: LayoutElementPositions) =>
  (id: string): LayoutElementPosition => {
    const curr: LayoutElementPosition = positions[id];
    const parent: LayoutElementPosition = positions[parentLayoutId];

    return {
      ...curr,
      top: curr.top - parent.top,
      left: curr.left - parent.left,
    };
  };
