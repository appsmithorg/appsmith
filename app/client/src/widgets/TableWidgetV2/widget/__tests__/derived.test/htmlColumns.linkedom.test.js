/**
 * Regression tests for HTML-column search/filter/sort under linkedom,
 * matching the evaluation worker DOM (SetupDOM.ts).
 *
 * Jest's default jsdom DOMParser handles plain text; linkedom throws on
 * doc.body for non-HTML strings — so these tests must run in a separate file
 * that installs linkedom onto global and restores it afterward.
 */
import _ from "lodash";
import moment from "moment";
import * as documentMock from "linkedom/worker";
import derivedProperty from "../../derived";

describe("HTML columns under linkedom (evaluation worker DOM)", () => {
  let previousDOMParser;
  let previousDocument;
  let previousWindow;

  beforeAll(() => {
    previousDOMParser = global.DOMParser;
    previousDocument = global.document;
    previousWindow = global.window;

    for (const [key, value] of Object.entries(documentMock)) {
      global[key] = value;
    }

    const dom = documentMock.parseHTML(`<!DOCTYPE html><body></body>`);

    global.window = dom.window;
    global.document = dom.window.document;
  });

  afterAll(() => {
    global.DOMParser = previousDOMParser;
    global.document = previousDocument;
    global.window = previousWindow;
  });

  const buildPlainTextInput = () => {
    const input = {
      tableData: [
        { id: 1, name: "Jim Doe", status: "Active" },
        { id: 2, name: "Usain Bolt", status: "Pending" },
        { id: 3, name: "Elon Musk", status: "Active" },
      ],
      processedTableData: [
        { id: 1, name: "Jim Doe", status: "Active", __originalIndex__: 0 },
        {
          id: 2,
          name: "Usain Bolt",
          status: "Pending",
          __originalIndex__: 1,
        },
        { id: 3, name: "Elon Musk", status: "Active", __originalIndex__: 2 },
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
          columnType: "number",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "id",
        },
        name: {
          index: 0,
          width: 150,
          id: "name",
          alias: "name",
          originalId: "name",
          columnType: "text",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "name",
        },
        status: {
          index: 2,
          width: 150,
          id: "status",
          alias: "status",
          originalId: "status",
          columnType: "html",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "Status",
        },
      },
    };

    input.orderedTableColumns = Object.values(input.primaryColumns);

    return input;
  };

  const buildTaggedHtmlInput = () => {
    const input = buildPlainTextInput();
    const taggedRows = [
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
    ];

    input.tableData = taggedRows;
    input.processedTableData = taggedRows.map((row, index) => ({
      ...row,
      __originalIndex__: index,
    }));

    return input;
  };

  const { getFilteredTableData } = derivedProperty;

  it("searches plain-text values in HTML columns", () => {
    const input = buildPlainTextInput();

    input.searchText = "Pending";

    const result = getFilteredTableData(input, moment, _);

    expect(result).toStrictEqual([
      {
        id: 2,
        name: "Usain Bolt",
        status: "Pending",
        __originalIndex__: 1,
      },
    ]);
  });

  it("filters plain-text values in HTML columns with contains", () => {
    const input = buildPlainTextInput();

    input.filters = [
      {
        condition: "contains",
        column: "status",
        value: "Active",
      },
    ];

    const result = getFilteredTableData(input, moment, _);

    expect(result).toStrictEqual([
      {
        id: 1,
        name: "Jim Doe",
        status: "Active",
        __originalIndex__: 0,
      },
      {
        id: 3,
        name: "Elon Musk",
        status: "Active",
        __originalIndex__: 2,
      },
    ]);
  });

  it("sorts plain-text values in HTML columns by display text", () => {
    const input = buildPlainTextInput();

    input.sortOrder = { column: "status", order: "desc" };

    const result = getFilteredTableData(input, moment, _);

    expect(result.map((row) => row.status)).toStrictEqual([
      "Pending",
      "Active",
      "Active",
    ]);
  });

  it("searches tagged HTML values via strip-tags fallback under linkedom", () => {
    const input = buildTaggedHtmlInput();

    input.searchText = "Pending";

    const result = getFilteredTableData(input, moment, _);

    expect(result).toStrictEqual([
      {
        id: 2,
        name: "Usain Bolt",
        status: "<span style='color: yellow;'>Pending</span>",
        __originalIndex__: 1,
      },
    ]);
  });

  it("does not search tagged HTML by tag names or attributes", () => {
    const input = buildTaggedHtmlInput();

    input.searchText = "span";
    expect(getFilteredTableData(input, moment, _)).toStrictEqual([]);

    input.searchText = "color";
    expect(getFilteredTableData(input, moment, _)).toStrictEqual([]);
  });

  it("filters tagged HTML values by displayed text with contains", () => {
    const input = buildTaggedHtmlInput();

    input.filters = [
      {
        condition: "contains",
        column: "status",
        value: "Active",
      },
    ];

    const result = getFilteredTableData(input, moment, _);

    expect(result).toStrictEqual([
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
    ]);
  });

  it("does not filter tagged HTML by tag names or attributes", () => {
    const input = buildTaggedHtmlInput();

    input.filters = [
      {
        condition: "contains",
        column: "status",
        value: "span",
      },
    ];
    expect(getFilteredTableData(input, moment, _)).toStrictEqual([]);

    input.filters = [
      {
        condition: "contains",
        column: "status",
        value: "color",
      },
    ];
    expect(getFilteredTableData(input, moment, _)).toStrictEqual([]);
  });

  it("sorts tagged HTML values by displayed text descending", () => {
    const input = buildTaggedHtmlInput();
    /*
     * Use tag names whose lexicographic order is the opposite of display text:
     * raw HTML desc would put <span>Active before <div>Pending (s > d),
     * while display-text desc puts Pending before Active.
     */
    const sortRows = [
      { id: 1, name: "Jim Doe", status: "<span>Active</span>" },
      { id: 2, name: "Usain Bolt", status: "<div>Pending</div>" },
      { id: 3, name: "Elon Musk", status: "<span>Active</span>" },
    ];

    input.tableData = sortRows;
    input.processedTableData = sortRows.map((row, index) => ({
      ...row,
      __originalIndex__: index,
    }));
    input.sortOrder = { column: "status", order: "desc" };

    const result = getFilteredTableData(input, moment, _);

    expect(result.map((row) => row.status)).toStrictEqual([
      "<div>Pending</div>",
      "<span>Active</span>",
      "<span>Active</span>",
    ]);
  });

  it("does not match search against hidden HTML column extracted text", () => {
    const input = buildPlainTextInput();

    // Production columns usually have computedValue arrays; that is what
    // populates __htmlExtractedText_*__ on the row (the leak path).
    input.primaryColumns.status.computedValue = ["Active", "Pending", "Active"];
    input.primaryColumns.status.isVisible = false;
    input.searchText = "Pending";

    // Hidden HTML "Pending" must not match; only visible columns are searchable.
    expect(getFilteredTableData(input, moment, _)).toStrictEqual([]);

    input.searchText = "Usain";
    expect(getFilteredTableData(input, moment, _)).toStrictEqual([
      {
        id: 2,
        name: "Usain Bolt",
        status: "Pending",
        __originalIndex__: 1,
        __htmlExtractedText_status__: "Pending",
      },
    ]);
  });

  it("still matches search on visible HTML columns after hiding another", () => {
    const input = buildTaggedHtmlInput();

    input.primaryColumns.status.computedValue = [
      "<span style='color: green;'>Active</span>",
      "<span style='color: yellow;'>Pending</span>",
      "<span style='color: green;'>Active</span>",
    ];

    // Unique text only in a second HTML column that we hide.
    input.primaryColumns.notes = {
      index: 3,
      width: 150,
      id: "notes",
      alias: "notes",
      originalId: "notes",
      columnType: "html",
      enableFilter: true,
      enableSort: true,
      isVisible: false,
      isDerived: false,
      label: "Notes",
      computedValue: [
        "<b>UniqueHiddenNote</b>",
        "<b>UniqueHiddenNote</b>",
        "<b>UniqueHiddenNote</b>",
      ],
    };
    input.tableData = input.tableData.map((row) => ({
      ...row,
      notes: "<b>UniqueHiddenNote</b>",
    }));
    input.processedTableData = input.processedTableData.map((row) => ({
      ...row,
      notes: "<b>UniqueHiddenNote</b>",
    }));
    input.orderedTableColumns = Object.values(input.primaryColumns);

    input.searchText = "UniqueHiddenNote";
    expect(getFilteredTableData(input, moment, _)).toStrictEqual([]);

    input.searchText = "Pending";
    expect(getFilteredTableData(input, moment, _)).toStrictEqual([
      {
        id: 2,
        name: "Usain Bolt",
        status: "<span style='color: yellow;'>Pending</span>",
        notes: "<b>UniqueHiddenNote</b>",
        __originalIndex__: 1,
        __htmlExtractedText_status__: "Pending",
        __htmlExtractedText_notes__: "UniqueHiddenNote",
      },
    ]);
  });
});
