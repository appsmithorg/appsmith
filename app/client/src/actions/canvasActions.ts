import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { TreeNode } from "utils/treeManipulationHelpers/dynamicHeightReflow";

export function setDynamicHeightLayoutTree(
  tree: Record<string, TreeNode>,
  canvasLevelMap: Record<string, number>,
) {
  return {
    type: ReduxActionTypes.SET_DYNAMIC_HEIGHT_LAYOUT_TREE,
    payload: { tree, canvasLevelMap },
  };
}
