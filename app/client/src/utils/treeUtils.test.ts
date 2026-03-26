import { traverseTree, mapTree, sortObjectWithArray } from "./treeUtils";

describe("treeUtils", () => {
  describe("traverseTree", () => {
    it("should call callback for a single node tree", () => {
      const tree = { name: "root" };
      const callback = jest.fn();

      traverseTree(tree, callback);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(tree);
    });

    it("should traverse a tree with children", () => {
      const tree = {
        name: "root",
        children: [{ name: "child1" }, { name: "child2" }],
      };
      const callback = jest.fn();

      traverseTree(tree, callback);

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenNthCalledWith(1, tree);
      expect(callback).toHaveBeenNthCalledWith(2, { name: "child1" });
      expect(callback).toHaveBeenNthCalledWith(3, { name: "child2" });
    });

    it("should traverse a deeply nested tree", () => {
      const tree = {
        name: "root",
        children: [
          {
            name: "child1",
            children: [{ name: "grandchild1" }, { name: "grandchild2" }],
          },
          { name: "child2" },
        ],
      };
      const callback = jest.fn();

      traverseTree(tree, callback);

      expect(callback).toHaveBeenCalledTimes(5);
      expect(callback).toHaveBeenNthCalledWith(1, { name: "root", children: expect.any(Array) });
      expect(callback).toHaveBeenNthCalledWith(2, { name: "child1", children: expect.any(Array) });
      expect(callback).toHaveBeenNthCalledWith(3, { name: "grandchild1" });
      expect(callback).toHaveBeenNthCalledWith(4, { name: "grandchild2" });
      expect(callback).toHaveBeenNthCalledWith(5, { name: "child2" });
    });

    it("should handle empty children array", () => {
      const tree = {
        name: "root",
        children: [],
      };
      const callback = jest.fn();

      traverseTree(tree, callback);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should handle tree without children property", () => {
      const tree = { name: "root" };
      const callback = jest.fn();

      traverseTree(tree, callback);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should allow callback to access node properties", () => {
      const tree = {
        name: "root",
        value: 10,
        children: [{ name: "child", value: 20 }],
      };
      const names: string[] = [];

      traverseTree(tree, (node) => {
        names.push(node.name);
      });

      expect(names).toEqual(["root", "child"]);
    });

    it("should handle complex tree structures", () => {
      const tree = {
        id: 1,
        data: { label: "Root" },
        children: [
          {
            id: 2,
            data: { label: "Child 1" },
            children: [{ id: 3, data: { label: "Grandchild" } }],
          },
          {
            id: 4,
            data: { label: "Child 2" },
          },
        ],
      };
      const ids: number[] = [];

      traverseTree(tree, (node) => {
        ids.push(node.id);
      });

      expect(ids).toEqual([1, 2, 3, 4]);
    });
  });

  describe("mapTree", () => {
    it("should map a single node tree", () => {
      const tree = { name: "root", value: 1 };
      const callback = (node: any) => ({ ...node, mapped: true });

      const result = mapTree(tree, callback);

      expect(result).toEqual({ name: "root", value: 1, mapped: true });
    });

    it("should map a tree with children", () => {
      const tree = {
        name: "root",
        children: [{ name: "child1" }, { name: "child2" }],
      };
      const callback = (node: any) => ({ ...node, visited: true });

      const result = mapTree(tree, callback);

      expect(result).toEqual({
        name: "root",
        visited: true,
        children: [
          { name: "child1", visited: true },
          { name: "child2", visited: true },
        ],
      });
    });

    it("should map a deeply nested tree", () => {
      const tree = {
        name: "root",
        children: [
          {
            name: "child1",
            children: [{ name: "grandchild" }],
          },
        ],
      };
      const callback = (node: any) => ({
        ...node,
        level: node.name.split("").length,
      });

      const result = mapTree(tree, callback);

      expect(result).toEqual({
        name: "root",
        level: 4,
        children: [
          {
            name: "child1",
            level: 6,
            children: [{ name: "grandchild", level: 10 }],
          },
        ],
      });
    });

    it("should not modify the original tree", () => {
      const tree = {
        name: "root",
        children: [{ name: "child" }],
      };
      const originalTree = JSON.stringify(tree);

      mapTree(tree, (node: any) => ({ ...node, modified: true }));

      expect(JSON.stringify(tree)).toBe(originalTree);
    });

    it("should handle empty children array", () => {
      const tree = {
        name: "root",
        children: [],
      };
      const callback = (node: any) => ({ ...node, processed: true });

      const result = mapTree(tree, callback);

      expect(result).toEqual({
        name: "root",
        processed: true,
        children: [],
      });
    });

    it("should handle tree without children property", () => {
      const tree = { name: "root", value: 42 };
      const callback = (node: any) => ({ ...node, doubled: node.value * 2 });

      const result = mapTree(tree, callback);

      expect(result).toEqual({ name: "root", value: 42, doubled: 84 });
    });

    it("should handle complex transformations", () => {
      const tree = {
        id: 1,
        children: [
          { id: 2, children: [{ id: 4 }] },
          { id: 3 },
        ],
      };
      const callback = (node: any) => ({ nodeId: node.id });

      const result = mapTree(tree, callback);

      expect(result).toEqual({
        nodeId: 1,
        children: [
          { nodeId: 2, children: [{ nodeId: 4 }] },
          { nodeId: 3 },
        ],
      });
    });
  });

  describe("sortObjectWithArray", () => {
    it("should sort array values for each key", () => {
      const data = {
        key1: ["c", "a", "b"],
        key2: ["z", "x", "y"],
      };

      const result = sortObjectWithArray(data);

      expect(result.key1).toEqual(["a", "b", "c"]);
      expect(result.key2).toEqual(["x", "y", "z"]);
    });

    it("should handle already sorted arrays", () => {
      const data = {
        key: ["a", "b", "c"],
      };

      const result = sortObjectWithArray(data);

      expect(result.key).toEqual(["a", "b", "c"]);
    });

    it("should handle empty arrays", () => {
      const data = {
        key: [],
      };

      const result = sortObjectWithArray(data);

      expect(result.key).toEqual([]);
    });

    it("should handle multiple keys", () => {
      const data = {
        letters: ["b", "a", "c"],
        numbers: ["3", "1", "2"],
        mixed: ["z", "a", "m"],
      };

      const result = sortObjectWithArray(data);

      expect(result.letters).toEqual(["a", "b", "c"]);
      expect(result.numbers).toEqual(["1", "2", "3"]);
      expect(result.mixed).toEqual(["a", "m", "z"]);
    });

    it("should handle single element arrays", () => {
      const data = {
        key: ["only"],
      };

      const result = sortObjectWithArray(data);

      expect(result.key).toEqual(["only"]);
    });

    it("should handle numeric string sorting (lexicographic)", () => {
      const data = {
        numbers: ["10", "2", "1", "20"],
      };

      const result = sortObjectWithArray(data);

      // String sorting is lexicographic, not numeric
      expect(result.numbers).toEqual(["1", "10", "2", "20"]);
    });

    it("should modify the original object", () => {
      const data = {
        key: ["c", "a", "b"],
      };

      sortObjectWithArray(data);

      // The function modifies the original object
      expect(data.key).toEqual(["a", "b", "c"]);
    });

    it("should return the same object reference", () => {
      const data = {
        key: ["b", "a"],
      };

      const result = sortObjectWithArray(data);

      expect(result).toBe(data);
    });

    it("should handle empty object", () => {
      const data = {};

      const result = sortObjectWithArray(data);

      expect(result).toEqual({});
    });

    it("should handle case-sensitive sorting", () => {
      const data = {
        mixed: ["B", "a", "C", "b"],
      };

      const result = sortObjectWithArray(data);

      // Default string sort is case-sensitive (uppercase comes before lowercase)
      expect(result.mixed).toEqual(["B", "C", "a", "b"]);
    });
  });
});