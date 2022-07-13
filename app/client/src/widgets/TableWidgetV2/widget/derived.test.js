import derivedProperty from "./derived";
import moment from "moment";
import _ from "lodash";
describe("Validates getFilteredTableData Properties", () => {
  it("validates generate filtered table data", () => {
    const { getFilteredTableData } = derivedProperty;
    const input = {
      processedTableData: [
        { id: 123, name: "John Doe" },
        { id: 234, name: "Jane Doe" },
      ],
      sortOrder: { column: "id", order: "desc" },
      columnOrder: ["name", "id", "extra"],
      primaryColumns: {
        id: {
          index: 1,
          width: 150,
          id: "id",
          originalId: "id",
          alias: "id",
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
          originalId: "name",
          alias: "name",
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
          originalId: "extra",
          alias: "extra",
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

    input.orderedTableColumns = Object.values(input.primaryColumns).sort((a, b) => {
      return input.columnOrder[a.id] < input.columnOrder[b.id];
    });

    const expected = [
      {
        id: 234,
        name: "Jane Doe",
        extra: "Extra2",
      },
      {
        id: 123,
        name: "John Doe",
        extra: "Extra1",
      },
    ];

    let result = getFilteredTableData(input, moment, _);
    expect(result).toStrictEqual(expected);
  });

  it("validates generated filtered table data for empty values", () => {
    const { getFilteredTableData } = derivedProperty;
    const input = {
      processedTableData: [],
      sortOrder: { column: "id", order: "desc" },
      columnOrder: ["name", "id"],
      primaryColumns: {},
      columns: [],
      orderedTableColumns: [],
    };

    const expected = [];

    let result = getFilteredTableData(input, moment, _);
    expect(result).toStrictEqual(expected);
  });

  it("validates generated filtered table data to be sorted correctly based on column type", () => {
    const { getFilteredTableData } = derivedProperty;
    const input = {
      processedTableData: [
        { id: 1234, name: "Jim Doe" },
        { id: 123, name: "John Doe" },
        { id: 234, name: "Jane Doe" },
      ],
      sortOrder: { column: "id", order: "desc" },
      columnOrder: ["name", "id", "extra"],
      primaryColumns: {
        id: {
          index: 1,
          width: 150,
          id: "id",
          alias: "id",
          originalId: "id",
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
          alias: "name",
          originalId: "name",
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
          alias: "extra",
          originalId: "extra",
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

    input.orderedTableColumns = Object.values(input.primaryColumns).sort((a, b) => {
      return input.columnOrder[a.id] < input.columnOrder[b.id];
    });

    const expected = [
      {
        id: 1234,
        name: "Jim Doe",
        extra: "",
      },
      {
        id: 234,
        name: "Jane Doe",
        extra: "Extra2",
      },
      {
        id: 123,
        name: "John Doe",
        extra: "Extra1",
      },
    ];

    let result = getFilteredTableData(input, moment, _);
    expect(result).toStrictEqual(expected);
  });

  it("validates generated filtered table data with null values to be sorted correctly", () => {
    const { getFilteredTableData } = derivedProperty;
    const input = {
      processedTableData: [
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
          alias: "id",
          originalId: "id",
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
          alias: "name",
          originalId: "name",
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
          alias: "age",
          originalId: "age",
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

    input.orderedTableColumns = Object.values(input.primaryColumns).sort((a, b) => {
      return input.columnOrder[a.id] < input.columnOrder[b.id];
    });

    const expected = [
      {
        id: 2345,
        name: "Jane Doeson",
        age: 30,
      },
      {
        id: 1234,
        name: "Jim Doe",
        age: 28,
      },
      {
        id: 234,
        name: "Jane Doe",
        age: 22,
      },
      {
        id: 123,
        name: "John Doe",
        age: null,
      },
    ];

    let result = getFilteredTableData(input, moment, _);
    expect(result).toStrictEqual(expected);
  });

  it("validates generated filtered table data with empty string values to be sorted correctly", () => {
    const { getFilteredTableData } = derivedProperty;
    const input = {
      processedTableData: [
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
          alias: "id",
          originalId: "id",
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
          alias: "name",
          originalId: "name",
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
          alias: "age",
          originalId: "age",
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

    input.orderedTableColumns = Object.values(input.primaryColumns).sort((a, b) => {
      return input.columnOrder[a.id] < input.columnOrder[b.id];
    });

    const expected = [
      {
        id: 1234,
        name: "Jim Doe",
        age: 28,
      },
      {
        id: 2345,
        name: "Jane Doeson",
        age: 30,
      },
      {
        id: 234,
        name: "Jane Doe",
        age: 22,
      },
      {
        id: 123,
        name: "",
        age: null,
      },
    ];

    let result = getFilteredTableData(input, moment, _);
    expect(result).toStrictEqual(expected);
  });

  it("validates generated filtered table data to be filtered correctly in empty comparison", () => {
    const { getFilteredTableData } = derivedProperty;
    const input = {
      processedTableData: [
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
          alias: "id",
          originalId: "id",
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
          alias: "name",
          originalId: "name",
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
          alias: "extra",
          originalId: "extra",
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

    input.orderedTableColumns = Object.values(input.primaryColumns).sort((a, b) => {
      return input.columnOrder[a.id] < input.columnOrder[b.id];
    });

    const expected = [];

    let result = getFilteredTableData(input, moment, _);
    expect(result).toStrictEqual(expected);
  });

  it("validates generated sanitized table data with valid property keys", () => {
    const { getProcessedTableData } = derivedProperty;

    const input = {
      transientTableData: {},
      tableData: [
        {
          "1": "abc",
          "2": "bcd",
          "3": "cde",
          Dec: "mon",
          demo: "3",
          demo_1: "1",
          "test one": "1",
          "test 3 4 9": "4",
          rowIndex: "0",
          "😀smile😀": "smile 1",
          "🙁sad🙁": "sad 1",
          "@user": "user 1",
          "@name": "name 1",
          ÜserÑame: "john",
        },
        {
          "1": "asd",
          "2": "dfg",
          "3": "jkl",
          Dec: "mon2",
          demo: "2",
          demo_1: "1",
          "test one": "2",
          "test 3 4 9": "3",
          rowIndex: "1",
          "😀smile😀": "smile 2",
          "🙁sad🙁": "sad 2",
          "@user": "user 2",
          "@name": "name 2",
          ÜserÑame: "mike",
        },
      ],
    };
    const expected = [
      {
        "1": "abc",
        "2": "bcd",
        "3": "cde",
        Dec: "mon",
        demo: "3",
        demo_1: "1",
        "test one": "1",
        "test 3 4 9": "4",
        rowIndex: "0",
        "😀smile😀": "smile 1",
        "🙁sad🙁": "sad 1",
        "@user": "user 1",
        "@name": "name 1",
        ÜserÑame: "john",
        "__originalIndex__": 0,
        "__primaryKey__": undefined,
      },
      {
        "1": "asd",
        "2": "dfg",
        "3": "jkl",
        Dec: "mon2",
        demo: "2",
        demo_1: "1",
        "test one": "2",
        "test 3 4 9": "3",
        rowIndex: "1",
        "😀smile😀": "smile 2",
        "🙁sad🙁": "sad 2",
        "@user": "user 2",
        "@name": "name 2",
        ÜserÑame: "mike",
        "__originalIndex__": 1,
        "__primaryKey__": undefined,
      },
    ];

    let result = getProcessedTableData(input, moment, _);
  
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
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };
    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: 234,
      name: "Jane Doe",
      extra: "Extra2",
    });
  });

  it("Multple row selection, with no selected rows", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: [],
      selectedRowIndex: 1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };
    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });
  });

  it("Single row selection, with selected row", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: false,
      selectedRowIndices: [],
      selectedRowIndex: 1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };
    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: 234,
      name: "Jane Doe",
      extra: "Extra2",
    });
  });

  it("Single row selection, without selected row", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: [],
      selectedRowIndex: -1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });
  });

  it("Single row selection, with invalid indices", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: ["test"],
      selectedRowIndex: -1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });
  });
  it("Single row selection, with indices undefined", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: undefined,
      selectedRowIndex: -1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });
  });
  it("Single row selection, with invalid indices", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: [undefined],
      selectedRowIndex: -1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });
  });
  it("Single row selection, with invalid indices", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: [null],
      selectedRowIndex: -1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });
  });
  it("Single row selection, with invalid indices", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: ["1", "2"],
      selectedRowIndex: -1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });
  });
  it("Single row selection, with invalid indices", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: "1",
      selectedRowIndex: -1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });
  });
  it("Single row selection, with invalid indices", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: "test",
      selectedRowIndex: -1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });
  });
});

