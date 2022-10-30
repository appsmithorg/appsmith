import { TreeNode } from "./constants";

// This function lets us know which boxes are effected by one box changing height
// For example, if box2 is below box1 and box3 is below box2
// box1 will effect box2 and box3.
// function getEffectedBoxes(
//   id: string,
//   tree: Record<string, TreeNode>,
//   effectedBoxes = [],
// ): string[] {
//   const belows = tree[id].belows;
//   // We use the "belows" list for this box id to know which boxes will be effected.
//   // How about uniq(effectedBoxes.concat(belows))?
//   // Or, [...effectedBoxes, ...belows]?
//   // On second thought, this function seems pointless now, earlier
//   // We had a few other details here, but this has since then simplified.
//   belows.forEach((belowId) => {
//     (effectedBoxes as string[]).push(belowId);
//   });
//   return effectedBoxes;
// }

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

  const effectedBoxMap: Record<string, number[]> = {};

  // For each box which has changed height (box delta)
  for (const boxId in delta) {
    // Create an effectedBoxMap, which contains the changes for each of the boxes effected by the delta of this box
    // This is a map, because multiple box deltas can effect one box

    // We simply take all the boxes which are below this box from the tree
    // and add the delta to the effectedBoxMap where the key is the below boxId from the tree
    tree[boxId].belows.forEach((effectedId) => {
      effectedBoxMap[effectedId] = [
        ...(effectedBoxMap[effectedId] || []),
        delta[boxId],
      ];
    });

    // Add this box's delta to the repositioning, as this won't show up in the effectedBoxMap
    repositionedBoxes[boxId] = {
      topRow: tree[boxId].topRow,
      bottomRow: tree[boxId].bottomRow + delta[boxId],
    };
  }

  // Sort the effected box ids, this is to make sure we compute from top to bottom.
  const sortedEffectedBoxIds = Object.keys(effectedBoxMap).sort(
    (a, b) => tree[a].topRow - tree[b].topRow,
  );

  // For each of the boxes which have been effected
  for (const effectedBoxId of sortedEffectedBoxIds) {
    // Get all the above boxes
    const aboves = tree[effectedBoxId].aboves;
    // We're trying to find the nearest boxes above this box

    // This is to make sure that we're taking the nearest aboves' changes into account
    // for this effected box.
    // Note: This also considers any latest changes in the aboves in this reflow computations
    // This is the reason why we can't compute the bottomMostAboves beforehand in generateTree
    const bottomMostAboves: string[] = aboves.reduce(
      (prev: string[], next: string) => {
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
      },
      [],
    );

    let _offset;

    // for each of the bottom most above boxes.
    // Note: There can be more than one if two above widgets have the same bottomrow
    for (const aboveId of bottomMostAboves) {
      // If the above box has been effected by another box change height
      // Or, if this above box itself has changed height
      if (Array.isArray(effectedBoxMap[aboveId]) || delta[aboveId]) {
        // In case the above box has changed heights
        const _aboveOffset = repositionedBoxes[aboveId]
          ? repositionedBoxes[aboveId].bottomRow - tree[aboveId].bottomRow
          : 0;

        // If so far, we haven't got any _offset updates
        // This can happen if this is the first aboveId we're checking
        if (_offset === undefined) _offset = _aboveOffset;

        // Let's take in to account the old spacing between the effected box and bottom most above box
        // when the layout was last updated.
        const oldSpacing =
          tree[effectedBoxId].originalTopRow - tree[aboveId].originalBottomRow;
        // Let's compute the spacing between the effected box and bottom most above box
        const currentSpacing =
          tree[effectedBoxId].topRow - tree[aboveId].bottomRow;

        let negativeOffset = _aboveOffset;
        // If the old spacing is less than current spacing and the offset of the bottom most above,
        // we need to make sure that we're sticking to the original spacing between the bottom most above
        // and the current effected box.
        // Note: This applies only if the offset is negative, which is to say that the box is to move up
        if (oldSpacing < currentSpacing + _aboveOffset) {
          negativeOffset = oldSpacing + _aboveOffset - currentSpacing;
        }

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
        _offset = 0;
      }
    }

    // If _offset is not defined, this means that this box is the topmost box
    if (_offset === undefined) {
      // The effectedBoxId is the topmost box, so the _offset will most likely always be 0
      _offset = effectedBoxMap[effectedBoxId].reduce(
        (prev, next) => prev + next,
        0,
      );
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
