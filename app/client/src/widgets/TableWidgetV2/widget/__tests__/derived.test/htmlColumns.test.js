import _ from "lodash";
import moment from "moment";
import derivedProperty from "../../derived";

describe("HTML columns", () => {
  const input = {
    tableData: [
      {
        id: 1,
        name: "Jim Doe",
        status: "<span style='color: green;'>Active</span>",
      },
      {
        id: 2,
        name: "Usain Bolt",
        status: "<span style='color: yellow;'>Pending</span>",
      },
      {
        id: 3,
        name: "Elon Musk",
        status: "<span style='color: green;'>Active</span>",
      },
    ],
    processedTableData: [
      {
        id: 1,
        name: "Jim Doe",
        status: "<span style='color: green;'>Active</span>",
        __originalIndex__: 0,
      },
      {
        id: 2,
        name: "Usain Bolt",
        status: "<span style='color: yellow;'>Pending</span>",
        __originalIndex__: 1,
      },
      {
        id: 3,
        name: "Elon Musk",
        status: "<span style='color: green;'>Active</span>",
        __originalIndex__: 2,
      },
    ],
    sortOrder: { column: "id", order: "asc" },
    columnOrder: ["id", "name", "status"],
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
      status: {
        index: 0,
        width: 150,
        id: "status",
        alias: "status",
        originalId: "status",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "html",
        textColor: "#231F20",
        textSize: "PARAGRAPH",
        fontStyle: "REGULAR",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "Status",
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
      {
        index: 0,
        width: 150,
        id: "status",
        alias: "status",
        originalId: "status",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "html",
        textColor: "#231F20",
        textSize: "PARAGRAPH",
        fontStyle: "REGULAR",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isDerived: false,
        label: "Status",
        isAscOrder: undefined,
      },
    ],
  };

  input.orderedTableColumns = Object.values(input.primaryColumns).sort(
    (a, b) => {
      return input.columnOrder[a.id] < input.columnOrder[b.id];
    },
  );
  const { getFilteredTableData } = derivedProperty;

  it("validate search on table for HTML columns", () => {
    input.searchText = "Pending";
    const expected = [
      {
        id: 2,
        name: "Usain Bolt",
        status: "<span style='color: yellow;'>Pending</span>",
        __originalIndex__: 1,
      },
    ];

    let result = getFilteredTableData(input, moment, _);

    expect(result).toStrictEqual(expected);
    delete input.searchText;
  });

  it("validates filters on table for HTML columns", () => {
    input.filters = [
      {
        condition: "contains",
        column: "status",
        value: "Active",
      },
    ];
    const expected = [
      {
        id: 1,
        name: "Jim Doe",
        status: "<span style='color: green;'>Active</span>",
        __originalIndex__: 0,
      },
      {
        id: 3,
        name: "Elon Musk",
        status: "<span style='color: green;'>Active</span>",
        __originalIndex__: 2,
      },
    ];

    let result = getFilteredTableData(input, moment, _);

    expect(result).toStrictEqual(expected);
    delete input.filters;
  });

  it("validates sort on table for HTML columns", () => {
    input.sortOrder = { column: "status", order: "desc" };
    let expected = [
      {
        id: 2,
        name: "Usain Bolt",
        status: "<span style='color: yellow;'>Pending</span>",
        __originalIndex__: 1,
      },
      {
        id: 1,
        name: "Jim Doe",
        status: "<span style='color: green;'>Active</span>",
        __originalIndex__: 0,
      },
      {
        id: 3,
        name: "Elon Musk",
        status: "<span style='color: green;'>Active</span>",
        __originalIndex__: 2,
      },
    ];

    let result = getFilteredTableData(input, moment, _);

    expect(result).toStrictEqual(expected);

    input.sortOrder = { column: "status", order: "asc" };
    expected = [
      {
        id: 3,
        name: "Elon Musk",
        status: "<span style='color: green;'>Active</span>",
        __originalIndex__: 2,
      },
      {
        id: 1,
        name: "Jim Doe",
        status: "<span style='color: green;'>Active</span>",
        __originalIndex__: 0,
      },

      {
        id: 2,
        name: "Usain Bolt",
        status: "<span style='color: yellow;'>Pending</span>",
        __originalIndex__: 1,
      },
    ];

    result = getFilteredTableData(input, moment, _);
    expect(result).toStrictEqual(expected);
  });

  it("validates tags are not filterable in html content", () => {
    input.filters = [
      {
        condition: "contains",
        column: "status",
        value: "span",
      },
    ];
    const expected = [];

    let result = getFilteredTableData(input, moment, _);

    expect(result).toStrictEqual(expected);

    input.filters = [
      {
        condition: "contains",
        column: "status",
        value: "color",
      },
    ];
    result = getFilteredTableData(input, moment, _);
    expect(result).toStrictEqual(expected);
    delete input.filters;
  });
  it("validates tags are not searchable in html content", () => {
    input.searchText = "span";

    const expected = [];

    let result = getFilteredTableData(input, moment, _);

    expect(result).toStrictEqual(expected);

    input.searchText = "color";
    result = getFilteredTableData(input, moment, _);
    expect(result).toStrictEqual(expected);
    delete input.searchText;
  });

  it("validates multiple HTML column filters with AND condition", () => {
    const multiFilterInput = _.cloneDeep(input);

    multiFilterInput.processedTableData = [
      {
        id: 1,
        name: "Jim Doe",
        status: "<span style='color: green;'>Active</span>",
        role: "<div>Admin</div>",
        __originalIndex__: 0,
      },
      {
        id: 2,
        name: "Usain Bolt",
        status: "<span style='color: yellow;'>Pending</span>",
        role: "<div>User</div>",
        __originalIndex__: 1,
      },
      {
        id: 3,
        name: "Elon Musk",
        status: "<span style='color: green;'>Active</span>",
        role: "<div>Admin</div>",
        __originalIndex__: 2,
      },
    ];

    multiFilterInput.primaryColumns.role = {
      index: 3,
      width: 150,
      id: "role",
      alias: "role",
      originalId: "role",
      horizontalAlignment: "LEFT",
      verticalAlignment: "CENTER",
      columnType: "html",
      textColor: "#231F20",
      textSize: "PARAGRAPH",
      fontStyle: "REGULAR",
      enableFilter: true,
      enableSort: true,
      isVisible: true,
      isDerived: false,
      label: "Role",
      isAscOrder: undefined,
    };

    multiFilterInput.filters = [
      {
        condition: "contains",
        column: "status",
        value: "Active",
      },
      {
        condition: "contains",
        column: "role",
        value: "Admin",
        operator: "AND",
      },
    ];

    const expected = [
      {
        id: 3,
        name: "Elon Musk",
        status: "<span style='color: green;'>Active</span>",
        role: "<div>Admin</div>",
        __originalIndex__: 2,
      },
      {
        id: 1,
        name: "Jim Doe",
        status: "<span style='color: green;'>Active</span>",
        role: "<div>Admin</div>",
        __originalIndex__: 0,
      },
    ];

    let result = getFilteredTableData(multiFilterInput, moment, _);

    expect(result).toStrictEqual(expected);
    delete input.filters;
  });

  it("validates complex HTML content with nested elements and attributes", () => {
    const complexHTMLInput = _.cloneDeep(input);

    complexHTMLInput.processedTableData = [
      {
        id: 1,
        name: "Jim Doe",
        status:
          '<div class="status-badge"><span style="color: green">Active</span></div>',
        __originalIndex__: 0,
      },
      {
        id: 2,
        name: "Usain Bolt",
        status:
          '<div class="status-badge"><span style="color: orange">Pending</span></div>',
        __originalIndex__: 1,
      },
      {
        id: 3,
        name: "Elon Musk",
        status:
          '<div class="status-badge"><span style="color: green">Active</span></div>',
        __originalIndex__: 2,
      },
    ];

    // Test searching through complex HTML
    complexHTMLInput.searchText = "Active";
    let expected = [
      {
        id: 3,
        name: "Elon Musk",
        status:
          '<div class="status-badge"><span style="color: green">Active</span></div>',
        __originalIndex__: 2,
      },
      {
        id: 1,
        name: "Jim Doe",
        status:
          '<div class="status-badge"><span style="color: green">Active</span></div>',
        __originalIndex__: 0,
      },
    ];

    let result = getFilteredTableData(complexHTMLInput, moment, _);

    expect(result).toStrictEqual(expected);
    delete complexHTMLInput.searchText;

    // Test sorting with complex HTML
    complexHTMLInput.sortOrder = { column: "status", order: "desc" };
    expected = [
      {
        id: 2,
        name: "Usain Bolt",
        status:
          '<div class="status-badge"><span style="color: orange">Pending</span></div>',
        __originalIndex__: 1,
      },
      {
        id: 1,
        name: "Jim Doe",
        status:
          '<div class="status-badge"><span style="color: green">Active</span></div>',
        __originalIndex__: 0,
      },
      {
        id: 3,
        name: "Elon Musk",
        status:
          '<div class="status-badge"><span style="color: green">Active</span></div>',
        __originalIndex__: 2,
      },
    ];

    result = getFilteredTableData(complexHTMLInput, moment, _);
    expect(result).toStrictEqual(expected);
  });

  it("validates HTML columns with special characters and entities", () => {
    const specialCharHTMLInput = _.cloneDeep(input);

    specialCharHTMLInput.processedTableData = [
      {
        id: 1,
        name: "Jim Doe",
        status: "<span>&copy; Active &amp; Ready</span>",
        __originalIndex__: 0,
      },
      {
        id: 2,
        name: "Usain Bolt",
        status: "<span>Pending &gt; Review</span>",
        __originalIndex__: 1,
      },
      {
        id: 3,
        name: "Elon Musk",
        status: "<span>&copy; Active &amp; Ready</span>",
        __originalIndex__: 2,
      },
    ];

    // Test filtering with HTML entities
    specialCharHTMLInput.filters = [
      {
        condition: "contains",
        column: "status",
        value: "Active & Ready",
      },
    ];

    const expected = [
      {
        id: 3,
        name: "Elon Musk",
        status: "<span>&copy; Active &amp; Ready</span>",
        __originalIndex__: 2,
      },
      {
        id: 1,
        name: "Jim Doe",
        status: "<span>&copy; Active &amp; Ready</span>",
        __originalIndex__: 0,
      },
    ];

    let result = getFilteredTableData(specialCharHTMLInput, moment, _);

    expect(result).toStrictEqual(expected);
    delete specialCharHTMLInput.filters;
  });

  it("validates filtering with null and undefined values in HTML columns", () => {
    const nullUndefinedInput = _.cloneDeep(input);

    nullUndefinedInput.processedTableData = [
      {
        id: 1,
        name: "Jim Doe",
        status: null,
        __originalIndex__: 0,
      },
      {
        id: 2,
        name: "Usain Bolt",
        status: undefined,
        __originalIndex__: 1,
      },
      {
        id: 3,
        name: "Elon Musk",
        status: "<span>Active</span>",
        __originalIndex__: 2,
      },
    ];

    // Test filtering for null values
    nullUndefinedInput.filters = [
      {
        condition: "contains",
        column: "status",
        value: "null",
      },
    ];

    let result = getFilteredTableData(nullUndefinedInput, moment, _);

    expect(result).toStrictEqual([]);

    // Test filtering for undefined values
    nullUndefinedInput.filters = [
      {
        condition: "contains",
        column: "status",
        value: "undefined",
      },
    ];

    result = getFilteredTableData(nullUndefinedInput, moment, _);
    expect(result).toStrictEqual([]);

    delete nullUndefinedInput.filters;
  });
});