describe("Validate getTriggeredRow function", () => {
  it("with valid triggered row index", () => {
    const { getTriggeredRow } = derivedProperty;
    const input = {
      triggeredRowIndex: 1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };
    expect(getTriggeredRow(input, moment, _)).toStrictEqual({
      id: 123,
      name: "John Doe",
      extra: "Extra1",
    });
  });

  it("with valid triggered row index", () => {
    const { getTriggeredRow } = derivedProperty;
    const input = {
      triggeredRowIndex: 0,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };
    expect(getTriggeredRow(input, moment, _)).toStrictEqual({
      id: 1234,
      name: "Jim Doe",
      extra: "",
    });
  });

  it("with triggered row index -1", () => {
    const { getTriggeredRow } = derivedProperty;
    const input = {
      triggeredRowIndex: -1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getTriggeredRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });
  });

  it("with invalid triggered row index", () => {
    const { getTriggeredRow } = derivedProperty;
    const input = {
      triggeredRowIndex: "test",
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getTriggeredRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });
  });

  it("with invalid triggered row index", () => {
    const { getTriggeredRow } = derivedProperty;
    const input = {
      triggeredRowIndex: undefined,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getTriggeredRow(input, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });
  });
});

describe("Validate getSelectedRows function", () => {
  it("with valid index", () => {
    const { getSelectedRows } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: [1],
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };
    expect(getSelectedRows(input, moment, _)).toStrictEqual([
      {
        id: 234,
        name: "Jane Doe",
        extra: "Extra2",
      },
    ]);
  });

  it("with valid indices", () => {
    const { getSelectedRows } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: [0, 1],
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };
    expect(getSelectedRows(input, moment, _)).toStrictEqual([
      {
        id: 1234,
        name: "Jim Doe",
        extra: "",
      },
      {
        id: 234,
        name: "Jane Doe",
        extra: "Extra2",
      },
    ]);
  });

  it("with invalid indices", () => {
    const { getSelectedRows } = derivedProperty;
    const input = {
      selectedRowIndices: [0, "test"],
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };
    expect(getSelectedRows(input, moment, _)).toStrictEqual([]);
  });

  it("with no indices", () => {
    const { getSelectedRows } = derivedProperty;
    const input = {
      selectedRowIndices: [],
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };
    expect(getSelectedRows(input, moment, _)).toStrictEqual([]);
  });
});

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

