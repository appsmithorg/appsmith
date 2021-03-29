import { getIndextoUpdate } from "utils/ApiPaneUtils";

describe("api pane header insertion or removal", () => {
  describe("index for header needs to be retuened", () => {
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
