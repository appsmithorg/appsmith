import { TreeNode } from "./constants";

function getEffectedBoxes(
  id: string,
  tree: Record<string, TreeNode>,
  effectedBoxes = [],
): string[] {
  const belows = tree[id].belows;
  belows.forEach((belowId) => {
    (effectedBoxes as string[]).push(belowId);
  });
  return effectedBoxes;
}

export function computeChangeInPositionBasedOnDelta(
  tree: Record<string, TreeNode>,
  delta: Record<string, number>,
): Record<string, { topRow: number; bottomRow: number }> {
  const repositionedBoxes: Record<
    string,
    { topRow: number; bottomRow: number }
  > = {};

  const effectedBoxMap: Record<string, number[]> = {};

  // This is expensive, we need to figure out a better algorithm

  for (const boxId in delta) {
    const effectedIds = getEffectedBoxes(boxId, tree);
    // These effectedIds may not be necessary.
    effectedIds.forEach((effectedId) => {
      effectedBoxMap[effectedId] = [
        ...(effectedBoxMap[effectedId] || []),
        delta[boxId],
      ];
    });
    repositionedBoxes[boxId] = {
      topRow: tree[boxId].topRow,
      bottomRow: tree[boxId].bottomRow + delta[boxId],
    };
  }

  const sortedEffectedBoxIds = Object.keys(effectedBoxMap).sort(
    (a, b) => tree[a].topRow - tree[b].topRow,
  );

  for (const effectedBoxId of sortedEffectedBoxIds) {
    const aboves = tree[effectedBoxId].aboves;
    // We're trying to find the neared boxes above this box
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
        const oldSpacing =
          tree[effectedBoxId].originalTopRow - tree[aboveId].originalBottomRow;
        const currentSpacing =
          tree[effectedBoxId].topRow - tree[aboveId].bottomRow;

        let negativeOffset = _aboveOffset;
        if (oldSpacing < currentSpacing + _aboveOffset) {
          negativeOffset = oldSpacing + _aboveOffset - currentSpacing;
        }

        // Otherwise, we see which change is larger, a previously computed aboveId
        // or this one. we use the larger, because, this is the delta
        // Larger delta means smaller change if the value is negative, moves up less
        // Larger delta means larger change if the value is positive, moves down more
        // The above is so that the widget doesn't accidentally collide with the above widget.
        if (_aboveOffset > 0) _offset = Math.max(_aboveOffset, _offset);
        else if (_aboveOffset < 0) {
          _offset = Math.min(_aboveOffset, _offset, negativeOffset);
        }
      } else {
        // Stick to the widget above.
        _offset = 0;
      }
    }

    // If _offset is not defined, this means that this box is the topmost box
    if (_offset === undefined) {
      // TODO(abhinav): If this is the topmost widget, why does it need the reduce?
      _offset = effectedBoxMap[effectedBoxId].reduce(
        (prev, next) => prev + next,
        0,
      );
    }
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
