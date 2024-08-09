import type { AnimatedGridUnit } from "../types";
import { resolveAreasVisibility } from "./resolveAreasVisibility";

describe("resolveAreasVisibility", () => {
  test.each([
    [
      "single row",
      {
        areas: [["sidebar", "left", "code", "canvas", "right"]],
        columns: ["50px", "0fr", "1fr", "1fr", "0fr"] as AnimatedGridUnit[],
        rows: ["1fr"] as AnimatedGridUnit[],
        result: {
          sidebar: true,
          left: false,
          code: true,
          canvas: true,
          right: false,
        },
      },
    ],
    [
      "multiple rows, header hidden",
      {
        areas: [
          ["header", "header", "header", "header", "header"],
          ["sidebar", "left", "code", "canvas", "right"],
        ],
        columns: ["50px", "0fr", "1fr", "1fr", "0fr"] as AnimatedGridUnit[],
        rows: ["0px", "1fr"] as AnimatedGridUnit[],
        result: {
          header: false,
          sidebar: true,
          left: false,
          code: true,
          canvas: true,
          right: false,
        },
      },
    ],
    [
      "multiple rows, header shown",
      {
        areas: [
          ["header", "header", "header", "header", "header"],
          ["sidebar", "left", "code", "canvas", "right"],
        ],
        columns: ["50px", "0fr", "1fr", "1fr", "0fr"] as AnimatedGridUnit[],
        rows: ["100px", "1fr"] as AnimatedGridUnit[],
        result: {
          header: true,
          sidebar: true,
          left: false,
          code: true,
          canvas: true,
          right: false,
        },
      },
    ],
    [
      "preview mode, canvas and header are visible",
      {
        only: true,
        areas: [
          ["header", "header", "header", "header", "header"],
          ["sidebar", "left", "code", "canvas", "right"],
        ],
        columns: ["0px", "0fr", "0fr", "1fr", "0fr"] as AnimatedGridUnit[],
        rows: ["100px", "1fr"] as AnimatedGridUnit[],
        result: {
          header: true,
          sidebar: false,
          left: false,
          code: false,
          canvas: true,
          right: false,
        },
      },
    ],
    [
      "only top row is visible",
      {
        only: true,
        areas: [
          ["header", "header", "header", "header", "header"],
          ["sidebar", "left", "code", "canvas", "right"],
        ],
        columns: ["0px", "0fr", "0fr", "1fr", "0fr"] as AnimatedGridUnit[],
        rows: ["100px", "0"] as AnimatedGridUnit[],
        result: {
          header: true,
          sidebar: false,
          left: false,
          code: false,
          canvas: false,
          right: false,
        },
      },
    ],
    [
      "everything's invisible for empty rows and columns",
      {
        only: true,
        areas: [
          ["header", "header", "header", "header", "header"],
          ["sidebar", "left", "code", "canvas", "right"],
        ],
        columns: [] as AnimatedGridUnit[],
        rows: [] as AnimatedGridUnit[],
        result: {
          header: false,
          sidebar: false,
          left: false,
          code: false,
          canvas: false,
          right: false,
        },
      },
    ],
  ])("%s", (_, { result, ...params }) => {
    expect(resolveAreasVisibility(params)).toEqual(result);
  });
});
