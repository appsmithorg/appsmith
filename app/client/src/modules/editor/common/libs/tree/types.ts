export interface TreeNode<TType extends string = string> {
  id: string;
  type: TType;
  isLeaf: boolean;
  parentId: string | null;
  // children: TreeNode[];
}

export interface ParentTreeNode<TType extends string = string>
  extends TreeNode<TType> {
  isLeaf: false;
  children: TreeNode[];
}

export interface LeafTreeNode<TType extends string = string>
  extends TreeNode<TType> {
  isLeaf: true;
  // children: never;
}

export type Tree = TreeNode;
