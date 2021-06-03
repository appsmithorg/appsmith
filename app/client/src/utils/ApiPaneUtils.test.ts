import { getIndextoUpdate, parseUrlForQueryParams } from "utils/ApiPaneUtils";

describe("api pane header insertion or removal", () => {
  describe("index for header needs to be returned", () => {
    test("it gives correct index", () => {
      const headers = [
        { key: "content-type", value: "application/json" },
        { key: "", value: "" },
        { key: "", value: "" },
        { key: "", value: "" },
      ];
      const headerIndex = 0;
      expect(getIndextoUpdate(headers, headerIndex)).toEqual(headerIndex);
      const headers2 = [
        { key: "", value: "" },
        { key: "", value: "" },
        { key: "", value: "" },
      ];
      const headerIndex2 = -1;
      expect(getIndextoUpdate(headers2, headerIndex2)).toEqual(0);

      const headers3 = [
        { key: "abc", value: "abc" },
        { key: "def", value: "def" },
        { key: "ghi", value: "ghi" },
      ];
      const headerIndex3 = -1;
      expect(getIndextoUpdate(headers3, headerIndex3)).toEqual(headers3.length);
    });
  });
});

describe("Api pane query parameters parsing", () => {
  test("It gives correct query parameters", () => {
    const url1 = "user?q=2&b='Auth=xyz'";
    const params1 = [
      { key: "q", value: "2" },
      { key: "b", value: "'Auth=xyz'" },
    ];
    expect(parseUrlForQueryParams(url1)).toEqual(params1);
    const url2 = "/user?q=2&b='Auth=xyz'";
    expect(parseUrlForQueryParams(url2)).toEqual(params1);
    const url3 = "user?q=2&b={{Api1.data.isLatest ? 'v1' : 'v2'}}";
    const params2 = [
      { key: "q", value: "2" },
      { key: "b", value: "{{Api1.data.isLatest ? 'v1' : 'v2'}}" },
    ];
    expect(parseUrlForQueryParams(url3)).toEqual(params2);
    const url4 = "";
    const params3 = [
      { key: "", value: "" },
      { key: "", value: "" },
    ];
    expect(parseUrlForQueryParams(url4)).toEqual(params3);
    const url5 = "/";
    expect(parseUrlForQueryParams(url5)).toEqual(params3);
  });
});
