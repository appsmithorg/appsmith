import boxIntersect from "box-intersect";
// import { difference } from "lodash";
import log from "loglevel";

export type TreeNode = {
  aboves: string[];
  belows: string[];
  topRow: number;
  bottomRow: number;
};

type NodeSpace = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  id: string;
};
type Box = [number, number, number, number];
const MAX_BOX_SIZE = 20000;

// Takes all siblings and arranges them in a structure to figure out
// Which widgets could affect their sibling positions based on changes in height
export function generateTree(spaces: NodeSpace[]): Record<string, TreeNode> {
  // If widget doesn't exist in this DS, this means that its height changes does not effect any other sibling
  spaces.sort((a, b) => a.top - b.top); // Sort based on position, top to bottom
  const boxes: Box[] = spaces.map((space) => [
    space.left,
    space.top,
    space.right,
    space.bottom + MAX_BOX_SIZE,
  ]);

  // boxes.sort((a, b) => a[1] - b[1]);

  const overlaps = boxIntersect(boxes);

  const { aboveMap, belowMap } = getOverlapMap(overlaps);

  const tree: Record<string, TreeNode> = {};
  for (let i = 0; i < spaces.length; i++) {
    const space = spaces[i];
    tree[space.id] = {
      aboves: (aboveMap[i] || []).map((id) => spaces[id].id),
      belows: (belowMap[i] || []).map((id) => spaces[id].id),
      topRow: space.top,
      bottomRow: space.bottom,
    };
  }

  return tree;
}

// Gets a list of widgets below and above for each widget
// Namely, the belowMap and aboveMap respectively.
function getOverlapMap(arr: [number, number][]) {
  const belowMap: Record<string, number[]> = {};
  const aboveMap: Record<string, number[]> = {};

  // Iteration 1
  for (let i = 0; i < arr.length; i++) {
    const overlap = arr[i];
    if (overlap[0] > overlap[1]) {
      belowMap[overlap[1]] = [...(belowMap[overlap[1]] || []), overlap[0]];
      aboveMap[overlap[0]] = [...(aboveMap[overlap[0]] || []), overlap[1]];
    } else {
      aboveMap[overlap[1]] = [...(aboveMap[overlap[1]] || []), overlap[0]];
      belowMap[overlap[0]] = [...(belowMap[overlap[0]] || []), overlap[1]];
    }
  }
  return { belowMap, aboveMap };
}

function getEffectedWidgets(
  id: string,
  tree: Record<string, TreeNode>,
  effectedWidgets = [],
): string[] {
  const belows = tree[id].belows;
  belows.forEach((belowId) => {
    (effectedWidgets as string[]).push(belowId);
  });
  return effectedWidgets;
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
    const effectedIds = getEffectedWidgets(boxId, tree);
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
    (a, b) => tree[a].bottomRow - tree[b].bottomRow,
  );

  for (const effectedBoxId of sortedEffectedBoxIds) {
    const aboves = tree[effectedBoxId].aboves;
    const bottomMostAboves: string[] = aboves.reduce(
      (prev: string[], next: string) => {
        if (!prev[0]) return [next];
        let nextBottomRow = tree[next].bottomRow;
        let prevBottomRow = tree[prev[0]].bottomRow;
        if (repositionedBoxes[next]) {
          nextBottomRow = repositionedBoxes[next].bottomRow;
        }
        if (repositionedBoxes[prev[0]]) {
          prevBottomRow = repositionedBoxes[prev[0]].bottomRow;
        }
        if (nextBottomRow > prevBottomRow) return [next];
        else if (nextBottomRow === prevBottomRow) return [...prev, next];
        else return prev;
      },
      [],
    );
    let _offset;

    for (const aboveId of bottomMostAboves) {
      if (Array.isArray(effectedBoxMap[aboveId]) || delta[aboveId]) {
        const _aboveOffset =
          repositionedBoxes[aboveId].bottomRow - tree[aboveId].bottomRow;
        if (_offset === undefined) _offset = _aboveOffset;
        _offset = Math.max(_aboveOffset, _offset);
      } else {
        _offset = 0;
      }
    }
    if (_offset === undefined) {
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
