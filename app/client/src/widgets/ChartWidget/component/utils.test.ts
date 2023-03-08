import { getSeriesChartData } from "./utils";

describe("getSeriesChartData", () => {
  it("should return 0 in value when some y axis inputs are 0", () => {
    const data = [
      { x: "Jul", y: 3 },
      { x: "Aug", y: 2 },
      { x: "Sep", y: 2 },
      { x: "Oct", y: 0 },
      { x: "Nov", y: 2 },
      { x: "Dec", y: 0 },
      { x: "Jan", y: 1 },
    ];
    const categories = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];

    const result = getSeriesChartData(data, categories);
    const expected = [
      { value: 3 },
      { value: 2 },
      { value: 2 },
      { value: 0 },
      { value: 2 },
      { value: 0 },
      { value: 1 },
    ];

    expect(result).toStrictEqual(expected);
  });
});
