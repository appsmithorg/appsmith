import { resolveAreaDimensions } from "./resolveAreaDimensions";

describe("resolveAreaDimensions", () => {
  const columns = [50, 100, 200, 300, 350];
  const totalWidth = columns.reduce((acc, width) => acc + width, 0);

  test.each([
    [
      "single row",
      {
        areas: [["sidebar", "left", "code", "canvas", "right"]],
        columns: columns,
        rows: [50],
        result: {
          sidebar: { height: 50, width: 50 },
          left: { height: 50, width: 100 },
          code: { height: 50, width: 200 },
          canvas: { height: 50, width: 300 },
          right: { height: 50, width: 350 },
        },
      },
    ],
    [
      "two rows",
      {
        areas: [
          ["header", "header", "header", "header", "header"],
          ["sidebar", "left", "code", "canvas", "right"],
        ],
        columns: columns,
        rows: [50, 500],
        result: {
          header: { height: 50, width: totalWidth },
          sidebar: { height: 500, width: 50 },
          left: { height: 500, width: 100 },
          code: { height: 500, width: 200 },
          canvas: { height: 500, width: 300 },
          right: { height: 500, width: 350 },
        },
      },
    ],
    [
      "multiple rows",
      {
        areas: [
          ["sidebar", "header", "header", "header", "header"],
          ["sidebar", "center", "center", "canvas", "right"],
          ["sidebar", "center", "center", "canvas", "right"],
          ["sidebar", "footer", "footer", "footer", "footer"],
        ],
        columns: [100, 100, 100, 100, 100],
        rows: [50, 250, 250, 50],
        result: {
          header: { height: 50, width: 400 },
          sidebar: { height: 600, width: 100 },
          center: { height: 500, width: 200 },
          canvas: { height: 500, width: 100 },
          right: { height: 500, width: 100 },
          footer: { height: 50, width: 400 },
        },
      },
    ],
  ])("%s", (_, { result, ...params }) => {
    expect(resolveAreaDimensions(params)).toEqual(result);
  });
});
