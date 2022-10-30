import { areIntersecting } from "utils/boxHelpers";
import { MAX_BOX_SIZE, NodeSpace, TreeNode } from "./constants";

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
