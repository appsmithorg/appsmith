import _ from "lodash";
import moment from "moment";
import derivedProperty from "../../derived";

describe("Validates getFilteredTableData Properties", () => {
  const inputWithDisplayText = {
    processedTableData: [
      { url: "A.COM", __originalIndex__: 0 },
      { url: "B.COM", __originalIndex__: 1 },
      { url: "C.COM", __originalIndex__: 2 },
      { url: "D.COM", __originalIndex__: 3 },
    ],
    sortOrder: { column: "url", order: "asc" },
    columnOrder: ["url"],
    primaryColumns: {
      url: {
        index: 0,
        width: 150,
        id: "url",
        alias: "url",
        originalId: "url",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "url",
        textColor: "#231F20",
        textSize: "PARAGRAPH",
        fontStyle: "REGULAR",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "awesome",
        isAscOrder: undefined,
        displayText: ["Z", "Y", "X", "W"],
        computedValue: ["A.COM", "B.COM", "C.COM", "D.COM"],
      },
    },
    tableColumns: [
      {
        index: 0,
        width: 150,
        id: "url",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "url",
        textColor: "#231F20",
        textSize: "PARAGRAPH",
        fontStyle: "REGULAR",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "awesome",
        isAscOrder: undefined,
        displayText: ["Z", "Y", "X", "W"],
        computedValue: ["A.COM", "B.COM", "C.COM", "D.COM"],
      },
    ],
  };

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

    input.orderedTableColumns = Object.values(input.primaryColumns).sort(
      (a, b) => {
        return input.columnOrder[a.id] < input.columnOrder[b.id];
      },
    );

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

    input.orderedTableColumns = Object.values(input.primaryColumns).sort(
      (a, b) => {
        return input.columnOrder[a.id] < input.columnOrder[b.id];
      },
    );

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

  it("validates generated filtered edited table data to be sorted correctly based on column type", () => {
    const { getFilteredTableData } = derivedProperty;
    const input = {
      processedTableData: [
        { id: 123, name: "BAC", __originalIndex__: 0 },
        { id: 1234, name: "ABC", __originalIndex__: 1 },
        { id: 234, name: "CAB", __originalIndex__: 2 },
      ],
      tableData: [
        { id: 123, name: "BAC" },
        { id: 1234, name: "ABC" },
        { id: 234, name: "CAB" },
      ],
      sortOrder: { column: "name", order: "asc" },
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
          computedValue: ["BAC", "ABC", "AAB"],
        },
      },
    };

    input.orderedTableColumns = Object.values(input.primaryColumns).sort(
      (a, b) => {
        return input.columnOrder[a.id] < input.columnOrder[b.id];
      },
    );

    const expected = [
      {
        id: 1234,
        name: "ABC",
        __originalIndex__: 1,
      },
      {
        id: 123,
        name: "BAC",
        __originalIndex__: 0,
      },
      {
        id: 234,
        name: "AAB",
        __originalIndex__: 2,
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

    input.orderedTableColumns = Object.values(input.primaryColumns).sort(
      (a, b) => {
        return input.columnOrder[a.id] < input.columnOrder[b.id];
      },
    );

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

    input.orderedTableColumns = Object.values(input.primaryColumns).sort(
      (a, b) => {
        return input.columnOrder[a.id] < input.columnOrder[b.id];
      },
    );

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

  it("validates generated filtered table data with date values to be sorted correctly", () => {
    const { getFilteredTableData } = derivedProperty;
    const input = {
      processedTableData: [
        { guid: "abc123", createdAt: 1678886400 },
        { guid: "def456", createdAt: 1747968000 },
        { guid: "ghi789", createdAt: 1646582400 },
        { guid: "jkl012", createdAt: 1668806400 },
        { guid: "mno345", createdAt: 1677840000 },
        { guid: "pqr678", createdAt: 1649670400 },
        { guid: "stu901", createdAt: 1683552000 },
        { guid: "vwx234", createdAt: 1642137600 },
        { guid: "yzab567", createdAt: 1661740800 },
        { guid: "cde890", createdAt: 1670563200 },
      ],
      sortOrder: { column: "createdAt", order: "desc" },
      columnOrder: ["guid", "createdAt"],
      primaryColumns: {
        guid: {
          allowCellWrapping: false,
          allowSameOptionsInNewRow: true,
          index: 0,
          width: 150,
          originalId: "guid",
          id: "guid",
          alias: "guid",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textSize: "0.875rem",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDisabled: false,
          isCellEditable: false,
          isEditable: false,
          isCellVisible: true,
          isDerived: false,
          label: "guid",
          isSaveVisible: true,
          isDiscardVisible: true,
          computedValue: [
            "abc123",
            "def456",
            "ghi789",
            "jkl012",
            "mno345",
            "pqr678",
            "stu901",
            "vwx234",
            "yzab567",
            "cde890",
          ],
          sticky: "",
          validation: {},
          currencyCode: "USD",
          decimals: 0,
          thousandSeparator: true,
          notation: "standard",
          textColor: "",
          cellBackground: "",
          fontStyle: "",
        },
        createdAt: {
          allowCellWrapping: false,
          allowSameOptionsInNewRow: true,
          index: 1,
          width: 150,
          originalId: "createdAt",
          id: "createdAt",
          alias: "createdAt",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "date",
          textSize: "0.875rem",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDisabled: false,
          isCellEditable: false,
          isEditable: false,
          isCellVisible: true,
          isDerived: false,
          label: "createdAt",
          isSaveVisible: true,
          isDiscardVisible: true,
          computedValue: [
            1678886400, 1747968000, 1646582400, 1668806400, 1677840000,
            1649670400, 1683552000, 1642137600, 1661740800, 1670563200,
          ],
          sticky: "",
          validation: {},
          currencyCode: "USD",
          decimals: 0,
          thousandSeparator: true,
          notation: "standard",
          inputFormat: "Epoch",
          textColor: "",
          cellBackground: "",
          fontStyle: "",
          outputFormat: "",
        },
      },
    };

    input.orderedTableColumns = Object.values(input.primaryColumns).sort(
      (a, b) => {
        return input.columnOrder[a.id] < input.columnOrder[b.id];
      },
    );

    const expected = input.processedTableData.sort((a, b) => {
      return a.createdAt < b.createdAt ? 1 : -1;
    });

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

    input.orderedTableColumns = Object.values(input.primaryColumns).sort(
      (a, b) => {
        return input.columnOrder[a.id] < input.columnOrder[b.id];
      },
    );

    const expected = [];

    let result = getFilteredTableData(input, moment, _);

    expect(result).toStrictEqual(expected);
  });

  it("should filter correctly after editing a value with an applied filter", () => {
    const { getFilteredTableData } = derivedProperty;
    const input = {
      tableData: [
        { id: 1234, name: "Jim Doe" },
        { id: 123, name: "Hamza Khafaga" },
        { id: 234, name: "Khadija Khafaga" },
      ],
      processedTableData: [
        { id: 1234, name: "Jim Doe", __originalIndex__: 0 },
        { id: 123, name: "Hamza Anas", __originalIndex__: 1 },
        { id: 234, name: "Khadija Khafaga", __originalIndex__: 2 },
      ],
      filters: [
        {
          condition: "contains",
          column: "name",
          value: "Khafaga",
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
        },
      ],
    };

    input.orderedTableColumns = Object.values(input.primaryColumns).sort(
      (a, b) => {
        return input.columnOrder[a.id] < input.columnOrder[b.id];
      },
    );

    const expected = [
      { id: 234, name: "Khadija Khafaga", __originalIndex__: 2 },
      { id: 123, name: "Hamza Anas", __originalIndex__: 1 },
    ];

    let result = getFilteredTableData(input, moment, _);

    expect(result).toStrictEqual(expected);
  });

  it("validates generated sanitized table data with valid property keys", () => {
    const { getProcessedTableData } = derivedProperty;

    const input = {
      transientTableData: {},
      tableData: [
        {
          1: "abc",
          2: "bcd",
          3: "cde",
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
          1: "asd",
          2: "dfg",
          3: "jkl",
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
        1: "abc",
        2: "bcd",
        3: "cde",
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
        __originalIndex__: 0,
        __primaryKey__: undefined,
      },
      {
        1: "asd",
        2: "dfg",
        3: "jkl",
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
        __originalIndex__: 1,
        __primaryKey__: undefined,
      },
    ];

    let result = getProcessedTableData(input, moment, _);

    expect(result).toStrictEqual(expected);
  });

  it("validate generated sorted table data for URL columntype with display text property", () => {
    const { getFilteredTableData } = derivedProperty;
    const input = { ...inputWithDisplayText };

    input.orderedTableColumns = Object.values(input.primaryColumns).sort(
      (a, b) => {
        return input.columnOrder[a.id] < input.columnOrder[b.id];
      },
    );

    const expected = [
      { url: "D.COM", __originalIndex__: 3 },
      { url: "C.COM", __originalIndex__: 2 },
      { url: "B.COM", __originalIndex__: 1 },
      { url: "A.COM", __originalIndex__: 0 },
    ];

    let result = getFilteredTableData(input, moment, _);

    expect(result).toStrictEqual(expected);
  });

  it("validate filters on table data for URL columntype with display text", () => {
    const { getFilteredTableData } = derivedProperty;
    const input = {
      ...inputWithDisplayText,
      filters: [
        {
          condition: "contains",
          column: "url",
          value: "Y",
        },
      ],
    };

    input.orderedTableColumns = Object.values(input.primaryColumns).sort(
      (a, b) => {
        return input.columnOrder[a.id] < input.columnOrder[b.id];
      },
    );

    const expected = [{ url: "B.COM", __originalIndex__: 1 }];

    let result = getFilteredTableData(input, moment, _);

    expect(result).toStrictEqual(expected);
  });

  it("validate search on table data for URL columntype with display text", () => {
    const { getFilteredTableData } = derivedProperty;
    const input = {
      ...inputWithDisplayText,
      searchText: "Y",
      enableClientSideSearch: true,
    };

    input.orderedTableColumns = Object.values(input.primaryColumns).sort(
      (a, b) => {
        return input.columnOrder[a.id] < input.columnOrder[b.id];
      },
    );

    const expected = [{ url: "B.COM", __originalIndex__: 1 }];

    let result = getFilteredTableData(input, moment, _);

    expect(result).toStrictEqual(expected);
  });

  it("filters correctly after editing a value with an applied search key", () => {
    const { getFilteredTableData } = derivedProperty;
    const input = {
      tableData: [
        { id: 1234, name: "Jim Doe" },
        { id: 123, name: "Hamza Khafaga" },
        { id: 234, name: "Khadija Khafaga" },
      ],
      processedTableData: [
        { id: 1234, name: "Jim Doe", __originalIndex__: 0 },
        { id: 123, name: "Hamza Anas", __originalIndex__: 1 },
        { id: 234, name: "Khadija Khafaga", __originalIndex__: 2 },
      ],
      searchText: "Khafaga",
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
        },
      ],
    };

    input.orderedTableColumns = Object.values(input.primaryColumns).sort(
      (a, b) => {
        return input.columnOrder[a.id] < input.columnOrder[b.id];
      },
    );

    const expected = [
      { id: 234, name: "Khadija Khafaga", __originalIndex__: 2 },
      { id: 123, name: "Hamza Anas", __originalIndex__: 1 },
    ];

    let result = getFilteredTableData(input, moment, _);

    expect(result).toStrictEqual(expected);
  });
});
