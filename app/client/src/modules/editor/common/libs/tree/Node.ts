import type { LeafTreeNode, ParentTreeNode, TreeNode } from "./types";

export const isEmptyTreeNode = (node: ParentTreeNode): boolean =>
  node.children.length === 0;

// TYPE GUARDS
export const isParentTreeNode = (node: TreeNode): node is ParentTreeNode =>
  node.isLeaf === false;

export const isLeafTreeNode = (node: TreeNode): node is LeafTreeNode =>
  node.isLeaf;
