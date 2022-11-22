import { TreeNode } from "./constants";

/**
 *
 * @param tree : Auto Height Layout Tree
 * @param effectedBoxId : Current box in consideration
 * @param aboveId : Above box which may or maynot have changed
 * @param offsetSoFar : Offset of the above box, or changes to be applied so far
 * @returns : The offset expected to be applied to the effectedBoxId. This is how much this box should move
 */
export function getNegativeOffset(
  tree: Record<string, TreeNode>,
  effectedBoxId: string,
  aboveId: string,
  offsetSoFar = 0,
): number {
  if (offsetSoFar <= 0) {
    // Let's take in to account the old spacing between the effected box and bottom most above box
    // when the layout was last updated.
    const oldSpacing =
      tree[effectedBoxId].originalTopRow - tree[aboveId].originalBottomRow;
    // Let's compute the spacing between the effected box and bottom most above box
    const currentSpacing = tree[effectedBoxId].topRow - tree[aboveId].bottomRow;
    // If the old spacing is less than current spacing and the offset of the bottom most above,
    // we need to make sure that we're sticking to the original spacing between the bottom most above
    // and the current effected box.
    // Note: This applies only if the offset is negative, which is to say that the box is to move up
    if (oldSpacing < currentSpacing + offsetSoFar) {
      return oldSpacing + offsetSoFar - currentSpacing;
    }
  }
  return offsetSoFar;
}
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

function getAllEffectedBoxes(
  effectorBoxId: string,
  tree: Record<string, TreeNode>,
  effectedBoxes: string[] = [],
  _processed: { [key: string]: boolean } = {},
): string[] {
  const belows = tree[effectorBoxId].belows;
  belows.forEach((belowId) => {
    if (!_processed[belowId]) {
      getAllEffectedBoxes(belowId, tree, effectedBoxes, _processed);
      (effectedBoxes as string[]).push(belowId);
      _processed[belowId] = true;
    }
  });
  return effectedBoxes;
}

// This function computes the new positions for boxes based on the boxes which have changed height
// delta: a map of boxes with change in heights
// tree: a layout tree which contains the current state of the boxes.
export function computeChangeInPositionBasedOnDelta(
  tree: Record<string, TreeNode>,
  delta: Record<string, number>,
): Record<string, { topRow: number; bottomRow: number }> {
  const repositionedBoxes: Record<
    string,
    { topRow: number; bottomRow: number }
  > = {};

  let effectedBoxes: string[] = [];

  // This value stores all the effectedBoxes that have already been computed,
  // So that it doesn't repeat itself while computing the effectedBoxes
  const _processed = {};

  // For each box which has changed height (box delta)
  for (const boxId in delta) {
    // Create an effectedBoxMap, which contains the changes for each of the boxes effected by the delta of this box
    // This is a map, because multiple box deltas can effect one box

    // We simply take all the boxes which are below this box from the tree
    // and add the delta to the effectedBoxMap where the key is the below boxId from the tree
    effectedBoxes = getAllEffectedBoxes(boxId, tree, effectedBoxes, _processed);

    // Add this box's delta to the repositioning, as this won't show up in the effectedBoxMap
    repositionedBoxes[boxId] = {
      topRow: tree[boxId].topRow,
      bottomRow: tree[boxId].bottomRow + delta[boxId],
    };
  }

  // Sort the effected box ids, this is to make sure we compute from top to bottom.
  const sortedEffectedBoxIds = effectedBoxes.sort(
    (a, b) => tree[a].topRow - tree[b].topRow,
  );

  // For each of the boxes which have been effected
  for (const effectedBoxId of sortedEffectedBoxIds) {
    let _offset = 0;
    const bottomMostAboves = getNearestAbove(
      tree,
      effectedBoxId,
      repositionedBoxes,
    );

    // for each of the bottom most above boxes.
    // Note: There can be more than one if two above widgets have the same bottomrow
    for (const aboveId of bottomMostAboves) {
      // If the above box has been effected by another box change height
      // Or, if this above box itself has changed height
      if (effectedBoxes.includes(aboveId) || delta[aboveId]) {
        // In case the above box has changed heights
        const _aboveOffset = repositionedBoxes[aboveId]
          ? repositionedBoxes[aboveId].bottomRow - tree[aboveId].bottomRow
          : 0;

        // If so far, we haven't got any _offset updates
        // This can happen if this is the first aboveId we're checking
        if (_offset === undefined) _offset = _aboveOffset;

        const negativeOffset = getNegativeOffset(
          tree,
          effectedBoxId,
          aboveId,
          _aboveOffset,
        );

        // If the bottom most above (_aboveOffset), has moved down (either by increasing height and/or due to its above)
        // Let's take the effected boxs' change to be the max of _offset and _aboveOffset
        // The _offset so far will be due to other bottomMostAbove effecting this effected box.
        if (_aboveOffset > 0) _offset = Math.max(_aboveOffset, _offset);
        // If the bottom most above (_aboveOffset) has moved up (either by decreasing height and/or due to its above)
        // Let's take the Min (negative values, so max offset in the upward direction) of the _aboveOffset, _offset, negativeOffset.
        else if (_aboveOffset < 0) {
          _offset = Math.min(_aboveOffset, _offset, negativeOffset);
        }
      } else {
        // Stick to the widget above if the bottomMost above box hasn't changed
        // TODO(abhinav): Here we may want to use the same logic as negativeOffset using originals as done previously.
        // Test this.
        // Let's take in to account the old spacing between the effected box and bottom most above box
        // when the layout was last updated.
        const negativeOffset = getNegativeOffset(tree, effectedBoxId, aboveId);
        _offset = negativeOffset;
      }
    }

    // Finally update the repositioned box with the _offset.
    if (repositionedBoxes[effectedBoxId]) {
      repositionedBoxes[effectedBoxId].bottomRow += _offset;
      repositionedBoxes[effectedBoxId].topRow += _offset;
    } else {
      repositionedBoxes[effectedBoxId] = {
        topRow: tree[effectedBoxId].topRow + _offset,
        bottomRow: tree[effectedBoxId].bottomRow + _offset,
      };
    }
  }

  return repositionedBoxes;
}
