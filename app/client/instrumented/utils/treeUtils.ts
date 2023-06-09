type Tree = {
  children?: Tree[];
  [key: string]: any;
};

export const traverseTree = (tree: Tree, callback: (tree: Tree) => void) => {
  callback(tree);
  if (tree.children) {
    tree.children.forEach((b) => traverseTree(b, callback));
  }
};

export const mapTree = (tree: Tree, callback: (tree: Tree) => Tree) => {
  const mapped = callback(tree);
  if (tree.children && tree.children.length) {
    const children: Tree[] = tree.children.map((branch) =>
      mapTree(branch, callback),
    );
    return { ...mapped, children };
  }
  return { ...mapped };
};

/**
 * This function sorts the object's value which is array of string.
 *
 * @param {Record<string, Array<string>>} data
 * @return {*}
 */
export const sortObjectWithArray = (data: Record<string, Array<string>>) => {
  Object.entries(data).map(([key, value]) => {
    data[key] = value.sort();
  });
  return data;
};
