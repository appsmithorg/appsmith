import derivedProperty from "../../derived";

describe("getUpdatedRowIndices -", () => {
  it("should test that it returns empty array when transientTableData is empty", () => {
    const { getUpdatedRowIndices } = derivedProperty;

    expect(
      getUpdatedRowIndices({
        transientTableData: {},
      }),
    ).toEqual([]);
  });

  it("should test that it returns empty array when transientTableData is null", () => {
    const { getUpdatedRowIndices } = derivedProperty;

    expect(
      getUpdatedRowIndices({
        transientTableData: null,
      }),
    ).toEqual([]);
  });

  it("should test that it returns empty array when transientTableData is undefined", () => {
    const { getUpdatedRowIndices } = derivedProperty;

    expect(
      getUpdatedRowIndices({
        transientTableData: undefined,
      }),
    ).toEqual([]);
  });

  it("should test that it returns empty array when transientTableData has one value", () => {
    const { getUpdatedRowIndices } = derivedProperty;

    expect(
      getUpdatedRowIndices({
        transientTableData: {
          1: {
            column1: "newValue",
          },
        },
      }),
    ).toEqual([1]);
  });

  it("should test that it returns empty array when transientTableData has two value", () => {
    const { getUpdatedRowIndices } = derivedProperty;

    expect(
      getUpdatedRowIndices({
        transientTableData: {
          1: {
            column1: "newValue",
          },
          2: {
            column1: "newValue",
          },
        },
      }),
    ).toEqual([1, 2]);
  });
});
