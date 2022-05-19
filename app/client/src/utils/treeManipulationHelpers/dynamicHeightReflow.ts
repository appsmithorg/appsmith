import boxIntersect from "box-intersect";

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
  const boxes: Box[] = spaces.map((space) => [
    space.left,
    space.top,
    space.right,
    space.bottom + MAX_BOX_SIZE,
  ]);

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

function getOverlapMap(arr: [number, number][]) {
  // Iteration 1
  arr.sort((a, b) => a[0] - b[0]); // this might not be necessary, as boxIntersect returns sorted entries

  const belowMap: Record<string, number[]> = {};
  const aboveMap: Record<string, number[]> = {};
  const skiplist: Record<string, number[]> = {};
  // Iteration 2
  for (let i = arr.length - 1; i >= 0; i--) {
    const left = arr[i][0];
    const right = arr[i][1];

    // Right should not exist in skilist of left
    // Add map of right into skiplist of left
    // Add right to map of left
    // Remove all entries from map of right added to map of left
    if (skiplist[left] && skiplist[left].indexOf(right) > -1) continue;
    if (belowMap[right] && belowMap[right].length > 0) {
      skiplist[left] = [
        ...(skiplist[left] || []),
        ...belowMap[right],
        ...(skiplist[right] || []),
      ];
    }

    belowMap[left] = [...(belowMap[left] || []), right];
    aboveMap[right] = [...(aboveMap[right] || []), left];
    // Iteration 3
    // Remove entries from the map, if they exist in one of the belowMap entries
    belowMap[left] = (belowMap[left] || []).filter(
      (entry) => (skiplist[left] || []).indexOf(entry) === -1,
    );
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
    (effectedWidgets as string[]) = (effectedWidgets as string[]).concat(
      getEffectedWidgets(belowId, tree, effectedWidgets),
    );
    (effectedWidgets as string[]).push(belowId);
    console.log("Dynamic height, getting effected widgets:", {
      belows,
      belowId,
      effectedWidgets,
    });
  });
  return effectedWidgets;
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
  // Iteration 1 (O(n)) - n is the number of widgets changed
  for (const boxId in delta) {
    // Iteration 2 (O(m*m) - m is the depth and breadth of the children in this node)
    const effectedIds = getEffectedWidgets(boxId, tree);
    effectedIds.forEach((effectedId) => {
      effectedBoxMap[effectedId] = [
        ...(effectedBoxMap[effectedId] || []),
        delta[boxId],
      ];
    });
  }

  // Iteration 3 (O(o) - o is the number of effected widgets)
  for (const effectedBoxId in effectedBoxMap) {
    repositionedBoxes[effectedBoxId] = {
      topRow:
        tree[effectedBoxId].topRow +
        effectedBoxMap[effectedBoxId].reduce((prev, next) => prev + next, 0),
      bottomRow:
        tree[effectedBoxId].bottomRow +
        effectedBoxMap[effectedBoxId].reduce((prev, next) => prev + next, 0),
    };
  }

  // Iteration 4 (O(n) - n is the number of widgets changed)
  for (const boxId in delta) {
    const hasAlreadyRepositioned = !!repositionedBoxes[boxId];
    const existingBottomRow = hasAlreadyRepositioned
      ? repositionedBoxes[boxId].bottomRow
      : tree[boxId].bottomRow;
    if (!hasAlreadyRepositioned) {
      repositionedBoxes[boxId] = {
        bottomRow: existingBottomRow + delta[boxId],
        topRow: tree[boxId].topRow,
      };
    } else {
      repositionedBoxes[boxId].bottomRow = existingBottomRow + delta[boxId];
    }
  }

  console.log("Dynamic Height computing delta:", {
    delta,
    repositionedBoxes,
    tree,
  });

  // Worst case scenario : O((n*m*m) + o + n)
  // Looks like, I have forgotten most of the bigO stuff.
  return repositionedBoxes;
}
