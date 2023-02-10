import { TreeNode } from "./constants";
import { getNearestAbove } from "./helpers";

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
        // If we have the above repositioned
        if (repositionedBoxes[aboveId]) {
          // Get the new expected top row of this effectedBox
          const newTopRow =
            repositionedBoxes[aboveId].bottomRow +
            tree[effectedBoxId].distanceToNearestAbove;
          // Get the offset this effectedBox needs to consider moving
          _offset = newTopRow - tree[effectedBoxId].topRow;
        } else {
          // Since the above hasn't changed, don't change this.
          _offset = 0;
        }
      } else {
        // Maintain distance from the bottom most above.
        const newTopRow =
          tree[aboveId].bottomRow + tree[effectedBoxId].distanceToNearestAbove;
        _offset = newTopRow - tree[effectedBoxId].topRow;
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
