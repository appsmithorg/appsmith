import type { TreeNode } from "./types";

/**
 * @param targetNode The node to add a child to
 * @param node The child node to add
 * @returns The new node with the added child
 */
const appendChildNode = <TNode extends TreeNode>(
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
export const addNode = <TNode extends TreeNode>(
  rootNode: TNode,
  targetNodeId: string,
  node: TreeNode,
): TNode => {
  if (rootNode.id === targetNodeId) return appendChildNode(rootNode, node);

  if (rootNode.isLeaf) return rootNode;

  const newChildren = rootNode.children.map((child) =>
    addNode(child, targetNodeId, node),
  );

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
  rootNode: TreeNode,
  nodeId: string,
): TreeNode | null => {
  if (rootNode.id === nodeId) return null;

  const newChildren = rootNode.children
    .map((child) => removeNode(child, nodeId))
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
  rootNode: TreeNode,
  nodeId: string,
): TreeNode | null => {
  if (rootNode.id === nodeId) return rootNode;

  if (rootNode.isLeaf) return null;

  for (const child of rootNode.children) {
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
  rootNode: TreeNode,
  nodeId: string,
  targetNodeId: string,
) => {
  const nodeToMove = findNode(rootNode, nodeId);

  if (!nodeToMove) return rootNode;

  const targetNode = findNode(rootNode, targetNodeId);

  if (!targetNode || targetNode.isLeaf) return rootNode;

  // To move node it first needs to be copied to the new parent
  // and then removed from the old parent
  return removeNode(addNode(rootNode, targetNodeId, nodeToMove), nodeId);
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
  rootNode: TreeNode,
  nodeId: string,
  data: Partial<TreeNode>,
) => {
  const nodeToUpdate = findNode(rootNode, nodeId);

  if (!nodeToUpdate) return rootNode;

  const updatedNode: TreeNode = { ...nodeToUpdate, ...data };

  if (updatedNode.parentId === null) return updatedNode;

  return moveNode(rootNode, nodeId, updatedNode.parentId);
};
