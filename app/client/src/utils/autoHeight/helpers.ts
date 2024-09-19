import type { TreeNode } from "./constants";

/**
 * Gets the nearest above box for the current box. Including the aboves which have changes so far.
 *
 * @param tree: Auto Height Layout Tree
 * @param effectedBoxId: Current box in consideration
 * @param repositionedBoxes: Boxes repositioned so far
 * @returns An array of boxIds which are above and nearest the effectedBoxId
 */
export function getNearestAbove(
  tree: Record<string, TreeNode>,
  effectedBoxId: string,
  repositionedBoxes: Record<string, { topRow: number; bottomRow: number }>,
) {
  // Get all the above boxes
  const aboves = tree[effectedBoxId].aboves;
  // We're trying to find the nearest boxes above this box

  return aboves.reduce((prev: string[], next: string) => {
    if (!prev[0]) return [next];

    // Get the bottomRow of the above box
    let nextBottomRow = tree[next].bottomRow;
    let prevBottomRow = tree[prev[0]].bottomRow;

    // If we've already repositioned this, use the new bottomRow of the box
    if (repositionedBoxes[next]) {
      nextBottomRow = repositionedBoxes[next].bottomRow;
    }

    if (repositionedBoxes[prev[0]]) {
      prevBottomRow = repositionedBoxes[prev[0]].bottomRow;
    }

    // If the current box's (next) bottomRow is larger than the previous
    // This (next) box is the bottom most above so far
    if (nextBottomRow > prevBottomRow) return [next];
    // If this (next) box's bottom row is the same as the previous
    // We have two bottom most boxes
    else if (nextBottomRow === prevBottomRow) {
      if (
        repositionedBoxes[prev[0]] &&
        repositionedBoxes[prev[0]].bottomRow ===
          repositionedBoxes[prev[0]].topRow
      ) {
        return prev;
      }

      if (
        repositionedBoxes[next] &&
        repositionedBoxes[next].bottomRow === repositionedBoxes[next].topRow
      ) {
        return [next];
      }

      return [...prev, next];
    }
    // This (next) box's bottom row is lower than the boxes selected so far
    // so, we ignore it.
    else return prev;
  }, []);
}
