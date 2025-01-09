import type { TreeNode } from "utils/autoHeight/constants";

export interface AutoHeightLayoutTreePayload {
  tree: Record<string, TreeNode>;
  canvasLevelMap: Record<string, number>;
}

export interface AutoHeightLayoutTreeReduxState {
  [widgetId: string]: TreeNode;
}
