import derivedProperty from "./derived";
import moment from "moment";
import _ from "lodash";

const samplePrimaryColumns = {
  step: {
    index: 0,
    width: 150,
    id: "step",
    originalId: "step",
    alias: "step",
    horizontalAlignment: "LEFT",
    verticalAlignment: "CENTER",
    columnType: "text",
    textSize: "0.875rem",
    enableFilter: true,
    enableSort: true,
    isVisible: true,
    isCellVisible: true,
    isCellEditable: false,
    isDerived: false,
    label: "step",
    computedValue: ["#1", "#2", "#3"],
    labelColor: "#FFFFFF",
    cellBackground: "",
    textColor: "",
    fontStyle: "",
  },
  task: {
    index: 1,
    width: 150,
    id: "task",
    originalId: "task",
    alias: "task",
    horizontalAlignment: "LEFT",
    verticalAlignment: "CENTER",
    columnType: "text",
    textSize: "0.875rem",
    enableFilter: true,
    enableSort: true,
    isVisible: true,
    isCellVisible: true,
    isCellEditable: false,
    isDerived: false,
    label: "task",
    computedValue: [
      "Drop a table",
      "Create a query fetch_users with the Mock DB",
      "Bind the query using => fetch_users.data",
    ],
    labelColor: "#FFFFFF",
    cellBackground: "",
    textColor: "",
    fontStyle: "",
  },
  status: {
    index: 2,
    width: 150,
    id: "status",
    originalId: "status",
    alias: "status",
    horizontalAlignment: "LEFT",
    verticalAlignment: "CENTER",
    columnType: "text",
    textSize: "0.875rem",
    enableFilter: true,
    enableSort: true,
    isVisible: true,
    isCellVisible: true,
    isCellEditable: false,
    isDerived: false,
    label: "status",
    computedValue: ["✅", "--", "--"],
    labelColor: "#FFFFFF",
    cellBackground: "",
    textColor: "",
    fontStyle: "",
  },
  action: {
    index: 3,
    width: 150,
    id: "action",
    originalId: "action",
    alias: "action",
    horizontalAlignment: "LEFT",
    verticalAlignment: "CENTER",
    columnType: "button",
    textSize: "0.875rem",
    enableFilter: true,
    enableSort: true,
    isVisible: true,
    isCellVisible: true,
    isCellEditable: false,
    isDisabled: false,
    isDerived: false,
    label: "action",
    onClick:
      "{{currentRow.step === '#1' ? showAlert('Done', 'success') : currentRow.step === '#2' ? navigateTo('https://docs.appsmith.com/core-concepts/connecting-to-data-sources/querying-a-database',undefined,'NEW_WINDOW') : navigateTo('https://docs.appsmith.com/core-concepts/displaying-data-read/display-data-tables',undefined,'NEW_WINDOW')}}",
    computedValue: ["", "", ""],
    labelColor: "#FFFFFF",
    buttonColor: ["#553DE9", "#553DE9", "#553DE9"],
    borderRadius: ["0.375rem", "0.375rem", "0.375rem"],
    boxShadow: ["none", "none", "none"],
    buttonLabel: ["Action", "Action", "Action"],
    buttonVariant: "PRIMARY",
  },
  customColumn1: {
    allowCellWrapping: false,
    index: 4,
    width: 150,
    originalId: "customColumn1",
    id: "customColumn1",
    alias: "customColumn1",
    horizontalAlignment: "LEFT",
    verticalAlignment: "CENTER",
    columnType: "menuButton",
    textSize: "0.875rem",
    enableFilter: true,
    enableSort: true,
    isVisible: true,
    isDisabled: false,
    isCellEditable: false,
    isEditable: false,
    isCellVisible: true,
    isDerived: true,
    label: "menu",
    isSaveVisible: true,
    isDiscardVisible: true,
    computedValue: "",
    buttonStyle: "rgb(3, 179, 101)",
    labelColor: "#FFFFFF",
    menuColor: ["#553DE9", "#553DE9", "#553DE9"],
    borderRadius: ["0.375rem", "0.375rem", "0.375rem"],
    boxShadow: ["none", "none", "none"],
    customAlias: "",
    menuButtonLabel: ["Open Menu", "Open Menu", "Open Menu"],
    menuVariant: "PRIMARY",
    menuButtoniconName: "",
  },
  customColumn2: {
    allowCellWrapping: false,
    index: 5,
    width: 150,
    originalId: "customColumn2",
    id: "customColumn2",
    alias: "customColumn2",
    horizontalAlignment: "LEFT",
    verticalAlignment: "CENTER",
    columnType: "iconButton",
    textSize: "0.875rem",
    enableFilter: true,
    enableSort: true,
    isVisible: true,
    isDisabled: false,
    isCellEditable: false,
    isEditable: false,
    isCellVisible: true,
    isDerived: true,
    label: "icon",
    isSaveVisible: true,
    isDiscardVisible: true,
    computedValue: "",
    buttonStyle: "rgb(3, 179, 101)",
    labelColor: "#FFFFFF",
    buttonColor: ["#553DE9", "#553DE9", "#553DE9"],
    borderRadius: ["0.375rem", "0.375rem", "0.375rem"],
    boxShadow: ["none", "none", "none"],
    customAlias: "",
    buttonVariant: "PRIMARY",
    iconName: "add",
  },
};
const sampleProcessedTableData = [
  {
    step: "#1",
    task: "Drop a table",
    status: "✅",
    action: "",
    __originalIndex__: 0,
  },
  {
    step: "#2",
    task: "Create a query fetch_users with the Mock DB",
    status: "--",
    action: "",
    __originalIndex__: 1,
  },
  {
    step: "#3",
    task: "Bind the query using => fetch_users.data",
    status: "--",
    action: "",
    __originalIndex__: 2,
  },
];

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
          value: "Khafaga"
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
          isAscOrder: false
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
          isAscOrder: undefined
        }
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
          isAscOrder: undefined
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
          isAscOrder: false
        }
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

  it("Single row selection should not have non data columns", () => {
    const { getSelectedRow } = derivedProperty;
    const input = {
      multiRowSelection: false,
      selectedRowIndices: [],
      selectedRowIndex: 1,
      processedTableData: sampleProcessedTableData,
      primaryColumns: samplePrimaryColumns,
    };

    expect(getSelectedRow(input, moment, _)).toStrictEqual({
      step: "#2",
      task: "Create a query fetch_users with the Mock DB",
      status: "--",
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

  it("for removal of non data columns", () => {
    const { getTriggeredRow } = derivedProperty;
    const input = {
      triggeredRowIndex: 1,
      processedTableData: sampleProcessedTableData,
      primaryColumns: samplePrimaryColumns,
    };

    expect(getTriggeredRow(input, moment, _)).toStrictEqual({
      step: "#2",
      task: "Create a query fetch_users with the Mock DB",
      status: "--",
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

  it("for removal of non data columns", () => {
    const { getSelectedRows } = derivedProperty;
    const input = {
      multiRowSelection: true,
      selectedRowIndices: [1],
      processedTableData: sampleProcessedTableData,
      primaryColumns: samplePrimaryColumns,
    };

    expect(getSelectedRows(input, moment, _)).toStrictEqual([
      {
        step: "#2",
        task: "Create a query fetch_users with the Mock DB",
        status: "--",
      },
    ]);
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

  it("Verify for removal of non data columns", () => {
    const { getUpdatedRows } = derivedProperty;
    const input = {
      transientTableData: {
        0: {
          task: "Drop a table first",
        },
      },
      primaryColumnId: "step",
      processedTableData: sampleProcessedTableData,
      primaryColumns: samplePrimaryColumns,
    };

    expect(getUpdatedRows(input, moment, _)).toStrictEqual([
      {
        index: 0,
        step: "#1",
        updatedFields: {
          task: "Drop a table first",
        },
        allFields: {
          step: "#1",
          task: "Drop a table",
          status: "✅",
        },
      },
    ]);
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

describe("getPageOffset -", () => {
  it("should return 0 when pageNo is null", () => {
    const { getPageOffset } = derivedProperty;

    expect(
      getPageOffset({
        pageNo: null,
        pageSize: 0,
      }),
    ).toEqual(0);
  });

  it("should return 0 when pageSize is null", () => {
    const { getPageOffset } = derivedProperty;

    expect(
      getPageOffset({
        pageNo: 0,
        pageSize: null,
      }),
    ).toEqual(0);
  });

  it("should return 0 when pageSize is undefined", () => {
    const { getPageOffset } = derivedProperty;

    expect(
      getPageOffset({
        pageNo: 0,
        pageSize: undefined,
      }),
    ).toEqual(0);
  });

  it("should return 0 when pageNo is undefined", () => {
    const { getPageOffset } = derivedProperty;

    expect(
      getPageOffset({
        pageNo: undefined,
        pageSize: 0,
      }),
    ).toEqual(0);
  });

  it("should return 0 when pageSize is 0 and pageNo is any random number >= 0", () => {
    const { getPageOffset } = derivedProperty;

    expect(
      getPageOffset({
        pageNo: 10,
        pageSize: 0,
      }),
    ).toEqual(0);
  });

  it("should return 0 when pageNo is 0 and pageSize is any random number >= 0", () => {
    const { getPageOffset } = derivedProperty;

    expect(
      getPageOffset({
        pageNo: 0,
        pageSize: 100,
      }),
    ).toEqual(0);
  });

  it("should return 0 when pageNo is NaN", () => {
    const { getPageOffset } = derivedProperty;

    expect(
      getPageOffset({
        pageNo: NaN,
        pageSize: 0,
      }),
    ).toEqual(0);
  });

  it("should return 10 when pageSize is 5 and pageNo is 3", () => {
    const { getPageOffset } = derivedProperty;

    expect(
      getPageOffset({
        pageNo: 3,
        pageSize: 5,
      }),
    ).toEqual(10);
  });
});

describe("validate getUpdatedRow", () => {
  it("should check that valid updated row index returns the valid value", () => {
    const { getUpdatedRow } = derivedProperty;
    const input1 = {
      updatedRowIndex: 1,
      processedTableData: [
        { id: 1234, name: "Jim Doe", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe1", extra: "Extra1", __originalIndex__: 1 },
      ],
    };
    const input2 = {
      updatedRowIndex: 0,
      processedTableData: [
        { id: 1, name: "Lorem Ipsum", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getUpdatedRow(input1, moment, _)).toStrictEqual({
      id: 123,
      name: "John Doe1",
      extra: "Extra1",
    });
    expect(getUpdatedRow(input2, moment, _)).toStrictEqual({
      id: 1,
      name: "Lorem Ipsum",
      extra: "",
    });
  });

  it("should check that it returns empty values when updateRowIndex is invalid or -1", () => {
    const { getUpdatedRow } = derivedProperty;
    const input1 = {
      updatedRowIndex: -1,
      processedTableData: [
        { id: 1, name: "Lorem Ipsum", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };
    const input2 = {
      updatedRowIndex: "dummyIndex",
      processedTableData: [
        { id: 1, name: "Lorem Ipsum", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    const input3 = {
      updatedRowIndex: undefined,
      processedTableData: [
        { id: 1, name: "Lorem Ipsum", extra: "", __originalIndex__: 0 },
        { id: 234, name: "Jane Doe", extra: "Extra2", __originalIndex__: 2 },
        { id: 123, name: "John Doe", extra: "Extra1", __originalIndex__: 1 },
      ],
    };

    expect(getUpdatedRow(input1, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });

    expect(getUpdatedRow(input2, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });

    expect(getUpdatedRow(input3, moment, _)).toStrictEqual({
      id: "",
      name: "",
      extra: "",
    });
  });

  it("should check that it removes non data columns", () => {
    const { getUpdatedRow } = derivedProperty;
    const input = {
      updatedRowIndex: 1,
      processedTableData: sampleProcessedTableData,
      primaryColumns: samplePrimaryColumns,
    };

    expect(getUpdatedRow(input, moment, _)).toStrictEqual({
      step: "#2",
      task: "Create a query fetch_users with the Mock DB",
      status: "--",
    });
  });
});
describe("getEditableCellValidity", () => {
  const { getEditableCellValidity } = derivedProperty;

  it("should test that its returns empty object when editableCell is empty and isAddRowInProgess is false", () => {
    expect(
      getEditableCellValidity(
        {
          editableCell: {},
          isAddRowInProgress: false,
        },
        null,
        _,
      ),
    ).toEqual({});
  });

  describe("should test that it validates the editableColumn against all the validation properties", () => {
    it("should return true for editable column when validation is empty", () => {
      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: "",
            },
            primaryColumns: {
              step: {
                columnType: "text",
                alias: "step",
                validation: {},
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });

      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: "123",
            },
            primaryColumns: {
              step: {
                columnType: "text",
                alias: "step",
                validation: {},
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });
    });

    it("should return true for editable column when isColumnEditableCellRequired is off and there is no value", () => {
      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: "",
            },
            primaryColumns: {
              step: {
                columnType: "text",
                alias: "step",
                validation: {
                  isColumnEditableCellRequired: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });

      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: undefined,
            },
            primaryColumns: {
              step: {
                columnType: "text",
                alias: "step",
                validation: {
                  isColumnEditableCellRequired: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });

      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: null,
            },
            primaryColumns: {
              step: {
                columnType: "text",
                alias: "step",
                validation: {
                  isColumnEditableCellRequired: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });
    });

    it("should return true for editable column when isColumnEditableCellValid is true", () => {
      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: null,
            },
            primaryColumns: {
              step: {
                columnType: "text",
                alias: "step",
                validation: {
                  isColumnEditableCellValid: true,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });
    });

    it("should return false for editable column when isColumnEditableCellValid is false", () => {
      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: "test",
            },
            primaryColumns: {
              step: {
                columnType: "text",
                alias: "step",
                validation: {
                  isColumnEditableCellValid: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });
    });

    it("should return true for editable column when regex is matching", () => {
      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: "#1",
            },
            primaryColumns: {
              step: {
                columnType: "text",
                alias: "step",
                validation: {
                  regex: "^#1$",
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });

      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: "test",
            },
            primaryColumns: {
              step: {
                columnType: "text",
                alias: "step",
                validation: {
                  regex: "^test$",
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });
    });

    it("should return false for editable column when regex is not matching", () => {
      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: "test",
            },
            primaryColumns: {
              step: {
                columnType: "text",
                alias: "step",
                validation: {
                  regex: "^#1$",
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });

      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: "#1",
            },
            primaryColumns: {
              step: {
                columnType: "text",
                alias: "step",
                validation: {
                  regex: "^test$",
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });
    });

    it("should return false for editable column when isColumnEditableCellRequired is true and there is no value", () => {
      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: "",
            },
            primaryColumns: {
              step: {
                columnType: "text",
                alias: "step",
                validation: {
                  isColumnEditableCellRequired: true,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });
    });

    it("should return true for editable column when isColumnEditableCellRequired and there is value", () => {
      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: "test",
            },
            primaryColumns: {
              step: {
                columnType: "text",
                alias: "step",
                validation: {
                  isColumnEditableCellRequired: true,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });
    });

    it("should return true for editable column when value is above min", () => {
      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: 1,
            },
            primaryColumns: {
              step: {
                columnType: "number",
                alias: "step",
                validation: {
                  min: 0,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });
    });

    it("should return false for editable column when value is below min", () => {
      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: -1,
            },
            primaryColumns: {
              step: {
                columnType: "number",
                alias: "step",
                validation: {
                  min: 0,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });
    });

    it("should return true for editable column when value is below max", () => {
      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: 2,
            },
            primaryColumns: {
              step: {
                columnType: "number",
                alias: "step",
                validation: {
                  max: 5,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });
    });

    it("should return false for editable column when value is above max", () => {
      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: 6,
            },
            primaryColumns: {
              step: {
                columnType: "number",
                alias: "step",
                validation: {
                  max: 5,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });
    });

    it("should return true for editable column when value is matching all the validation criteria", () => {
      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: "#1",
            },
            primaryColumns: {
              step: {
                columnType: "text",
                alias: "step",
                validation: {
                  isColumnEditableCellValid: false,
                  regex: "^#1$",
                  isColumnEditableCellRequired: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });

      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: "#1",
            },
            primaryColumns: {
              step: {
                alias: "step",
                columnType: "text",
                validation: {
                  isColumnEditableCellValid: true,
                  regex: "^#1$",
                  isColumnEditableCellRequired: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });

      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: "#1",
            },
            primaryColumns: {
              step: {
                alias: "step",
                columnType: "text",
                validation: {
                  isColumnEditableCellValid: true,
                  regex: "^#1$",
                  isColumnEditableCellRequired: true,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });

      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: "#1",
            },
            primaryColumns: {
              step: {
                alias: "step",
                columnType: "text",
                validation: {
                  isColumnEditableCellValid: true,
                  regex: "^#2$",
                  isColumnEditableCellRequired: true,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });

      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: "#1",
            },
            primaryColumns: {
              step: {
                alias: "step",
                columnType: "text",
                validation: {
                  isColumnEditableCellValid: true,
                  regex: "^#2$",
                  isColumnEditableCellRequired: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });
    });
  });

  describe("should test that it validates the new row against all the validation properties", () => {
    it("should check that only editable columns are present in the validation object", () => {
      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: "#1",
              task: "test",
            },
            primaryColumns: {
              step: {
                isEditable: true,
                columnType: "text",
                alias: "step",
                validation: {},
              },
              task: {
                columnType: "text",
                alias: "task",
                validation: {},
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });

      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: "#1",
              task: "test",
            },
            primaryColumns: {
              step: {
                columnType: "text",
                alias: "step",
                validation: {},
              },
              task: {
                isEditable: true,
                columnType: "text",
                alias: "task",
                validation: {},
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ task: true });

      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: "#1",
              task: "test",
            },
            primaryColumns: {
              step: {
                isEditable: true,
                columnType: "text",
                alias: "step",
                validation: {},
              },
              task: {
                isEditable: true,
                columnType: "text",
                alias: "task",
                validation: {},
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true, task: true });
    });

    it("should return true for editable columns when validation is empty", () => {
      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: "#1",
              task: "test",
            },
            primaryColumns: {
              step: {
                isEditable: true,
                columnType: "text",
                alias: "step",
                validation: {},
              },
              task: {
                isEditable: true,
                columnType: "text",
                alias: "task",
                validation: {},
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true, task: true });
    });

    it("should return true for editable columns when isColumnEditableCellRequired is off and there is no value", () => {
      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: "#1",
            },
            primaryColumns: {
              step: {
                isEditable: true,
                columnType: "text",
                alias: "step",
                validation: {
                  isColumnEditableCellRequired: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });

      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: undefined,
            },
            primaryColumns: {
              step: {
                isEditable: true,
                columnType: "text",
                alias: "step",
                validation: {
                  isColumnEditableCellRequired: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });

      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: null,
            },
            primaryColumns: {
              step: {
                isEditable: true,
                columnType: "text",
                alias: "step",
                validation: {
                  isColumnEditableCellRequired: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });
    });

    it("should return true for editable columns when isColumnEditableCellValid is true", () => {
      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: null,
            },
            primaryColumns: {
              step: {
                isEditable: true,
                columnType: "text",
                alias: "step",
                validation: {
                  isColumnEditableCellValid: true,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });
    });

    it("should return false for editable columns when isColumnEditableCellValid is false", () => {
      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: "test",
            },
            primaryColumns: {
              step: {
                isEditable: true,
                columnType: "text",
                alias: "step",
                validation: {
                  isColumnEditableCellValid: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });
    });

    it("should return true for editable columns when regex is matching", () => {
      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: "#1",
            },
            primaryColumns: {
              step: {
                isEditable: true,
                columnType: "text",
                alias: "step",
                validation: {
                  regex: "^#1$",
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });

      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: "test",
            },
            primaryColumns: {
              step: {
                isEditable: true,
                columnType: "text",
                alias: "step",
                validation: {
                  regex: "^test$",
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });
    });

    it("should return false for editable columns when regex is not matching", () => {
      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: "test",
            },
            primaryColumns: {
              step: {
                isEditable: true,
                columnType: "text",
                alias: "step",
                validation: {
                  regex: "^#1$",
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });

      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: "#1",
            },
            primaryColumns: {
              step: {
                isEditable: true,
                columnType: "text",
                alias: "step",
                validation: {
                  regex: "^test$",
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });
    });

    it("should return false for editable columns when isColumnEditableCellRequired is true and there is no value", () => {
      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: "",
            },
            primaryColumns: {
              step: {
                isEditable: true,
                columnType: "text",
                alias: "step",
                validation: {
                  isColumnEditableCellRequired: true,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });
    });

    it("should return true for editable columns when isColumnEditableCellRequired and there is value", () => {
      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: "test",
            },
            primaryColumns: {
              step: {
                isEditable: true,
                columnType: "text",
                alias: "step",
                validation: {
                  isColumnEditableCellRequired: true,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });
    });

    it("should return true for editable columns when value is above min", () => {
      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: 1,
            },
            primaryColumns: {
              step: {
                isEditable: true,
                columnType: "number",
                alias: "step",
                validation: {
                  min: 0,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });
    });

    it("should return false for editable columns when value is below min", () => {
      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: -1,
            },
            primaryColumns: {
              step: {
                isEditable: true,
                columnType: "number",
                alias: "step",
                validation: {
                  min: 0,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });
    });

    it("should return true for editable columns when value is below max", () => {
      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: 2,
            },
            primaryColumns: {
              step: {
                isEditable: true,
                columnType: "number",
                alias: "step",
                validation: {
                  max: 5,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });
    });

    it("should return false for editable columns when value is above max", () => {
      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: 6,
            },
            primaryColumns: {
              step: {
                isEditable: true,
                columnType: "number",
                alias: "step",
                validation: {
                  max: 5,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });
    });

    it("should return true for editable columns when value is matching all the validation criteria", () => {
      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: "#1",
            },
            primaryColumns: {
              step: {
                isEditable: true,
                columnType: "text",
                alias: "step",
                validation: {
                  isColumnEditableCellValid: false,
                  regex: "^#1$",
                  isColumnEditableCellRequired: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });

      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: "#1",
            },
            primaryColumns: {
              step: {
                isEditable: true,
                alias: "step",
                columnType: "text",
                validation: {
                  isColumnEditableCellValid: true,
                  regex: "^#1$",
                  isColumnEditableCellRequired: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });

      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: "#1",
            },
            primaryColumns: {
              step: {
                isEditable: true,
                alias: "step",
                columnType: "text",
                validation: {
                  isColumnEditableCellValid: true,
                  regex: "^#1$",
                  isColumnEditableCellRequired: true,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });

      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: "#1",
            },
            primaryColumns: {
              step: {
                isEditable: true,
                alias: "step",
                columnType: "text",
                validation: {
                  isColumnEditableCellValid: true,
                  regex: "^#2$",
                  isColumnEditableCellRequired: true,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });

      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: "#1",
            },
            primaryColumns: {
              step: {
                isEditable: true,
                alias: "step",
                columnType: "text",
                validation: {
                  isColumnEditableCellValid: true,
                  regex: "^#2$",
                  isColumnEditableCellRequired: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });
    });

    it("should check that more than one column is validated at the same time", () => {
      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: "#1",
              task: "test",
            },
            primaryColumns: {
              step: {
                isEditable: true,
                columnType: "text",
                alias: "step",
                validation: {
                  isColumnEditableCellValid: false,
                  regex: "^#1$",
                  isColumnEditableCellRequired: false,
                },
              },
              task: {
                isEditable: true,
                columnType: "text",
                alias: "task",
                validation: {
                  isColumnEditableCellValid: true,
                  regex: "test",
                  isColumnEditableCellRequired: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false, task: true });

      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: "#1",
              task: "test",
            },
            primaryColumns: {
              step: {
                isEditable: true,
                columnType: "text",
                alias: "step",
                validation: {
                  isColumnEditableCellValid: true,
                  regex: "^#1$",
                  isColumnEditableCellRequired: false,
                },
              },
              task: {
                isEditable: true,
                columnType: "text",
                alias: "task",
                validation: {
                  isColumnEditableCellValid: true,
                  regex: "test",
                  isColumnEditableCellRequired: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true, task: true });
    });
  });
});

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
