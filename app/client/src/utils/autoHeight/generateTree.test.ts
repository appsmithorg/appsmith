import { NodeSpace, TreeNode } from "./constants";
import { generateTree } from "./generateTree";

describe("Generate Auto Height Layout tree", () => {
  it("Does not conflict when only one horizontal edge is the same", () => {
    const input: NodeSpace[] = [
      { left: 0, right: 100, top: 0, bottom: 30, id: "1" },
      { left: 100, top: 0, bottom: 30, right: 120, id: "2" },
    ];
    const previousTree: Record<string, TreeNode> = {};
    const layoutUpdated = false;
    const expected = {
      "1": {
        aboves: [],
        belows: [],
        topRow: 0,
        bottomRow: 30,
        originalBottomRow: 30,
        originalTopRow: 0,
        distanceToNearestAbove: 0,
      },
      "2": {
        aboves: [],
        belows: [],
        topRow: 0,
        bottomRow: 30,
        originalBottomRow: 30,
        originalTopRow: 0,
        distanceToNearestAbove: 0,
      },
    };

    const result = generateTree(input, layoutUpdated, previousTree);

    expect(result).toStrictEqual(expected);
  });

  it("Does conflict when part of the boxes overlap horizontally", () => {
    const input: NodeSpace[] = [
      { left: 0, right: 100, top: 0, bottom: 30, id: "1" },
      { left: 80, top: 40, bottom: 80, right: 120, id: "2" },
    ];
    const previousTree: Record<string, TreeNode> = {};
    const layoutUpdated = false;
    const expected = {
      "1": {
        aboves: [],
        belows: ["2"],
        topRow: 0,
        bottomRow: 30,
        originalBottomRow: 30,
        originalTopRow: 0,
        distanceToNearestAbove: 0,
      },
      "2": {
        aboves: ["1"],
        belows: [],
        topRow: 40,
        bottomRow: 80,
        originalBottomRow: 80,
        originalTopRow: 40,
        distanceToNearestAbove: 10,
      },
    };

    const result = generateTree(input, layoutUpdated, previousTree);

    expect(result).toStrictEqual(expected);
  });

  it("Uses existing originals if available in prevTree when layout hasn't updated", () => {
    const input: NodeSpace[] = [
      { left: 0, right: 100, top: 0, bottom: 30, id: "1" },
      { left: 80, top: 30, bottom: 40, right: 120, id: "2" },
    ];
    const previousTree: Record<string, TreeNode> = {
      "1": {
        aboves: [],
        belows: ["2"],
        topRow: 0,
        bottomRow: 30,
        originalBottomRow: 20,
        originalTopRow: 0,
        distanceToNearestAbove: 0,
      },
      "2": {
        aboves: ["1"],
        belows: [],
        topRow: 30,
        bottomRow: 40,
        originalBottomRow: 30,
        originalTopRow: 20,
        distanceToNearestAbove: 0,
      },
    };
    const layoutUpdated = false;
    const expected = {
      "1": {
        aboves: [],
        belows: ["2"],
        topRow: 0,
        bottomRow: 30,
        originalBottomRow: 20,
        originalTopRow: 0,
        distanceToNearestAbove: 0,
      },
      "2": {
        aboves: ["1"],
        belows: [],
        topRow: 30,
        bottomRow: 40,
        originalBottomRow: 30,
        originalTopRow: 20,
        distanceToNearestAbove: 0,
      },
    };

    const result = generateTree(input, layoutUpdated, previousTree);

    expect(result).toStrictEqual(expected);
  });

  it("Ignores existing originals if available in prevTree when layout has updated", () => {
    const input: NodeSpace[] = [
      { left: 0, right: 100, top: 0, bottom: 30, id: "1" },
      { left: 80, top: 30, bottom: 40, right: 120, id: "2" },
    ];
    const previousTree: Record<string, TreeNode> = {
      "1": {
        aboves: [],
        belows: ["2"],
        topRow: 0,
        bottomRow: 30,
        originalBottomRow: 20,
        originalTopRow: 0,
        distanceToNearestAbove: 0,
      },
      "2": {
        aboves: ["1"],
        belows: [],
        topRow: 30,
        bottomRow: 40,
        originalBottomRow: 30,
        originalTopRow: 20,
        distanceToNearestAbove: 0,
      },
    };
    const layoutUpdated = true;
    const expected = {
      "1": {
        aboves: [],
        belows: ["2"],
        topRow: 0,
        bottomRow: 30,
        originalBottomRow: 30,
        originalTopRow: 0,
        distanceToNearestAbove: 0,
      },
      "2": {
        aboves: ["1"],
        belows: [],
        topRow: 30,
        bottomRow: 40,
        originalBottomRow: 40,
        originalTopRow: 30,
        distanceToNearestAbove: 0,
      },
    };

    const result = generateTree(input, layoutUpdated, previousTree);

    expect(result).toStrictEqual(expected);
  });
});
