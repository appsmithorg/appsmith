import derivedProperty from "./derived";
import moment from "moment";
import _ from "lodash";
describe("Validates Derived Properties", () => {
  it("validates columns generation function for empty values", () => {
    const { getTableColumns } = derivedProperty;
    const input = {
      sanitizedTableData: [],
      sortOrder: {
        column: "",
        order: null,
      },
      columnOrder: ["id", "another"],
    };
    const expected = [];

    let result = getTableColumns(input, moment, _);
    expect(result).toStrictEqual(expected);

    result = getTableColumns(
      {
        sortOrder: {
          column: "",
          order: null,
        },
      },
      moment,
      _,
    );
    expect(result).toStrictEqual(expected);
  });

  it("validates columns generation function for valid values", () => {
    const { getTableColumns } = derivedProperty;
    const input = {
      sanitizedTableData: [
        { id: 123, name: "John Doe" },
        { id: 234, name: "Jane Doe" },
      ],
      sortOrder: { column: "id", order: "desc" },
      columnOrder: ["name", "id"],
    };
    const expected = [
      {
        index: 0,
        width: 150,
        id: "name",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textColor: "#231F20",
        textSize: "PARAGRAPH",
        fontStyle: "REGULAR",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "name",
        isAscOrder: undefined,
        computedValue: ["John Doe", "Jane Doe"],
      },
      {
        index: 1,
        width: 150,
        id: "id",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textColor: "#231F20",
        textSize: "PARAGRAPH",
        fontStyle: "REGULAR",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "id",
        isAscOrder: false,
        computedValue: [123, 234],
      },
    ];

    let result = getTableColumns(input, moment, _);
    expect(result).toStrictEqual(expected);
  });
  it("generated columns does not modify primary columns", () => {
    const { getTableColumns } = derivedProperty;
    const input = {
      sanitizedTableData: [
        { id: 123, name: "John Doe" },
        { id: 234, name: "Jane Doe" },
      ],
      sortOrder: { column: "id", order: "desc" },
      columnOrder: ["name", "id"],
      primaryColumns: {
        id: {
          index: 1,
          width: 150,
          id: "id",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "id",
          isAscOrder: false,
          computedValue: [123, 234],
        },
        name: {
          index: 0,
          width: 150,
          id: "name",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "awesome",
          isAscOrder: undefined,
          computedValue: ["John Doe", "Jane Doe"],
        },
      },
    };
    const expected = [
      {
        index: 0,
        width: 150,
        id: "name",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textColor: "#231F20",
        textSize: "PARAGRAPH",
        fontStyle: "REGULAR",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "awesome",
        isAscOrder: undefined,
        computedValue: ["John Doe", "Jane Doe"],
      },
      {
        index: 1,
        width: 150,
        id: "id",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textColor: "#231F20",
        textSize: "PARAGRAPH",
        fontStyle: "REGULAR",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "id",
        isAscOrder: false,
        computedValue: [123, 234],
      },
    ];

    let result = getTableColumns(input, moment, _);
    expect(result).toStrictEqual(expected);
  });

  it("generated columns removes unexpected columns in primary columns", () => {
    const { getTableColumns } = derivedProperty;
    const input = {
      sanitizedTableData: [
        { id: 123, name: "John Doe" },
        { id: 234, name: "Jane Doe" },
      ],
      sortOrder: { column: "id", order: "desc" },
      columnOrder: ["name", "id"],
      primaryColumns: {
        id: {
          index: 1,
          width: 150,
          id: "id",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "id",
          isAscOrder: false,
          computedValue: [123, 234],
        },
        name: {
          index: 0,
          width: 150,
          id: "name",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "awesome",
          isAscOrder: undefined,
          computedValue: ["John Doe", "Jane Doe"],
        },
        extra: {
          index: 2,
          width: 150,
          id: "extra",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "extra",
          isAscOrder: undefined,
          computedValue: ["Extra1", "Extra2"],
        },
      },
    };
    const expected = [
      {
        index: 0,
        width: 150,
        id: "name",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textColor: "#231F20",
        textSize: "PARAGRAPH",
        fontStyle: "REGULAR",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "awesome",
        isAscOrder: undefined,
        computedValue: ["John Doe", "Jane Doe"],
      },
      {
        index: 1,
        width: 150,
        id: "id",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textColor: "#231F20",
        textSize: "PARAGRAPH",
        fontStyle: "REGULAR",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "id",
        isAscOrder: false,
        computedValue: [123, 234],
      },
    ];

    let result = getTableColumns(input, moment, _);
    expect(result).toStrictEqual(expected);
  });
  it("generated columns does not remove derived columns in primary columns", () => {
    const { getTableColumns } = derivedProperty;
    const input = {
      sanitizedTableData: [
        { id: 123, name: "John Doe" },
        { id: 234, name: "Jane Doe" },
      ],
      sortOrder: { column: "id", order: "desc" },
      columnOrder: ["name", "id"],
      primaryColumns: {
        id: {
          index: 1,
          width: 150,
          id: "id",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "id",
          isAscOrder: false,
          computedValue: [123, 234],
        },
        name: {
          index: 0,
          width: 150,
          id: "name",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "awesome",
          isAscOrder: undefined,
          computedValue: ["John Doe", "Jane Doe"],
        },
        extra: {
          index: 2,
          width: 150,
          id: "extra",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          label: "extra",
          isAscOrder: undefined,
          computedValue: ["Extra1", "Extra2"],
          isDerived: true,
        },
      },
    };
    const expected = [
      {
        index: 0,
        width: 150,
        id: "name",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textColor: "#231F20",
        textSize: "PARAGRAPH",
        fontStyle: "REGULAR",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "awesome",
        isAscOrder: undefined,
        computedValue: ["John Doe", "Jane Doe"],
      },
      {
        index: 1,
        width: 150,
        id: "id",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textColor: "#231F20",
        textSize: "PARAGRAPH",
        fontStyle: "REGULAR",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "id",
        isAscOrder: false,
        computedValue: [123, 234],
      },
      {
        index: 2,
        width: 150,
        id: "extra",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textColor: "#231F20",
        textSize: "PARAGRAPH",
        fontStyle: "REGULAR",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        label: "extra",
        isAscOrder: undefined,
        computedValue: ["Extra1", "Extra2"],
        isDerived: true,
      },
    ];

    let result = getTableColumns(input, moment, _);
    expect(result).toStrictEqual(expected);
  });

  it("validates generated filtered table data", () => {
    const { getFilteredTableData } = derivedProperty;
    const input = {
      sanitizedTableData: [
        { id: 123, name: "John Doe" },
        { id: 234, name: "Jane Doe" },
      ],
      sortOrder: { column: "id", order: "desc" },
      columnOrder: ["name", "id"],
      primaryColumns: {
        id: {
          index: 1,
          width: 150,
          id: "id",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "id",
          isAscOrder: false,
          computedValue: [123, 234],
        },
        name: {
          index: 0,
          width: 150,
          id: "name",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "awesome",
          isAscOrder: undefined,
          computedValue: ["John Doe", "Jane Doe"],
        },
        extra: {
          index: 2,
          width: 150,
          id: "extra",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          label: "extra",
          isAscOrder: undefined,
          computedValue: ["Extra1", "Extra2"],
          isDerived: true,
        },
      },
      tableColumns: [
        {
          index: 0,
          width: 150,
          id: "name",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "awesome",
          isAscOrder: undefined,
          computedValue: ["John Doe", "Jane Doe"],
        },
        {
          index: 1,
          width: 150,
          id: "id",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "id",
          isAscOrder: false,
          computedValue: [123, 234],
        },
        {
          index: 2,
          width: 150,
          id: "extra",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          label: "extra",
          isAscOrder: undefined,
          computedValue: ["Extra1", "Extra2"],
          isDerived: true,
        },
      ],
    };
    const expected = [
      {
        id: 234,
        name: "Jane Doe",
        extra: "Extra2",
        __originalIndex__: 1,
        __primaryKey__: undefined,
      },
      {
        id: 123,
        name: "John Doe",
        extra: "Extra1",
        __originalIndex__: 0,
        __primaryKey__: undefined,
      },
    ];

    let result = getFilteredTableData(input, moment, _);
    expect(result).toStrictEqual(expected);
  });

  it("validates generated filtered table data for empty values", () => {
    const { getFilteredTableData } = derivedProperty;
    const input = {
      sanitizedTableData: [],
      sortOrder: { column: "id", order: "desc" },
      columnOrder: ["name", "id"],
      primaryColumns: {},
      columns: [],
    };
    const expected = [];

    let result = getFilteredTableData(input, moment, _);
    expect(result).toStrictEqual(expected);
  });

  it("validates generated filtered table data to be sorted correctly based on column type", () => {
    const { getFilteredTableData } = derivedProperty;
    const input = {
      sanitizedTableData: [
        { id: 1234, name: "Jim Doe" },
        { id: 123, name: "John Doe" },
        { id: 234, name: "Jane Doe" },
      ],
      sortOrder: { column: "id", order: "desc" },
      columnOrder: ["name", "id"],
      primaryColumns: {
        id: {
          index: 1,
          width: 150,
          id: "id",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "number",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "id",
          isAscOrder: false,
          computedValue: [1234, 123, 234],
        },
        name: {
          index: 0,
          width: 150,
          id: "name",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "awesome",
          isAscOrder: undefined,
          computedValue: ["Jim Doe", "John Doe", "Jane Doe"],
        },
        extra: {
          index: 2,
          width: 150,
          id: "extra",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          label: "extra",
          isAscOrder: undefined,
          computedValue: ["", "Extra1", "Extra2"],
          isDerived: true,
        },
      },
      tableColumns: [
        {
          index: 0,
          width: 150,
          id: "name",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "awesome",
          isAscOrder: undefined,
          computedValue: ["Jim Doe", "John Doe", "Jane Doe"],
        },
        {
          index: 1,
          width: 150,
          id: "id",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "number",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "id",
          isAscOrder: false,
          computedValue: [1234, 123, 234],
        },
        {
          index: 2,
          width: 150,
          id: "extra",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          label: "extra",
          isAscOrder: undefined,
          computedValue: ["", "Extra1", "Extra2"],
          isDerived: true,
        },
      ],
    };
    const expected = [
      {
        id: 1234,
        name: "Jim Doe",
        extra: "",
        __originalIndex__: 0,
        __primaryKey__: undefined,
      },
      {
        id: 234,
        name: "Jane Doe",
        extra: "Extra2",
        __originalIndex__: 2,
        __primaryKey__: undefined,
      },
      {
        id: 123,
        name: "John Doe",
        extra: "Extra1",
        __originalIndex__: 1,
        __primaryKey__: undefined,
      },
    ];

    let result = getFilteredTableData(input, moment, _);
    expect(result).toStrictEqual(expected);
  });

  it("validates generated filtered table data with null values to be sorted correctly", () => {
    const { getFilteredTableData } = derivedProperty;
    const input = {
      sanitizedTableData: [
        { id: 1234, name: "Jim Doe", age: 28 },
        { id: 123, name: "John Doe" },
        { id: 234, name: "Jane Doe", age: 22 },
        { id: 2345, name: "Jane Doeson", age: 30 },
      ],
      sortOrder: { column: "age", order: "desc" },
      columnOrder: ["name", "id", "age"],
      primaryColumns: {
        id: {
          index: 1,
          width: 150,
          id: "id",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "number",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "id",
          isAscOrder: false,
          computedValue: [1234, 123, 234, 2345],
        },
        name: {
          index: 0,
          width: 150,
          id: "name",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "awesome",
          isAscOrder: undefined,
          computedValue: ["Jim Doe", "John Doe", "Jane Doe", "Jane Doeson"],
        },
        age: {
          index: 2,
          width: 150,
          id: "age",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "number",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          label: "age",
          isAscOrder: undefined,
          computedValue: [28, null, 22, 30],
          isDerived: true,
        },
      },
      tableColumns: [
        {
          index: 0,
          width: 150,
          id: "name",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "awesome",
          isAscOrder: undefined,
          computedValue: ["Jim Doe", "John Doe", "Jane Doe", "Jane Doeson"],
        },
        {
          index: 1,
          width: 150,
          id: "id",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "number",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "id",
          isAscOrder: false,
          computedValue: [1234, 123, 234],
        },
        {
          index: 2,
          width: 150,
          id: "age",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          label: "age",
          isAscOrder: undefined,
          computedValue: [28, null, 22, 30],
          isDerived: true,
        },
      ],
    };
    const expected = [
      {
        id: 2345,
        name: "Jane Doeson",
        age: 30,
        __originalIndex__: 3,
        __primaryKey__: undefined,
      },
      {
        id: 1234,
        name: "Jim Doe",
        age: 28,
        __originalIndex__: 0,
        __primaryKey__: undefined,
      },
      {
        id: 234,
        name: "Jane Doe",
        age: 22,
        __originalIndex__: 2,
        __primaryKey__: undefined,
      },
      {
        id: 123,
        name: "John Doe",
        age: null,
        __originalIndex__: 1,
        __primaryKey__: undefined,
      },
    ];

    let result = getFilteredTableData(input, moment, _);
    expect(result).toStrictEqual(expected);
  });

  it("validates generated filtered table data with empty string values to be sorted correctly", () => {
    const { getFilteredTableData } = derivedProperty;
    const input = {
      sanitizedTableData: [
        { id: 1234, name: "Jim Doe", age: 28 },
        { id: 123, name: "" },
        { id: 234, name: "Jane Doe", age: 22 },
        { id: 2345, name: "Jane Doeson", age: 30 },
      ],
      sortOrder: { column: "name", order: "desc" },
      columnOrder: ["name", "id", "age"],
      primaryColumns: {
        id: {
          index: 1,
          width: 150,
          id: "id",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "number",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "id",
          isAscOrder: false,
          computedValue: [1234, 123, 234, 2345],
        },
        name: {
          index: 0,
          width: 150,
          id: "name",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "awesome",
          isAscOrder: undefined,
          computedValue: ["Jim Doe", "", "Jane Doe", "Jane Doeson"],
        },
        age: {
          index: 2,
          width: 150,
          id: "age",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "number",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          label: "age",
          isAscOrder: undefined,
          computedValue: [28, null, 22, 30],
          isDerived: true,
        },
      },
      tableColumns: [
        {
          index: 0,
          width: 150,
          id: "name",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "awesome",
          isAscOrder: undefined,
          computedValue: ["Jim Doe", "", "Jane Doe", "Jane Doeson"],
        },
        {
          index: 1,
          width: 150,
          id: "id",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "number",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "id",
          isAscOrder: false,
          computedValue: [1234, 123, 234],
        },
        {
          index: 2,
          width: 150,
          id: "age",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          label: "age",
          isAscOrder: undefined,
          computedValue: [28, null, 22, 30],
          isDerived: true,
        },
      ],
    };
    const expected = [
      {
        id: 1234,
        name: "Jim Doe",
        age: 28,
        __originalIndex__: 0,
        __primaryKey__: undefined,
      },
      {
        id: 2345,
        name: "Jane Doeson",
        age: 30,
        __originalIndex__: 3,
        __primaryKey__: undefined,
      },
      {
        id: 234,
        name: "Jane Doe",
        age: 22,
        __originalIndex__: 2,
        __primaryKey__: undefined,
      },
      {
        id: 123,
        name: "",
        age: null,
        __originalIndex__: 1,
        __primaryKey__: undefined,
      },
    ];

    let result = getFilteredTableData(input, moment, _);
    expect(result).toStrictEqual(expected);
  });

  it("validates generated filtered table data to be filtered correctly in empty comparison", () => {
    const { getFilteredTableData } = derivedProperty;
    const input = {
      sanitizedTableData: [
        { id: 1234, name: "Jim Doe" },
        { id: 123, name: "John Doe" },
        { id: 234, name: "Jane Doe" },
      ],
      filters: [
        {
          condition: "empty",
          column: "id",
          value: "",
          operator: "OR",
        },
      ],
      sortOrder: { column: "id", order: "desc" },
      columnOrder: ["name", "id"],
      primaryColumns: {
        id: {
          index: 1,
          width: 150,
          id: "id",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "number",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "id",
          isAscOrder: false,
          computedValue: [1234, 123, 234],
        },
        name: {
          index: 0,
          width: 150,
          id: "name",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "awesome",
          isAscOrder: undefined,
          computedValue: ["Jim Doe", "John Doe", "Jane Doe"],
        },
        extra: {
          index: 2,
          width: 150,
          id: "extra",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          label: "extra",
          isAscOrder: undefined,
          computedValue: ["", "Extra1", "Extra2"],
          isDerived: true,
        },
      },
      tableColumns: [
        {
          index: 0,
          width: 150,
          id: "name",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "awesome",
          isAscOrder: undefined,
          computedValue: ["Jim Doe", "John Doe", "Jane Doe"],
        },
        {
          index: 1,
          width: 150,
          id: "id",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "number",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "id",
          isAscOrder: false,
          computedValue: [1234, 123, 234],
        },
        {
          index: 2,
          width: 150,
          id: "extra",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textColor: "#231F20",
          textSize: "PARAGRAPH",
          fontStyle: "REGULAR",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          label: "extra",
          isAscOrder: undefined,
          computedValue: ["", "Extra1", "Extra2"],
          isDerived: true,
        },
      ],
    };
    const expected = [];

    let result = getFilteredTableData(input, moment, _);
    expect(result).toStrictEqual(expected);
  });
});

