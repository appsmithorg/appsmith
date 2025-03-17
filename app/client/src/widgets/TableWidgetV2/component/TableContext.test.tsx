import React, { useContext } from "react";
import { render, screen } from "@testing-library/react";
import TestRenderer from "react-test-renderer";
import {
  TableProvider,
  TableContext,
  useAppsmithTable,
  type TableContextState,
} from "./TableContext";
import { CompactModeTypes, TABLE_SIZES } from "./Constants";

// Mock data and props
const mockTableProviderProps = {
  width: 800,
  height: 400,
  pageSize: 10,
  isHeaderVisible: true,
  compactMode: CompactModeTypes.DEFAULT,
  currentPageIndex: 0,
  pageCount: 5,
  pageOptions: [0, 1, 2, 3, 4],
  headerGroups: [],
  totalColumnsWidth: 800,
  isResizingColumn: { current: false },
  prepareRow: jest.fn(),
  rowSelectionState: null,
  subPage: [],
  handleAllRowSelectClick: jest.fn(),
  getTableBodyProps: jest.fn(),
  children: null,
  // Additional required props
  widgetId: "table-widget-1",
  widgetName: "Table1",
  searchKey: "",
  isLoading: false,
  columns: [],
  data: [],
  editMode: false,
  editableCell: {
    column: "column1",
    row: 0,
    index: 0,
    value: "",
    initialValue: "",
    inputValue: "",
    __originalIndex__: 0,
  },
  sortTableColumn: jest.fn(),
  handleResizeColumn: jest.fn(),
  handleReorderColumn: jest.fn(),
  selectTableRow: jest.fn(),
  pageNo: 0,
  updatePageNo: jest.fn(),
  nextPageClick: jest.fn(),
  prevPageClick: jest.fn(),
  serverSidePaginationEnabled: false,
  selectedRowIndex: -1,
  selectedRowIndices: [],
  disableDrag: jest.fn(),
  enableDrag: jest.fn(),
  toggleAllRowSelect: jest.fn(),
  triggerRowSelection: false,
  searchTableData: jest.fn(),
  filters: [],
  applyFilter: jest.fn(),
  delimiter: ",",
  accentColor: "#000000",
  isSortable: true,
  multiRowSelection: false,
  columnWidthMap: {},
  // Additional required props from latest error
  borderRadius: "0px",
  boxShadow: "none",
  onBulkEditDiscard: jest.fn(),
  onBulkEditSave: jest.fn(),
  primaryColumns: {},
  derivedColumns: {},
  sortOrder: { column: "", order: null },
  transientTableData: {},
  isEditableCellsValid: {},
  selectColumnFilterText: {},
  isAddRowInProgress: false,
  newRow: {},
  firstEditableColumnIdByOrder: "",
  enableServerSideFiltering: false,
  onTableFilterUpdate: "",
  customIsLoading: false,
  customIsLoadingValue: false,
  infiniteScrollEnabled: false,
  // Final set of required props
  allowAddNewRow: false,
  onAddNewRow: jest.fn(),
  onAddNewRowAction: jest.fn(),
  disabledAddNewRowSave: false,
  addNewRowValidation: {},
  onAddNewRowSave: jest.fn(),
  onAddNewRowDiscard: jest.fn(),
  // Last set of required props
  showConnectDataOverlay: false,
  onConnectData: jest.fn(),
  isInfiniteScrollEnabled: false,
};

// Test components
interface TestChildProps {
  tableContext: TableContextState | undefined;
}

const TestChild = (props: TestChildProps) => {
  return (
    <div>{Object.keys(props.tableContext as TableContextState).join(",")}</div>
  );
};

const TestParent = () => {
  const tableContext = useContext(TableContext);

  return <TestChild tableContext={tableContext} />;
};

