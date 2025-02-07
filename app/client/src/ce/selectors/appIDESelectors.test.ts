import type { EntityItem } from "ee/IDE/Interfaces/EntityItem";
import { groupAndSortEntitySegmentList } from "./appIDESelectors";
import { PluginType } from "entities/Plugin";

describe("groupAndSortEntitySegmentList", () => {
  it("should group and sort entity segment list alphabetically", () => {
    const items: EntityItem[] = [
      {
        title: "BalanceTransactions",
        type: PluginType.API,
        key: "1",
        group: "Users",
      },
      { title: "AllUsers", type: PluginType.API, key: "2", group: "Users" },
      { title: "Query 1", type: PluginType.SAAS, key: "3", group: "Movies" },
      {
        title: "Query 2",
        type: PluginType.SAAS,
        key: "4",
        group: "Movies",
      },
      {
        title: "Query 3",
        type: PluginType.SAAS,
        key: "5",
        group: "Movies",
      },
      { title: "Random", type: PluginType.API, key: "6" },
    ];

    const result = groupAndSortEntitySegmentList(items);

    // Users, Movies, NA
    expect(result.length).toBe(3);

    // Check sorting of groups alphabetically
    expect(result.map((group) => group.group)).toEqual([
      "Movies",
      "NA",
      "Users",
    ]);

    // Check sorting of items within each group alphabetically
    expect(result[0].items.map((item) => item.title)).toEqual([
      "Query 1",
      "Query 2",
      "Query 3",
    ]);
    expect(result[2].items.map((item) => item.title)).toEqual([
      "AllUsers",
      "BalanceTransactions",
    ]);

    // Check items without group sorted correctly under "NA" group
    expect(result[1].items.map((item) => item.title)).toEqual(["Random"]);
  });

  it("should handle empty input", () => {
    const result = groupAndSortEntitySegmentList([]);

    expect(result).toEqual([]);
  });

  // Add more test cases to cover edge cases or specific scenarios
});
