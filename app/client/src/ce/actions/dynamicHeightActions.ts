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

export function generateDynamicHeightComputationTree(
  shouldCheckContainersForDynamicHeightUpdates: boolean,
) {
  return {
    type: ReduxActionTypes.GENERATE_DYNAMIC_HEIGHT_COMPUTATION_TREE,
    payload: { shouldCheckContainersForDynamicHeightUpdates },
  };
}

export function checkContainersForDynamicHeightUpdate() {
  return {
    type: ReduxActionTypes.CHECK_CONTAINERS_FOR_DYNAMIC_HEIGHT,
  };
}
