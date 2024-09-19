import {
  getDefaultSpaceDistributed,
  reAdjustSpaceDistribution,
  redistributeSectionSpace,
  redistributeSpaceWithDynamicMinWidth,
} from "./spaceRedistributionSagaUtils";

describe("spaceRedistributionUtils", () => {
  describe("redistributeSectionSpace", () => {
    it("should redistribute space among zones in a section", () => {
      const distributedSpace1 = redistributeSectionSpace(
        { zone1Id: 12 },
        ["zone1Id"],
        6,
        1,
      );

      expect(distributedSpace1).toEqual([6, 6]);
    });
  });

  describe("getDefaultSpaceDistributed", () => {
    it("should calculate the default distribution of space among zones", () => {
      const distributedSpaceSingleZone = getDefaultSpaceDistributed([
        "zone1Id",
      ]);

      expect(distributedSpaceSingleZone).toEqual({ zone1Id: 12 });
      const distributedSpaceDoubleZone = getDefaultSpaceDistributed([
        "zone1Id",
        "zone2Id",
      ]);

      expect(distributedSpaceDoubleZone).toEqual({ zone1Id: 6, zone2Id: 6 });
      const distributedSpaceTripleZone = getDefaultSpaceDistributed([
        "zone1Id",
        "zone2Id",
        "zone3Id",
      ]);

      expect(distributedSpaceTripleZone).toEqual({
        zone1Id: 4,
        zone2Id: 4,
        zone3Id: 4,
      });
      const distributedSpaceQuadZone = getDefaultSpaceDistributed([
        "zone1Id",
        "zone2Id",
        "zone3Id",
        "zone4Id",
      ]);

      expect(distributedSpaceQuadZone).toEqual({
        zone1Id: 3,
        zone2Id: 3,
        zone3Id: 3,
        zone4Id: 3,
      });
    });
  });

  describe("redistributeSpaceWithDynamicMinWidth", () => {
    it("should redistribute space within a section while preserving zone ratios and minimum column width", () => {
      const distributedSpace1 = redistributeSpaceWithDynamicMinWidth(
        { zone1Id: 12 },
        ["zone1Id"],
        6,
        1,
      );

      expect(distributedSpace1).toEqual([6, 6]);
      const distributedSpace2 = redistributeSpaceWithDynamicMinWidth(
        { zone1Id: 6, zone2Id: 3, zone3Id: 3 },
        ["zone1Id", "zone2Id", "zone3Id"],
        6,
        1,
      );

      expect(distributedSpace2).toEqual([4, 4, 2, 2]);
      const distributedSpace3 = redistributeSpaceWithDynamicMinWidth(
        { zone1Id: 5, zone2Id: 7 },
        ["zone1Id", "zone2Id"],
        6,
        1,
      );

      expect(distributedSpace3).toEqual([4, 2, 6]);
      const distributedSpace4 = redistributeSpaceWithDynamicMinWidth(
        { zone1Id: 5, zone2Id: 4, zone3Id: 3 },
        ["zone1Id", "zone2Id", "zone3Id"],
        6,
        2,
      );

      expect(distributedSpace4).toEqual([3, 3, 4, 2]);
    });
    it("reAdjustSpaceDistribution should redistribute a uneven distribution", () => {
      // When Space distributed in more than needed
      const updatedDistribution1 = reAdjustSpaceDistribution(
        { zone1Id: 8 },
        ["zone1Id"],
        6,
      );

      expect(updatedDistribution1).toEqual([6]);
      const updatedDistribution2 = reAdjustSpaceDistribution(
        { zone1Id: 10, zone2Id: 2 },
        ["zone1Id", "zone2Id"],
        6,
      );

      expect(updatedDistribution2).toEqual([4, 2]);
      const updatedDistribution3 = reAdjustSpaceDistribution(
        { zone1Id: 4, zone2Id: 2, zone3Id: 3 },
        ["zone1Id", "zone2Id", "zone3Id"],
        7,
      );

      expect(updatedDistribution3).toEqual([3, 2, 2]);
      // When Space distributed in less than needed
      const updatedDistribution4 = reAdjustSpaceDistribution(
        { zone1Id: 3 },
        ["zone1Id"],
        6,
      );

      expect(updatedDistribution4).toEqual([6]);
      const updatedDistribution5 = reAdjustSpaceDistribution(
        { zone1Id: 2, zone2Id: 3 },
        ["zone1Id", "zone2Id"],
        8,
      );

      expect(updatedDistribution5).toEqual([3, 5]);
      const updatedDistribution6 = reAdjustSpaceDistribution(
        { zone1Id: 2, zone2Id: 2, zone3Id: 2 },
        ["zone1Id", "zone2Id", "zone3Id"],
        8,
      );

      expect(updatedDistribution6).toEqual([2, 3, 3]);
    });
  });
});
