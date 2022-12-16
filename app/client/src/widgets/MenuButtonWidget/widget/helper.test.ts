import { getSourceDataKeysForEventAutocomplete } from "./helper";

describe("getSourceDataKeysForEventAutocomplete", () => {
  it("Should test with valid values", () => {
    const mockProps = {
      sourceDataKeys: ["step", "task", "status", "action"],
      menuItemsSource: "DYANMIC",
    };

    const result = getSourceDataKeysForEventAutocomplete(mockProps as any);
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

  it("Should test with Static menuItemSource", () => {
    const mockProps = {
      sourceDataKeys: [],
      menuItemsSource: "STATIC",
    };

    const result = getSourceDataKeysForEventAutocomplete(mockProps as any);
    const expected = undefined;
    expect(result).toStrictEqual(expected);
  });

  it("Should test with empty sourceDataKeys", () => {
    const mockProps = {
      sourceDataKeys: [],
      menuItemsSource: "DYANMIC",
    };

    const result = getSourceDataKeysForEventAutocomplete(mockProps as any);
    const expected = undefined;
    expect(result).toStrictEqual(expected);
  });
});
