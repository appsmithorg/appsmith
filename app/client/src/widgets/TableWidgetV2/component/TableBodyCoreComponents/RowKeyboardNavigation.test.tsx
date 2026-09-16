import React from "react";
import { render, act } from "@testing-library/react";
import { Row } from "./Row";
import type { Row as ReactTableRowType } from "react-table";
import { TableProvider, type TableProviderProps } from "../TableContext";
import type { ReactTableColumnProps } from "../Constants";
import { CompactModeTypes } from "../Constants";
import { InlineCellEditor } from "../cellComponents/InlineCellEditor";
import { InputTypes } from "widgets/BaseInputWidget/constants";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import "@testing-library/jest-dom";

const mockColumns = [
  { id: "col0", isHidden: false, sticky: "" },
  { id: "col1", isHidden: true, sticky: "" },
  { id: "col2", isHidden: false, sticky: "" },
  { id: "col3", isHidden: false, sticky: "" },
] as unknown as ReactTableColumnProps[];

const mockRow = {
  index: 0,
  original: { col0: "v0", col1: "v1", col2: "v2", col3: "v3" },
  cells: mockColumns.map((col: ReactTableColumnProps, idx: number) => ({
    getCellProps: () => ({ key: `cell-${idx}` }),
    column: { totalLeft: idx * 100 },
    render: () => <span>{`v${idx}`}</span>,
  })),
  getRowProps: () => ({ key: "row-0" }),
  toggleRowSelected: jest.fn(),
} as unknown as ReactTableRowType<Record<string, unknown>>;