describe("getUpdatedRows -", () => {
  it("should test that it returns empty array when transientTableData is empty", () => {
    const { getUpdatedRows } = derivedProperty;

    expect(
      getUpdatedRows(
        {
          transientTableData: {},
        },
        null,
        _,
      ),
    ).toEqual([]);
  });

  it("should test that it returns empty array when transientTableData is null", () => {
    const { getUpdatedRows } = derivedProperty;

    expect(
      getUpdatedRows(
        {
          transientTableData: null,
        },
        null,
        _,
      ),
    ).toEqual([]);
  });

  it("should test that it returns empty array when transientTableData is undefined", () => {
    const { getUpdatedRows } = derivedProperty;

    expect(
      getUpdatedRows(
        {
          transientTableData: null,
        },
        null,
        _,
      ),
    ).toEqual([]);
  });

  it("should test that it returns expected array when transientTableData has data with invalid index", () => {
    const { getUpdatedRows } = derivedProperty;

    const input = {
      transientTableData: {
        test: {
          column1: "newValue",
        },
      },
      processedTableData: [
        {
          column1: "oldValue",
          column2: "oldValue",
          __originalIndex__: 0,
        },
        {
          column1: "newValue",
          column2: "oldValue",
          __originalIndex__: 1,
        },
      ],
    };

    const expected = [];

    expect(getUpdatedRows(input, null, _)).toEqual(expected);
  });

  it("should test that it returns expected array when transientTableData has data", () => {
    const { getUpdatedRows } = derivedProperty;

    const input = {
      transientTableData: {
        1: {
          column1: "newValue",
        },
      },
      processedTableData: [
        {
          column1: "oldValue",
          column2: "oldValue",
          __originalIndex__: 0,
        },
        {
          column1: "newValue",
          column2: "oldValue",
          __originalIndex__: 1,
        },
      ],
    };

    const expected = [
      {
        index: 1,
        updatedFields: {
          column1: "newValue",
        },
        allFields: {
          column1: "newValue",
          column2: "oldValue",
        },
      },
    ];

    expect(getUpdatedRows(input, null, _)).toEqual(expected);
  });

  it("should test that it returns expected array when transientTableData has data with primary column", () => {
    const { getUpdatedRows } = derivedProperty;

    const input = {
      primaryColumnId: "column2",
      transientTableData: {
        1: {
          column1: "newValue",
        },
      },
      processedTableData: [
        {
          column1: "oldValue1",
          column2: "oldValue1",
          __originalIndex__: 0,
        },
        {
          column1: "newValue",
          column2: "oldValue2",
          __originalIndex__: 1,
        },
      ],
    };

    const expected = [
      {
        index: 1,
        column2: "oldValue2",
        updatedFields: {
          column1: "newValue",
        },
        allFields: {
          column1: "newValue",
          column2: "oldValue2",
        },
      },
    ];

    expect(getUpdatedRows(input, null, _)).toEqual(expected);
  });

  it("should test that it returns expected array when transientTableData has data with primary column and bigger tableData", () => {
    const { getUpdatedRows } = derivedProperty;

    const input = {
      primaryColumnId: "column3",
      transientTableData: {
        1: {
          column1: "newValue",
          column2: "newValue1",
        },
      },
      processedTableData: [
        {
          column1: "oldValue1",
          column2: "oldValue1",
          column3: "oldValue1",
          __originalIndex__: 0,
        },
        {
          column1: "newValue",
          column2: "newValue1",
          column3: "oldValue2",
          __originalIndex__: 1,
        },
        {
          column1: "oldValue3",
          column2: "oldValue3",
          column3: "oldValue3",
          __originalIndex__: 2,
        },
        {
          column1: "oldValue3",
          column2: "oldValue3",
          column3: "oldValue4",
          __originalIndex__: 3,
        },
      ],
    };

    const expected = [
      {
        index: 1,
        column3: "oldValue2",
        updatedFields: {
          column1: "newValue",
          column2: "newValue1",
        },
        allFields: {
          column1: "newValue",
          column2: "newValue1",
          column3: "oldValue2",
        },
      },
    ];

    expect(getUpdatedRows(input, null, _)).toEqual(expected);
  });
});

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
