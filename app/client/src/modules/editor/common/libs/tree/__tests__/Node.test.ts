import { makeLeafTreeNode, makeParentTreeNode } from "../factories";
import { isEmptyTreeNode, isLeafTreeNode, isParentTreeNode } from "../Node";

describe("isEmptyTreeNode", () => {
  it("should return true if Node is empty", () => {
    const node = makeParentTreeNode({ children: [] });

    expect(isEmptyTreeNode(node)).toBe(true);
  });

  it("should return false if Node is not empty", () => {
    const node = makeParentTreeNode({ children: [makeLeafTreeNode()] });

    expect(isEmptyTreeNode(node)).toBe(false);
  });
});

describe("isParentTreeNode", () => {
  it("should return true if Node is a ParentTreeNode", () => {
    const node = makeParentTreeNode();

    expect(isParentTreeNode(node)).toBe(true);
  });

  it("should return false if Node is not a ParentTreeNode", () => {
    const node = makeLeafTreeNode();

    expect(isParentTreeNode(node)).toBe(false);
  });
});

describe("isLeafTreeNode", () => {
  it("should return true if Node is a LeafTreeNode", () => {
    const node = makeLeafTreeNode();

    expect(isLeafTreeNode(node)).toBe(true);
  });

  it("should return false if Node is not a LeafTreeNode", () => {
    const node = makeParentTreeNode();

    expect(isLeafTreeNode(node)).toBe(false);
  });
});
