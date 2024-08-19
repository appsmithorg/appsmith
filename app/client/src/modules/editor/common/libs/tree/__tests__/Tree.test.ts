import { makeLeafTreeNode, makeParentTreeNode } from "../factories";
import {
  addNode,
  appendChildNode,
  findNode,
  moveNode,
  removeNode,
  updateNode,
} from "../Tree";

describe("appendChildNode", () => {
  it("should append a child node to the empty target node", () => {
    const targetNode = makeParentTreeNode({ children: [] });
    const nodeToAdd = makeLeafTreeNode();

    expect(appendChildNode(targetNode, nodeToAdd).children).toEqual([
      nodeToAdd,
    ]);
  });

  it("should append a child node to the target node with children", () => {
    const childNode = makeLeafTreeNode();
    const targetNode = makeParentTreeNode({ children: [childNode] });
    const nodeToAdd = makeLeafTreeNode();

    expect(appendChildNode(targetNode, nodeToAdd).children).toEqual([
      childNode,
      nodeToAdd,
    ]);
  });
});

describe("addNode", () => {
  it("should return shallow copy of the root node", () => {
    const rootNode = makeParentTreeNode({ children: [] });
    const nodeToAdd = makeLeafTreeNode();

    expect(addNode(rootNode, rootNode.id, nodeToAdd)).not.toBe(rootNode);
  });

  it("should add a node to the root node if it is the target node", () => {
    const childNode = makeLeafTreeNode();
    const rootNode = makeParentTreeNode({ children: [childNode] });
    const nodeToAdd = makeLeafTreeNode();

    expect(addNode(rootNode, rootNode.id, nodeToAdd).children).toEqual([
      childNode,
      nodeToAdd,
    ]);
  });

  it("should add a node to the child node if it is the target node", () => {
    const childNode = makeParentTreeNode({ children: [] });
    const rootNode = makeParentTreeNode({ children: [childNode] });
    const nodeToAdd = makeLeafTreeNode();

    expect(addNode(rootNode, childNode.id, nodeToAdd).children[0]).toEqual({
      ...childNode,
      children: [nodeToAdd],
    });
  });

  it("should return the same tree if the target node is not found", () => {
    const rootNode = makeParentTreeNode({ children: [] });
    const nodeToAdd = makeLeafTreeNode();

    expect(addNode(rootNode, "not-existing-id", nodeToAdd)).toEqual(rootNode);
  });

  it("should return the same tree if the target node is leaf", () => {
    const childNode = makeLeafTreeNode();
    const rootNode = makeParentTreeNode({ children: [childNode] });
    const nodeToAdd = makeLeafTreeNode();

    expect(addNode(rootNode, childNode.id, nodeToAdd).children[0]).toEqual(
      childNode,
    );
  });
});

describe("removeNode", () => {
  it("should return shallow copy of the root node", () => {
    const rootNode = makeParentTreeNode({ children: [] });

    expect(removeNode(rootNode, rootNode.id)).not.toBe(rootNode);
  });

  it("should return null if the root node is the target node", () => {
    const rootNode = makeParentTreeNode({ children: [] });

    expect(removeNode(rootNode, rootNode.id)).toBeNull();
  });

  it("should remove the node from the root node", () => {
    const childNode1 = makeLeafTreeNode();
    const childNode2 = makeLeafTreeNode();
    const rootNode = makeParentTreeNode({ children: [childNode1, childNode2] });

    expect(removeNode(rootNode, childNode1.id)).toEqual({
      ...rootNode,
      children: [childNode2],
    });
  });

  it("should remove the node from the child node", () => {
    const leafNode = makeLeafTreeNode();
    const subNode = makeParentTreeNode({ children: [leafNode] });
    const rootNode = makeParentTreeNode({ children: [subNode] });

    expect(removeNode(rootNode, leafNode.id)?.children[0]).toEqual({
      ...subNode,
      children: [],
    });
  });

  it("should return the same tree if the target node is not found", () => {
    const leafNode = makeLeafTreeNode();
    const subNode = makeParentTreeNode({ children: [leafNode] });
    const rootNode = makeParentTreeNode({ children: [subNode] });

    expect(removeNode(rootNode, "not-existing-id")).toEqual(rootNode);
  });
});

