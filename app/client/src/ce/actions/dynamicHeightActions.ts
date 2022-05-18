import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { TreeNode } from "utils/treeManipulationHelpers/dynamicHeightReflow";

export function storeDynamicHeightLayoutTreeAction(
  tree: Record<string, TreeNode>,
) {
  return {
    type: ReduxActionTypes.SET_DYNAMIC_HEIGHT_LAYOUT_TREE,
    payload: tree,
  };
}
