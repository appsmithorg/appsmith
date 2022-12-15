import { getKeysFromSourceDataForEventAutocomplete } from "./helper";

describe("getKeysFromSourceDataForEventAutocomplete", () => {
  it("Should test with valid values", () => {
    const mockProps = {
      __evaluation__: {
        evaluatedValues: {
          sourceData: [
            {
              step: "#1",
              task: "Drop a table",
              status: "✅",
              action: "",
            },
            {
              step: "#2",
              task: "Create a query fetch_users with the Mock DB",
              status: "--",
              action: "",
            },
            {
              step: "#3",
              task: "Bind the query using => fetch_users.data",
              status: "--",
              action: "",
            },
          ],
        },
      },
    };

    const result = getKeysFromSourceDataForEventAutocomplete(mockProps as any);
    const expected = {
      currentItem: {
        step: "",
        task: "",
        status: "",
        action: "",
      },
    };
    expect(result).toStrictEqual(expected);
  });

  it("Should test with empty sourceData", () => {
    const mockProps = {
      __evaluation__: {
        evaluatedValues: {
          sourceData: [],
        },
      },
    };

    const result = getKeysFromSourceDataForEventAutocomplete(mockProps as any);
    const expected = { currentItem: {} };
    expect(result).toStrictEqual(expected);
  });

  it("Should test without sourceData", () => {
    const mockProps = {};

    const result = getKeysFromSourceDataForEventAutocomplete(mockProps as any);
    const expected = { currentItem: {} };
    expect(result).toStrictEqual(expected);
  });
});
