import _ from "lodash";
import moment from "moment";
import derivedProperty from "../../derived";

describe("Validate getOrderedTableColumns function", () => {
  it("should test tht it returns the columns array from the primaryColumn", () => {
    const { getOrderedTableColumns } = derivedProperty;

    const input = {
      columnOrder: ["id", "name"],
      primaryColumns: {
        id: {
          index: 0,
          id: "id",
        },
        name: {
          index: 1,
          id: "name",
        },
      },
    };

    const expected = [
      {
        index: 0,
        id: "id",
        isAscOrder: undefined,
      },
      {
        index: 1,
        id: "name",
        isAscOrder: undefined,
      },
    ];

    expect(getOrderedTableColumns(input, moment, _)).toStrictEqual(expected);
  });

  it("should test that it returns the columns array from the primaryColumn based on column order", () => {
    const { getOrderedTableColumns } = derivedProperty;

    const input = {
      columnOrder: ["name", "id"],
      primaryColumns: {
        id: {
          index: 0,
          id: "id",
        },
        name: {
          index: 1,
          id: "name",
        },
      },
    };

    const expected = [
      {
        index: 0,
        id: "name",
        isAscOrder: undefined,
      },
      {
        index: 1,
        id: "id",
        isAscOrder: undefined,
      },
    ];

    expect(getOrderedTableColumns(input, moment, _)).toStrictEqual(expected);
  });

  it("should test that it returns the columns array from the primaryColumn based on column order and sets sort order details", () => {
    const { getOrderedTableColumns } = derivedProperty;

    let input = {
      columnOrder: ["name", "id"],
      primaryColumns: {
        id: {
          index: 0,
          id: "id",
        },
        name: {
          index: 1,
          id: "name",
        },
      },
      sortOrder: {
        column: "name",
        order: "asc",
      },
    };

    let expected = [
      {
        index: 0,
        id: "name",
        isAscOrder: true,
      },
      {
        index: 1,
        id: "id",
        isAscOrder: undefined,
      },
    ];

    expect(getOrderedTableColumns(input, moment, _)).toStrictEqual(expected);

    input = {
      columnOrder: ["name", "id"],
      primaryColumns: {
        id: {
          index: 0,
          id: "id",
        },
        name: {
          index: 1,
          id: "name",
        },
      },
      sortOrder: {
        column: "name",
        order: "desc",
      },
    };

    expected = [
      {
        index: 0,
        id: "name",
        isAscOrder: false,
      },
      {
        index: 1,
        id: "id",
        isAscOrder: undefined,
      },
    ];

    expect(getOrderedTableColumns(input, moment, _)).toStrictEqual(expected);
  });

  it("should test that it removes the column with empty name", () => {
    const { getOrderedTableColumns } = derivedProperty;

    const input = {
      columnOrder: ["name", ""],
      primaryColumns: {
        "": {
          index: 0,
          id: "",
        },
        name: {
          index: 1,
          id: "name",
        },
      },
    };

    const expected = [
      {
        index: 0,
        id: "name",
        isAscOrder: undefined,
      },
    ];

    expect(getOrderedTableColumns(input, moment, _)).toStrictEqual(expected);
  });
});
