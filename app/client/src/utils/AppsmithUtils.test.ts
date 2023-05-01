import {
  areArraysEqual,
  createBlobUrl,
  getCamelCaseString,
  parseBlobUrl,
} from "utils/AppsmithUtils";
import { isURL } from "./TypeHelpers";

describe("getCamelCaseString", () => {
  it("Should return a string in camelCase", () => {
    const inputs = ["abcd", "ab12cd", "开关", "😃 😃 😃"];
    const expected = ["abcd", "ab12Cd", "", ""];

    inputs.forEach((input, index) => {
      const result = getCamelCaseString(input);
      expect(result).toStrictEqual(expected[index]);
    });
  });
});

describe("test areArraysEqual", () => {
  it("test areArraysEqual method", () => {
    const OGArray = ["test1", "test2", "test3"];

    let testArray: string[] = [];
    expect(areArraysEqual(OGArray, testArray)).toBe(false);

    testArray = ["test1", "test3"];
    expect(areArraysEqual(OGArray, testArray)).toBe(false);

    testArray = ["test1", "test2", "test3"];
    expect(areArraysEqual(OGArray, testArray)).toBe(true);

    testArray = ["test1", "test3", "test2"];
    expect(areArraysEqual(OGArray, testArray)).toBe(true);
  });
});

describe("isURL", () => {
  test("returns true for valid URLs", () => {
    expect(isURL("http://example.com")).toBe(true);
    expect(isURL("https://www.google.com/search?q=javascript")).toBe(true);
    expect(isURL("https://en.wikipedia.org/wiki/Regular_expression")).toBe(
      true,
    );
    expect(
      isURL("https://www.example.com/path(withparentheses)/file.html"),
    ).toBe(true);
    expect(
      isURL("https://www.example.com/path[withparentheses]/file_(1)[2].html"),
    ).toBe(true);
  });

  test("returns false for invalid URLs", () => {
    expect(isURL("http://localhost:3000")).toBe(false);
    expect(isURL("not a URL")).toBe(false);
    expect(isURL("ftp:/example.com")).toBe(false);
    expect(isURL("http://example.")).toBe(false);
    expect(isURL("http://localhost:port")).toBe(false);
    expect(isURL("notAURL")).toBe(false);
    expect(isURL("httpsnotAURL")).toBe(false);
  });
});

describe("createBlobUrl", () => {
  beforeEach(() => {
    URL.createObjectURL = jest
      .fn()
      .mockReturnValue(`blob:${window.location.origin}/123-123-123-123-123`);
  });

  it("should test that it created correct blob URL", () => {
    expect(createBlobUrl(new Blob(), "base64")).toMatch(
      /blob:[a-z0-9-]*\?type=base64/,
    );

    expect(createBlobUrl(new Blob(), "raw")).toMatch(
      /blob:[a-z0-9-]*\?type=raw/,
    );
  });
});

describe("parseBlobUrl", () => {
  it("should test that it created correct blob URL", () => {
    expect(parseBlobUrl("blob:123-123?type=base")).toEqual([
      `blob:${window.location.origin}/123-123`,
      "base",
    ]);

    expect(parseBlobUrl("blob:123-123?type=raw")).toEqual([
      `blob:${window.location.origin}/123-123`,
      "raw",
    ]);
  });
});
