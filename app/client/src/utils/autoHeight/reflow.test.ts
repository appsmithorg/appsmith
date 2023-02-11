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
          distanceToNearestAbove: 0,
        },
        "2": {
          aboves: ["1"],
          belows: [],
          topRow: box2TopRow,
          bottomRow: box2BottomRow,
          originalTopRow: box2TopRow,
          originalBottomRow: box2BottomRow,
          distanceToNearestAbove: 10,
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

    it("When delta is negative, the original spacing is maintained", () => {
      const box1TopRow = 10;
      const box1BottomRow = 100;
      const box1OriginalTopRow = 10;
      const box1OriginalBottomRow = 20;

      const box2TopRow = 110;
      const box2BottomRow = 200;
      const box2OriginalTopRow = 30;
      const box2OriginalBottomRow = 40;

      const tree: Record<string, TreeNode> = {
        "1": {
          aboves: [],
          belows: ["2"],
          topRow: box1TopRow,
          bottomRow: box1BottomRow,
          originalTopRow: box1OriginalTopRow,
          originalBottomRow: box1OriginalBottomRow,
          distanceToNearestAbove: 0,
        },
        "2": {
          aboves: ["1"],
          belows: [],
          topRow: box2TopRow,
          bottomRow: box2BottomRow,
          originalTopRow: box2OriginalTopRow,
          originalBottomRow: box2OriginalBottomRow,
          distanceToNearestAbove: 10,
        },
      };

      const box1DeltaHeight = -50;

      const delta: Record<string, number> = {
        "1": box1DeltaHeight,
        "2": box1DeltaHeight,
      };

      const expectedChanges = {
        "1": {
          topRow: box1TopRow,
          bottomRow: box1BottomRow + box1DeltaHeight,
        },
        "2": {
          topRow: 60,
          bottomRow: 100,
        },
      };

      const changes = computeChangeInPositionBasedOnDelta(tree, delta);

      expect(expectedChanges).toMatchObject(changes);
    });
    it("When delta is negative, bottom box moves up", () => {
      const box1TopRow = 10;
      const box1BottomRow = 100;
      const box1OriginalTopRow = 10;
      const box1OriginalBottomRow = 15;

      const box2TopRow = 140;
      const box2BottomRow = 230;
      const box2OriginalTopRow = 30;
      const box2OriginalBottomRow = 40;

      const tree: Record<string, TreeNode> = {
        "1": {
          aboves: [],
          belows: ["2"],
          topRow: box1TopRow,
          bottomRow: box1BottomRow,
          originalTopRow: box1OriginalTopRow,
          originalBottomRow: box1OriginalBottomRow,
          distanceToNearestAbove: 0,
        },
        "2": {
          aboves: ["1"],
          belows: [],
          topRow: box2TopRow,
          bottomRow: box2BottomRow,
          originalTopRow: box2OriginalTopRow,
          originalBottomRow: box2OriginalBottomRow,
          distanceToNearestAbove: 40,
        },
      };

      const box1DeltaHeight = -50;

      const delta: Record<string, number> = {
        "1": box1DeltaHeight,
        "2": box1DeltaHeight,
      };

      const expectedChanges = {
        "1": {
          topRow: box1TopRow,
          bottomRow: box1BottomRow + box1DeltaHeight,
        },
        "2": {
          topRow: 90,
          bottomRow: 130,
        },
      };

      const changes = computeChangeInPositionBasedOnDelta(tree, delta);

      expect(expectedChanges).toMatchObject(changes);
    });
    it("When a widget is blocking and delta is negative, bottom box moves up to the original spacing between the blocking box and the bottom box", () => {
      const box1TopRow = 10;
      const box1BottomRow = 100;
      const box1OriginalTopRow = 10;
      const box1OriginalBottomRow = 15;

      const box2TopRow = 140;
      const box2BottomRow = 230;
      const box2OriginalTopRow = 30;
      const box2OriginalBottomRow = 40;

      const box3 = {
        aboves: [],
        belows: ["2"],
        topRow: 50,
        bottomRow: 120,
        originalBottomRow: 20,
        originalTopRow: 10,
        distanceToNearestAbove: 0,
      };

      const tree: Record<string, TreeNode> = {
        "1": {
          aboves: [],
          belows: ["2"],
          topRow: box1TopRow,
          bottomRow: box1BottomRow,
          originalTopRow: box1OriginalTopRow,
          originalBottomRow: box1OriginalBottomRow,
          distanceToNearestAbove: 0,
        },
        "2": {
          aboves: ["1", "3"],
          belows: [],
          topRow: box2TopRow,
          bottomRow: box2BottomRow,
          originalTopRow: box2OriginalTopRow,
          originalBottomRow: box2OriginalBottomRow,
          distanceToNearestAbove: 20,
        },
        "3": box3,
      };

      const box1DeltaHeight = -50;

      const delta: Record<string, number> = {
        "1": box1DeltaHeight,
        "2": box1DeltaHeight,
      };

      const expectedChanges = {
        "1": {
          topRow: box1TopRow,
          bottomRow: box1BottomRow + box1DeltaHeight,
        },
        "2": {
          topRow: 140,
          bottomRow: 180,
        },
      };

      const changes = computeChangeInPositionBasedOnDelta(tree, delta);

      expect(expectedChanges).toMatchObject(changes);
    });
  });
});
