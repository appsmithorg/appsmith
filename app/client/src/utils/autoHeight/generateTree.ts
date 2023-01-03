import { areIntersecting } from "utils/boxHelpers";
import { pushToArray } from "utils/helpers";
import { MAX_BOX_SIZE, NodeSpace, TreeNode } from "./constants";
import { getNearestAbove } from "./helpers";

// This function uses the spaces occupied by sibling boxes and provides us with
// a data structure which defines the relative vertical positioning of the boxes
// in the form of "aboves" and "belows" for each box, which are array of box ids
export function generateTree(
  spaces: NodeSpace[],
  layoutUpdated: boolean,
  previousTree: Record<string, TreeNode>,
): Record<string, TreeNode> {
  // If widget doesn't exist in this DS, this means that its height changes does not effect any other sibling
  spaces.sort((a, b) => {
    //if both are of the same level and previous tree exists, check originalTops
    if (a.top === b.top && previousTree[a.id] && previousTree[b.id]) {
      return (
        previousTree[a.id].originalTopRow - previousTree[b.id].originalTopRow
      );
    }
    return a.top - b.top;
  }); // Sort based on position, top to bottom, so that we know which is above the other
  const _spaces = [...spaces];

  const aboveMap: Record<string, string[]> = {};
  const belowMap: Record<string, string[]> = {};

  const tree: Record<string, TreeNode> = {};

  // For each of the sibling boxes
  for (let i = 0; i < spaces.length; i++) {
    // Get the left most box in the array (Remember: we sorted from top to bottom, so the leftmost will be the top most)
    const _curr = _spaces.shift();
    if (_curr) {
      // Create a reference copy as we need to override the bottom value
      const currentSpace = { ..._curr };
      // Add a randomly large value to the bottom; this will help us know if any box is below this box
      currentSpace.bottom += MAX_BOX_SIZE;
      // For each of the remaining sibling widgets
      for (let j = 0; j < _spaces.length; j++) {
        // Create a reference copy as we need to override the bottom value
        const comparisionSpace = { ..._spaces[j] };
        // Add a randomly large value to the bottom; this will help us know if any box is below this box
        // TODO(abhinav): This addition may not be necessary, as we're only looking to see if these boxes
        // are below the currentSpace
        comparisionSpace.bottom += MAX_BOX_SIZE;
        // Check if comparison space has an overlap with current space
        if (areIntersecting(currentSpace, comparisionSpace)) {
          // If there is an overlap, comparisonSpace is below the current space
          // so, we update the aboveMap and belowMap accordingly
          aboveMap[comparisionSpace.id] = pushToArray(
            currentSpace.id,
            aboveMap[comparisionSpace.id],
          ) as string[];
          belowMap[currentSpace.id] = pushToArray(
            comparisionSpace.id,
            belowMap[currentSpace.id],
          ) as string[];
        }
      }
      // Get the originalTop and originalBottom from the previous tree.
      // This is so that we can get close to the original (user defined) positions of the boxes
      // For example, if box1 increases in size and pushes box2 by 100 rows, while box3 is also above box2
      // When the box1 subsequently decrease by 50 rows, we need to maintain spacing between box3 and box2
      // Otherwise, if box1 happens to go below the bottomRow of box3, box2 will tend to overlap with box3.
      let originalTopRow = previousTree[currentSpace.id]?.originalTopRow;
      let originalBottomRow = previousTree[currentSpace.id]?.originalBottomRow;
      // We also udpate the original if the layout is being updated
      // This happens when the user repositions/resizes boxes
      // If the previousTree doesn't have any originals, we can assume that this is the
      // first time we're generating the tree, hence we need to keep the current top and bottom
      // for subsequent tree generation
      if (originalTopRow === undefined || layoutUpdated) {
        originalTopRow = currentSpace.top;
      }
      if (originalBottomRow === undefined || layoutUpdated) {
        originalBottomRow = currentSpace.bottom - MAX_BOX_SIZE;
      }

      tree[currentSpace.id] = {
        aboves: aboveMap[currentSpace.id] || [],
        belows: belowMap[currentSpace.id] || [],
        topRow: currentSpace.top,
        bottomRow: currentSpace.bottom - MAX_BOX_SIZE,
        originalTopRow,
        originalBottomRow,
        distanceToNearestAbove: 0,
      };
    }
  }

  for (const boxId in tree) {
    // For each box, get the nearest above node
    // Then get the distance between this node and the nearest above
    // We'll try to maintain this distance when reflowing due to auto height
    const nearestAbove = getNearestAbove(tree, boxId, {});
    if (nearestAbove.length > 0) {
      tree[boxId].distanceToNearestAbove =
        tree[boxId].topRow - tree[nearestAbove[0]].bottomRow;
    }
  }

  return tree;
}