describe("Validate getSelectedRow function", () => {
  it("Multple row selection, with selected rows", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: [0, 1],
      selectedRowIndex: 1,
      sanitizedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };
    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: 234,
      name: "Jane Doe",
      extra: "Extra2",
      __originalIndex__: 2,
    });
  });

  it("Multple row selection, with no selected rows", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: [],
      selectedRowIndex: 1,
      sanitizedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };
    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
      __originalIndex__: "",
    });
  });

  it("Single row selection, with selected row", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: false,
      selectedRowIndices: [],
      selectedRowIndex: 1,
      sanitizedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };
    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: 234,
      name: "Jane Doe",
      extra: "Extra2",
      __originalIndex__: 2,
    });
  });

  it("Single row selection, without selected row", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: [],
      selectedRowIndex: -1,
      sanitizedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
      __originalIndex__: "",
    });
  });

  it("Single row selection, with invalid indices", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: ["test"],
      selectedRowIndex: -1,
      sanitizedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
      __originalIndex__: "",
    });
  });
  it("Single row selection, with indices undefined", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: undefined,
      selectedRowIndex: -1,
      sanitizedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
      __originalIndex__: "",
    });
  });
  it("Single row selection, with invalid indices", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: [undefined],
      selectedRowIndex: -1,
      sanitizedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
      __originalIndex__: "",
    });
  });
  it("Single row selection, with invalid indices", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: [null],
      selectedRowIndex: -1,
      sanitizedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
      __originalIndex__: "",
    });
  });
  it("Single row selection, with invalid indices", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: ["1", "2"],
      selectedRowIndex: -1,
      sanitizedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
      __originalIndex__: "",
    });
  });
  it("Single row selection, with invalid indices", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: "1",
      selectedRowIndex: -1,
      sanitizedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
      __originalIndex__: "",
    });
  });
  it("Single row selection, with invalid indices", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: "test",
      selectedRowIndex: -1,
      sanitizedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
      __originalIndex__: "",
    });
  });
});
