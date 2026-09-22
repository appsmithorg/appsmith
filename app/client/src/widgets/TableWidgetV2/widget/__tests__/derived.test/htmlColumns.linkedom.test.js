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
    const input = buildPlainTextInput();

    input.tableData = [
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
    input.processedTableData = [
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
    ];
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
});
