import { faker } from "@faker-js/faker";
import type { LeafTreeNode, ParentTreeNode, TreeNode } from "./types";

export const makeTreeNode = (override: Partial<TreeNode> = {}): TreeNode => ({
  id: faker.string.uuid(),
  type: faker.lorem.word(1),
  isLeaf: false,
  parentId: null,
  ...override,
});

export const makeParentTreeNode = (
  override: Partial<ParentTreeNode> = {},
): ParentTreeNode => ({
  id: faker.string.uuid(),
  type: faker.lorem.word(1),
  isLeaf: false,
  parentId: null,
  children: [],
  ...override,
});

export const makeLeafTreeNode = (
  override: Partial<LeafTreeNode> = {},
): LeafTreeNode => ({
  id: faker.string.uuid(),
  type: faker.lorem.word(1),
  isLeaf: true,
  parentId: null,
  ...override,
});