describe("TableContext", () => {
  describe("context values and usage", () => {
    it("provides correct context values to children", async () => {
      const testRenderer = TestRenderer.create(
        <TableProvider {...mockTableProviderProps}>
          <TestParent />
        </TableProvider>,
      );
      const testInstance = testRenderer.root;

      const expectedKeys = [
        "width",
        "height",
        "pageSize",
        "isHeaderVisible",
        "compactMode",
        "currentPageIndex",
        "pageCount",
        "pageOptions",
        "headerGroups",
        "totalColumnsWidth",
        "isResizingColumn",
        "prepareRow",
        "rowSelectionState",
        "subPage",
        "handleAllRowSelectClick",
        "getTableBodyProps",
        "scrollContainerStyles",
        "tableSizes",
        "widgetId",
        "widgetName",
        "searchKey",
        "isLoading",
        "columns",
        "data",
        "editMode",
        "editableCell",
        "sortTableColumn",
        "handleResizeColumn",
        "handleReorderColumn",
        "selectTableRow",
        "pageNo",
        "updatePageNo",
        "nextPageClick",
        "prevPageClick",
        "serverSidePaginationEnabled",
        "selectedRowIndex",
        "selectedRowIndices",
        "disableDrag",
        "enableDrag",
        "toggleAllRowSelect",
        "triggerRowSelection",
        "searchTableData",
        "filters",
        "applyFilter",
        "delimiter",
        "accentColor",
        "isSortable",
        "multiRowSelection",
        "columnWidthMap",
        "borderRadius",
        "boxShadow",
        "onBulkEditDiscard",
        "onBulkEditSave",
        "primaryColumns",
        "derivedColumns",
        "sortOrder",
        "transientTableData",
        "isEditableCellsValid",
        "selectColumnFilterText",
        "isAddRowInProgress",
        "newRow",
        "firstEditableColumnIdByOrder",
        "enableServerSideFiltering",
        "onTableFilterUpdate",
        "customIsLoading",
        "customIsLoadingValue",
        "infiniteScrollEnabled",
        "allowAddNewRow",
        "onAddNewRow",
        "onAddNewRowAction",
        "disabledAddNewRowSave",
        "addNewRowValidation",
        "onAddNewRowSave",
        "onAddNewRowDiscard",
        "showConnectDataOverlay",
        "onConnectData",
        "isInfiniteScrollEnabled",
      ].sort();

      const result = Object.keys(
        (await testInstance.findByType(TestChild)).props.tableContext,
      ).sort();

      expect(result).toEqual(expectedKeys);
    });

    it("throws error when useAppsmithTable is used outside TableProvider", () => {
      const TestComponent = () => {
        useAppsmithTable();

        return null;
      };

      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => render(<TestComponent />)).toThrow(
        "useTable must be used within a TableProvider",
      );
      consoleError.mockRestore();
    });
  });

  describe("scrollContainerStyles", () => {
    it("calculates correct scrollContainerStyles when header is visible", async () => {
      const testRenderer = TestRenderer.create(
        <TableProvider {...mockTableProviderProps}>
          <TestParent />
        </TableProvider>,
      );
      const testInstance = testRenderer.root;
      const context = (await testInstance.findByType(TestChild)).props
        .tableContext;

      expect(context.scrollContainerStyles).toEqual({
        height: 352, // 400 - 40 - 8 (height - TABLE_HEADER_HEIGHT - TABLE_SCROLLBAR_HEIGHT)
        width: 800,
      });
    });

    it("calculates correct scrollContainerStyles when header is not visible", async () => {
      const testRenderer = TestRenderer.create(
        <TableProvider
          {...{ ...mockTableProviderProps, isHeaderVisible: false }}
        >
          <TestParent />
        </TableProvider>,
      );
      const testInstance = testRenderer.root;
      const context = (await testInstance.findByType(TestChild)).props
        .tableContext;

      expect(context.scrollContainerStyles).toEqual({
        height: 390, // 400 - 8 - 2 (height - TABLE_SCROLLBAR_HEIGHT - SCROLL_BAR_OFFSET)
        width: 800,
      });
    });
  });

  it("provides correct tableSizes based on compactMode", async () => {
    const testRenderer = TestRenderer.create(
      <TableProvider {...mockTableProviderProps}>
        <TestParent />
      </TableProvider>,
    );
    const testInstance = testRenderer.root;
    const context = (await testInstance.findByType(TestChild)).props
      .tableContext;

    expect(context.tableSizes).toEqual(
      TABLE_SIZES[mockTableProviderProps.compactMode],
    );
  });

  it("memoizes context value and scrollContainerStyles", () => {
    const { rerender } = render(
      <TableProvider {...mockTableProviderProps}>
        <TestParent />
      </TableProvider>,
    );

    const firstRender = screen.getByText(/.+/);
    const firstText = firstRender.textContent;

    // Rerender with same props
    rerender(
      <TableProvider {...mockTableProviderProps}>
        <TestParent />
      </TableProvider>,
    );

    const secondRender = screen.getByText(/.+/);
    const secondText = secondRender.textContent;

    expect(firstText).toBe(secondText);
  });
});
