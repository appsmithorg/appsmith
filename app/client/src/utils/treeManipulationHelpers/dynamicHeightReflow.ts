import log from "loglevel";
import { areIntersecting } from "utils/WidgetPropsUtils";

export type TreeNode = {
  aboves: string[];
  belows: string[];
  topRow: number;
  bottomRow: number;
  originalTopRow: number;
  originalBottomRow: number;
};

type NodeSpace = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  originalBottom: number;
  originalTop: number;
  id: string;
};
const MAX_BOX_SIZE = 20000;

// Takes all siblings and arranges them in a structure to figure out
// Which widgets could affect their sibling positions based on changes in height
export function generateTree(
  spaces: NodeSpace[],
  layoutUpdated: boolean,
  previousTree: Record<string, TreeNode>,
): Record<string, TreeNode> {
  // If widget doesn't exist in this DS, this means that its height changes does not effect any other sibling
  spaces.sort((a, b) => a.top - b.top); // Sort based on position, top to bottom
  const _spaces = [...spaces];

  const aboveMap: Record<string, string[]> = {};
  const belowMap: Record<string, string[]> = {};
  for (let i = 0; i < spaces.length - 1; i++) {
    const _curr = _spaces.shift();
    if (_curr) {
      const currentSpace = { ..._curr };
      currentSpace.bottom += MAX_BOX_SIZE;
      for (let j = 0; j < _spaces.length; j++) {
        const comparisionSpace = { ..._spaces[j] };
        comparisionSpace.bottom += MAX_BOX_SIZE;
        if (areIntersecting(currentSpace, comparisionSpace)) {
          aboveMap[comparisionSpace.id] = [
            ...(aboveMap[comparisionSpace.id] || []),
            currentSpace.id,
          ];
          belowMap[currentSpace.id] = [
            ...(belowMap[currentSpace.id] || []),
            comparisionSpace.id,
          ];
        }
      }
    }
  }

  const tree: Record<string, TreeNode> = {};
  for (let i = 0; i < spaces.length; i++) {
    const space = spaces[i];
    const bottomRow = Math.floor(space.bottom);
    const topRow = Math.floor(space.top);
    let originalTopRow = previousTree[space.id]?.originalTopRow;
    let originalBottomRow = previousTree[space.id]?.originalBottomRow;
    if (originalTopRow === undefined || layoutUpdated) {
      originalTopRow = topRow;
    }
    if (originalBottomRow === undefined || layoutUpdated) {
      originalBottomRow = bottomRow;
    }

    tree[space.id] = {
      aboves: aboveMap[space.id] || [],
      belows: belowMap[space.id] || [],
      topRow,
      bottomRow,
      originalTopRow,
      originalBottomRow,
    };
  }

  return tree;
}

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

// TODO: DEBUG(abhinav): This probably doesn't take in to account the following:
// 1. Widgets which block widgets from moving up. For example, if one widget reduces height, the widget below
// can move up, but what if another widget is in parallel to the first widget which blocks this widget?
export function computeChangeInPositionBasedOnDelta(
  tree: Record<string, TreeNode>,
  delta: Record<string, number>,
): Record<string, { topRow: number; bottomRow: number }> {
  const start = performance.now();
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

  log.debug(
    "Dynamic Height: Reflow computations took:",
    performance.now() - start,
    "ms",
  );
  return repositionedBoxes;
}
