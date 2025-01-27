import derivedProperty from "../../derived";

describe("Validate tableHeaders function", () => {
  const { getTableHeaders } = derivedProperty;

  it("should test that it returns empty array when primaryColumns is undefined", () => {
    expect(
      getTableHeaders({
        primaryColumns: undefined,
      }),
    ).toEqual([]);
  });

  it("should test that it returns expected array when primaryColumns value is undefined", () => {
    expect(
      getTableHeaders({
        primaryColumns: {
          "some value": undefined,
        },
      }),
    ).toEqual([
      {
        id: undefined,
        label: undefined,
        isVisible: undefined,
      },
    ]);
  });

  it("should test that it returns expected array when primaryColumns data is undefined", () => {
    expect(
      getTableHeaders({
        primaryColumns: {
          "some value": {
            id: "some value",
            label: undefined,
            isVisible: true,
          },
        },
      }),
    ).toEqual([
      {
        id: "some value",
        label: undefined,
        isVisible: true,
      },
    ]);
  });

  it("should test that it returns expected array with the same length as that of primaryColumns", () => {
    expect(
      getTableHeaders({
        primaryColumns: {
          "some value": {
            id: "some value",
            label: "some value",
            isVisible: true,
          },
          "some other value": {
            id: "some other value",
            label: "some other value",
            isVisible: true,
          },
        },
      }).length,
    ).toEqual(2);
  });

  it("should test that it returns expected array sorted", () => {
    expect(
      getTableHeaders({
        primaryColumns: {
          "value 02": {
            id: "value 02",
            label: "value 02",
            isVisible: true,
            index: "2",
          },
          "value 03": {
            id: "value 03",
            label: "value 03",
            isVisible: true,
            index: "3",
          },
          "value 01": {
            id: "value 01",
            label: "value 01",
            isVisible: true,
            index: "1",
          },
        },
      }),
    ).toEqual([
      {
        id: "value 01",
        label: "value 01",
        isVisible: true,
      },
      {
        id: "value 02",
        label: "value 02",
        isVisible: true,
      },
      {
        id: "value 03",
        label: "value 03",
        isVisible: true,
      },
    ]);
  });
});
