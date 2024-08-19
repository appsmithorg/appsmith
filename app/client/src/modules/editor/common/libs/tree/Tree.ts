import { isParentTreeNode } from "./Node";
import type { ParentTreeNode, TreeNode } from "./types";

/**
 * @param targetNode The node to add a child to
 * @param node The child node to add
 * @returns The new node with the added child
 */
export const appendChildNode = <TNode extends ParentTreeNode>(
  targetNode: TNode,
  node: TreeNode,
): TNode => ({
  ...targetNode,
  children: [...targetNode.children, node],
});

/**
 * Adds node to the given tree
 *
 * @param rootNode The root node of the tree
 * @param targetNodeId The id of the node to add a child to
 * @param node The child node to add
 * @returns The new tree with the added node
 */
export const addNode = <TNode extends ParentTreeNode>(
  rootNode: TNode,
  targetNodeId: string,
  node: TreeNode,
): TNode => {
  if (rootNode.id === targetNodeId) return appendChildNode(rootNode, node);

  const newChildren = rootNode.children.map((child) => {
    if (!isParentTreeNode(child)) return child;

    return addNode(child, targetNodeId, node);
  });

  return { ...rootNode, children: newChildren };
};

/**
 * Removes node from the given tree
 *
 * @param rootNode The root node of the tree
 * @param nodeId The id of the node to remove
 * @returns The new tree with the removed node
 */
export const removeNode = (
  rootNode: ParentTreeNode,
  nodeId: string,
): ParentTreeNode | null => {
  if (rootNode.id === nodeId) return null;

  const newChildren = rootNode.children
    .map((child) => {
      if (child.id === nodeId) return null;

      if (!isParentTreeNode(child)) return child;

      return removeNode(child, nodeId);
    })
    .filter((child) => child !== null);

  return { ...rootNode, children: newChildren };
};

// TODO: Find a way to infer the type of the returned node
/**
 * Find node in the given tree
 *
 * @param rootNode The root node of the tree
 * @param nodeId The id of the node to find
 * @returns The found node or null
 */
export const findNode = (
  rootNode: ParentTreeNode,
  nodeId: string,
): TreeNode | null => {
  if (rootNode.id === nodeId) return rootNode;

  for (const child of rootNode.children) {
    if (child.id === nodeId) return child;

    if (!isParentTreeNode(child)) continue;

    const node = findNode(child, nodeId);

    if (node) return node;
  }

  return null;
};

/**
 * Move node to the new parent
 *
 * @param rootNode The root node of the tree
 * @param nodeId The id of the node to move
 * @param targetNodeId The id of the node to move to
 * @returns The new tree with the moved node
 */
export const moveNode = (
  rootNode: ParentTreeNode,
  nodeId: string,
  targetNodeId: string,
) => {
  const nodeToMove = findNode(rootNode, nodeId);

  if (!nodeToMove) return rootNode;

  const targetNode = findNode(rootNode, targetNodeId);

  if (!targetNode || targetNode.isLeaf) return rootNode;

  // To move node it first needs to be copied to the new parent
  // and then removed from the old parent
  const updatedRootNode = removeNode(rootNode, nodeId);

  if (!updatedRootNode) return rootNode;

  return addNode(updatedRootNode, targetNodeId, nodeToMove);
};

/**
 * Update node with the new data
 *
 * @param rootNode The root node of the tree
 * @param nodeId The id of the node to update
 * @param data The new data to update the node with
 * @returns The new tree with the updated node
 */
export const updateNode = (
  rootNode: ParentTreeNode,
  nodeId: string,
  data: Partial<TreeNode>,
): ParentTreeNode => {
  const nodeToUpdate = findNode(rootNode, nodeId);

  if (!nodeToUpdate) return rootNode;

  const updatedNode: TreeNode = { ...nodeToUpdate, ...data };

  if (updatedNode.parentId === null) return rootNode;

  const updatedRootNode = removeNode(rootNode, nodeId);

  if (!updatedRootNode) return rootNode;

  return addNode(updatedRootNode, updatedNode.parentId, updatedNode);
};