const defaultProviderProps = {
  width: 800,
  height: 400,
  pageSize: 10,
  isHeaderVisible: true,
  compactMode: CompactModeTypes.DEFAULT,
  currentPageIndex: 0,
  pageCount: 1,
  pageOptions: [0],
  headerGroups: [],
  totalColumnsWidth: 800,
  isResizingColumn: { current: false },
  prepareRow: jest.fn(),
  rowSelectionState: null,
  subPage: [],
  handleAllRowSelectClick: jest.fn(),
  getTableBodyProps: jest.fn(),
  widgetId: "table1",
  widgetName: "Table1",
  searchKey: "",
  isLoading: false,
  columns: mockColumns,
  data: [],
  editMode: false,
  editableCell: {
    column: "",
    index: -1,
    value: "",
    initialValue: "",
    inputValue: "",
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
  selectedRowIndex: 0,
  selectedRowIndices: [0],
  disableDrag: jest.fn(),
  enableDrag: jest.fn(),
  toggleAllRowSelect: jest.fn(),
  triggerRowSelection: false,
  searchTableData: jest.fn(),
  filters: [],
  applyFilter: jest.fn(),
  delimiter: ",",
  accentColor: "#000",
  isSortable: true,
  multiRowSelection: false,
  columnWidthMap: {},
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
  allowAddNewRow: false,
  onAddNewRow: jest.fn(),
  onAddNewRowAction: jest.fn(),
  disabledAddNewRowSave: false,
  addNewRowValidation: {},
  onAddNewRowSave: jest.fn(),
  onAddNewRowDiscard: jest.fn(),
  showConnectDataOverlay: false,
  onConnectData: jest.fn(),
  isInfiniteScrollEnabled: false,
  endOfData: false,
  cachedTableData: [],
} as unknown as TableProviderProps;

const renderRowWithTheme = () =>
  render(
    <ThemeProvider theme={lightTheme}>
      <TableProvider {...defaultProviderProps}>
        <Row index={0} row={mockRow} />
      </TableProvider>
    </ThemeProvider>,
  );

const emptyObj = {};
const dummyFn = jest.fn();

const renderEditorCell = (onSave: jest.Mock) => (
  <InlineCellEditor
    accentColor="#000"
    additionalProps={emptyObj}
    autoFocus
    compactMode="DEFAULT"
    inputHTMLType="text"
    inputType={InputTypes.TEXT}
    isEditableCellValid
    multiline={false}
    onChange={dummyFn}
    onDiscard={dummyFn}
    onSave={onSave}
    validationErrorMessage=""
    value="edit text"
    widgetId="table1"
  />
);

const renderInlineEditorWithTheme = (
  editorCellIdx: number,
  onSave: jest.Mock,
) =>
  render(
    <ThemeProvider theme={lightTheme}>
      <div className="tr">
        <div className="td" data-colindex="0" tabIndex={-1}>
          {editorCellIdx === 0 ? renderEditorCell(onSave) : "First Cell"}
        </div>
        <div className="td hidden-cell" data-colindex="1">
          Hidden
        </div>
        <div className="td" data-colindex="2" tabIndex={-1}>
          {editorCellIdx === 2 ? renderEditorCell(onSave) : "Target Cell"}
        </div>
      </div>
    </ThemeProvider>,
  );

const fireTabKey = (target: Element | null, shiftKey = false) => {
  const event = new KeyboardEvent("keydown", {
    key: "Tab",
    shiftKey,
    bubbles: true,
    cancelable: true,
  });

  target?.dispatchEvent(event);

  return event;
};

describe("Row Keyboard Navigation - Real DOM Focus", () => {
  it("A & B: Tab moves focus from col0 to col2 skipping hidden col1", () => {
    const { container } = renderRowWithTheme();

    const cell0 = container.querySelector<HTMLElement>('[data-colindex="0"]');
    const cell2 = container.querySelector<HTMLElement>('[data-colindex="2"]');

    cell0?.focus();
    expect(document.activeElement).toBe(cell0);

    const event = fireTabKey(cell0);

    expect(document.activeElement).toBe(cell2);
    expect(event.defaultPrevented).toBe(true);
  });

  it("C: Shift + Tab moves focus from col2 back to col0", () => {
    const { container } = renderRowWithTheme();

    const cell0 = container.querySelector<HTMLElement>('[data-colindex="0"]');
    const cell2 = container.querySelector<HTMLElement>('[data-colindex="2"]');

    cell2?.focus();
    expect(document.activeElement).toBe(cell2);

    const event = fireTabKey(cell2, true);

    expect(document.activeElement).toBe(cell0);
    expect(event.defaultPrevented).toBe(true);
  });

  it("D: Tab at last visible column (col3) does NOT trap focus", () => {
    const { container } = renderRowWithTheme();

    const cell3 = container.querySelector<HTMLElement>('[data-colindex="3"]');

    cell3?.focus();

    const event = fireTabKey(cell3);

    expect(event.defaultPrevented).toBe(false);
  });

  it("E: Shift + Tab at first visible column (col0) does NOT trap focus", () => {
    const { container } = renderRowWithTheme();

    const cell0 = container.querySelector<HTMLElement>('[data-colindex="0"]');

    cell0?.focus();

    const event = fireTabKey(cell0, true);

    expect(event.defaultPrevented).toBe(false);
  });

  it("F: InlineCellEditor handles Tab with onSave and moves focus to next visible cell skipping hidden column", () => {
    jest.useFakeTimers();
    const onSave = jest.fn();

    const { container } = renderInlineEditorWithTheme(0, onSave);

    const input = container.querySelector("input");
    const cell2 = container.querySelector<HTMLElement>('[data-colindex="2"]');

    expect(input).toBeInTheDocument();

    const event = fireTabKey(input);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);

    act(() => {
      jest.runAllTimers();
    });

    expect(document.activeElement).toBe(cell2);
    expect(onSave).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it("G: InlineCellEditor handles Shift + Tab with onSave and moves focus to previous visible cell", () => {
    jest.useFakeTimers();
    const onSave = jest.fn();

    const { container } = renderInlineEditorWithTheme(2, onSave);

    const input = container.querySelector("input");
    const cell0 = container.querySelector<HTMLElement>('[data-colindex="0"]');

    expect(input).toBeInTheDocument();

    const event = fireTabKey(input, true);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);

    act(() => {
      jest.runAllTimers();
    });

    expect(document.activeElement).toBe(cell0);
    expect(onSave).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it("H: InlineCellEditor at last visible column boundary calls onSave and does NOT trap focus on Tab", () => {
    const onSave = jest.fn();

    const { container } = renderInlineEditorWithTheme(2, onSave);

    const input = container.querySelector("input");

    expect(input).toBeInTheDocument();

    const event = fireTabKey(input);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(false);
  });
});
