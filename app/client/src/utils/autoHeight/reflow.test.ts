import { TreeNode } from "./constants";
import { computeChangeInPositionBasedOnDelta } from "./reflow";

describe("reflow", () => {
  describe("computeChangeInPositionBasedOnDelta (should compute new positions for boxes based on boxes which has changed heights)", () => {
    it("simple 2 boxes test where the top grows by 5 rows and should shifts the bottom one by 5 rows", () => {
      const box1TopRow = 10;
      const box1BottomRow = 20;

      const box2TopRow = 30;
      const box2BottomRow = 40;

      const tree: Record<string, TreeNode> = {
        "1": {
          aboves: [],
          belows: ["2"],
          topRow: box1TopRow,
          bottomRow: box1BottomRow,
          originalTopRow: box1TopRow,
          originalBottomRow: box1BottomRow,
        },
        "2": {
          aboves: ["1"],
          belows: [],
          topRow: box2TopRow,
          bottomRow: box2BottomRow,
          originalTopRow: box2TopRow,
          originalBottomRow: box2BottomRow,
        },
      };

      const box1DeltaHeightIncrease = 5;

      const delta: Record<string, number> = {
        "1": box1DeltaHeightIncrease,
      };

      const expectedChanges = {
        "1": {
          topRow: box1TopRow,
          bottomRow: box1BottomRow + box1DeltaHeightIncrease,
        },
        "2": {
          topRow: box2TopRow + box1DeltaHeightIncrease,
          bottomRow: box2BottomRow + box1DeltaHeightIncrease,
        },
      };

      const changes = computeChangeInPositionBasedOnDelta(tree, delta);

      expect(expectedChanges).toMatchObject(changes);
    });
  });
});