describe("findNode", () => {
  it("should return the root node if it is the target node", () => {
    const rootNode = makeParentTreeNode({ children: [] });

    expect(findNode(rootNode, rootNode.id)).toEqual(rootNode);
  });

  it("should return the child node", () => {
    const leafNode = makeLeafTreeNode();
    const subNode = makeParentTreeNode({ children: [leafNode] });
    const rootNode = makeParentTreeNode({ children: [subNode] });

    expect(findNode(rootNode, leafNode.id)).toBe(leafNode);
  });

  it("should return null if the target node is not found", () => {
    const leafNode = makeLeafTreeNode();
    const subNode = makeParentTreeNode({ children: [leafNode] });
    const rootNode = makeParentTreeNode({ children: [subNode] });

    expect(findNode(rootNode, "not-existing-id")).toBeNull();
  });
});

describe("moveNode", () => {
  it("should return root node if the node to move is not found", () => {
    const leafNode = makeLeafTreeNode();
    const subNode = makeParentTreeNode({ children: [leafNode] });
    const rootNode = makeParentTreeNode({ children: [subNode] });

    expect(moveNode(rootNode, "not-existing-id", subNode.id)).toBe(rootNode);
  });

  it("should return root node if the target node is not found", () => {
    const leafNode = makeLeafTreeNode();
    const subNode = makeParentTreeNode({ children: [leafNode] });
    const rootNode = makeParentTreeNode({ children: [subNode] });

    expect(moveNode(rootNode, leafNode.id, "not-existing-id")).toBe(rootNode);
  });

  it("should return root node if the target node is leaf", () => {
    const leafNode = makeLeafTreeNode();
    const subNode = makeParentTreeNode({ children: [leafNode] });
    const rootNode = makeParentTreeNode({ children: [subNode] });

    expect(moveNode(rootNode, leafNode.id, leafNode.id)).toBe(rootNode);
  });

  it("should move the node between the siblings", () => {
    const leafNode = makeLeafTreeNode();
    const subNode1 = makeParentTreeNode({ children: [leafNode] });
    const subNode2 = makeParentTreeNode({ children: [] });
    const rootNode = makeParentTreeNode({ children: [subNode1, subNode2] });

    expect(moveNode(rootNode, leafNode.id, subNode2.id)).toEqual({
      ...rootNode,
      children: [
        { ...subNode1, children: [] },
        { ...subNode2, children: [leafNode] },
      ],
    });
  });

  it("should move the node between the parent and the child", () => {
    const leafNode = makeLeafTreeNode();
    const subNode = makeParentTreeNode({ children: [leafNode] });
    const rootNode = makeParentTreeNode({ children: [subNode] });

    expect(moveNode(rootNode, leafNode.id, rootNode.id)).toEqual({
      ...rootNode,
      children: [{ ...subNode, children: [] }, leafNode],
    });
  });
});

describe("updateNode", () => {
  it("should return root node if the node to update is not found", () => {
    const leafNode = makeLeafTreeNode();
    const subNode = makeParentTreeNode({ children: [leafNode] });
    const rootNode = makeParentTreeNode({ children: [subNode] });

    expect(updateNode(rootNode, "not-existing-id", {})).toBe(rootNode);
  });

  it("should return root node if the node to update has no parentId", () => {
    const leafNode = makeLeafTreeNode();
    const rootNode = makeParentTreeNode({ children: [leafNode] });

    expect(updateNode(rootNode, leafNode.id, {})).toBe(rootNode);
  });

  it("should update the node", () => {
    const leafNode = makeLeafTreeNode();
    const subNode = makeParentTreeNode({ children: [leafNode] });
    const rootNode = makeParentTreeNode({ children: [subNode] });

    subNode.parentId = rootNode.id;
    leafNode.parentId = subNode.id;

    expect(updateNode(rootNode, leafNode.id, { type: "new-type" })).toEqual({
      ...rootNode,
      children: [
        {
          ...subNode,
          children: [{ ...leafNode, type: "new-type" }],
        },
      ],
    });
  });
});
