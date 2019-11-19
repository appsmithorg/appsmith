type Tree = {
  children?: Tree[];
  [key: string]: any;
};

export const traverseTree = (tree: Tree, callback: Function) => {
  callback(tree);
  if (tree.children) {
    tree.children.forEach(b => traverseTree(b, callback));
  }
};

export const mapTree = (tree: Tree, callback: Function) => {
  const mapped = callback(tree);
  if (tree.children && tree.children.length) {
    const children: Tree[] = tree.children.map(branch =>
      mapTree(branch, callback),
    );
    return { ...mapped, children };
  }
  return { ...mapped };
};
