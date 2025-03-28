import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { lightTheme } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";
import { TableProvider, type TableProviderProps } from "../../TableContext";
import Actions from "./index";

// Mock child components
jest.mock("@design-system/widgets-old", () => ({
  SearchComponent: ({
    onSearch,
    placeholder,
    value,
  }: {
    onSearch: (value: string) => void;
    value: string;
    placeholder: string;
  }) => (
    <input
      data-testid="search-input"
      onChange={(e) => onSearch(e.target.value)}
      placeholder={placeholder}
      value={value}
    />
  ),
}));

jest.mock("./filter", () => ({
  __esModule: true,
  default: () => <div data-testid="table-filters">Filters</div>,
}));

jest.mock("./Download", () => ({
  __esModule: true,
  default: () => <div data-testid="table-download">Download</div>,
}));
describe("TableWidget Actions Component", () => {
  const defaultProps: TableProviderProps = {
    updatePageNo: jest.fn(),
    nextPageClick: jest.fn(),
    prevPageClick: jest.fn(),
    pageNo: 0,
    children: <div />,
    data: [],
    pageCount: 5,
    currentPageIndex: 0,
    pageOptions: [1, 2, 3, 4, 5],
    widgetName: "Table1",
    widgetId: "table1",
    searchKey: "",
    searchTableData: jest.fn(),
    serverSidePaginationEnabled: false,
    applyFilter: jest.fn(),
    isVisibleDownload: true,
    isVisibleFilters: true,
    isVisiblePagination: true,
    isVisibleSearch: true,
    delimiter: ",",
    borderRadius: "4px",
    boxShadow: "",
    accentColor: "#553DE9",
    allowAddNewRow: false,
    onAddNewRow: jest.fn(),
    isInfiniteScrollEnabled: false,
    isAddRowInProgress: false,
    onAddNewRowAction: jest.fn(),
    disabledAddNewRowSave: false,
    columns: [
      {
        Cell: () => <div>id</div>,
        Header: "id",
        alias: "id",
        accessor: "id",
        id: "id",
        minWidth: 100,
        draggable: true,
        isHidden: false,
        isAscOrder: true,
        isDerived: false,
        columnProperties: {
          id: "id",
          originalId: "id",
          label: "id",
          columnType: "TEXT",
          isVisible: true,
          isDerived: false,
          isAscOrder: true,
          index: 0,
          isFilterable: true,
          computedValue: "id",
          alias: "id",
          allowCellWrapping: true,
          width: 100,
          isCellEditable: false,
          isEditable: false,
        },
      },
    ],
    // Additional required props for TableProvider
    isHeaderVisible: true,
    compactMode: "DEFAULT",
    handleAllRowSelectClick: jest.fn(),
    headerGroups: [],
    totalColumnsWidth: 800,
    isResizingColumn: { current: false },
    prepareRow: jest.fn(),
    rowSelectionState: null,
    subPage: [],
    getTableBodyProps: jest.fn(),
    width: 800,
    height: 400,
    pageSize: 10,
    editMode: false,
    editableCell: {
      column: "column1",
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
    selectedRowIndex: -1,
    selectedRowIndices: [],
    disableDrag: jest.fn(),
    enableDrag: jest.fn(),
    toggleAllRowSelect: jest.fn(),
    triggerRowSelection: false,
    filters: [],
    isSortable: true,
    multiRowSelection: false,
    columnWidthMap: {},
    onBulkEditDiscard: jest.fn(),
    onBulkEditSave: jest.fn(),
    showConnectDataOverlay: false,
    onConnectData: jest.fn(),
    isLoading: false,
    endOfData: false,
  };

  const renderWithTableProvider = (props: Partial<TableProviderProps>) => {
    return render(
      <ThemeProvider theme={lightTheme}>
        <TableProvider {...defaultProps} {...props}>
          <Actions />
        </TableProvider>
      </ThemeProvider>,
    );
  };

  it("1. Renders search component when isVisibleSearch is true", () => {
    renderWithTableProvider({});
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });

  it("2. Does not render search component when isVisibleSearch is false", () => {
    renderWithTableProvider({ isVisibleSearch: false });
    expect(screen.queryByTestId("search-input")).not.toBeInTheDocument();
  });

  it("3. Calls searchTableData when search input changes", () => {
    const searchTableData = jest.fn();

    renderWithTableProvider({ searchTableData });

    const searchInput = screen.getByTestId("search-input");

    fireEvent.change(searchInput, { target: { value: "test" } });

    expect(searchTableData).toHaveBeenCalledWith("test");
  });

  it("4. Renders pagination controls when isVisiblePagination is true and serverSidePagination is false", () => {
    const tableData = [{ id: 1 }, { id: 2 }];

    renderWithTableProvider({
      isVisiblePagination: true,
      pageCount: 1,
      data: tableData,
      totalRecordsCount: 5,
    });

    expect(screen.getByText("2 Records")).toBeInTheDocument();
    expect(screen.getByText(/Page/)).toBeInTheDocument();
    expect(screen.getByText(/of 1/)).toBeInTheDocument();
  });

  it("5. Calls nextPageClick when next button is clicked", () => {
    const nextPageClick = jest.fn();

    renderWithTableProvider({
      isVisiblePagination: true,
      pageCount: 3,
      totalRecordsCount: 5,
      updatePageNo: nextPageClick,
    });

    const nextButton = screen
      .getByText("chevron-right")
      .closest(".t--table-widget-next-page");

    expect(nextButton).not.toBe(null);
    fireEvent.click(nextButton!);

    expect(nextPageClick).toHaveBeenCalled();
  });

  it("6. Calls prevPageClick when previous button is clicked", () => {
    const prevPageClick = jest.fn();

    renderWithTableProvider({
      currentPageIndex: 1,
      isVisiblePagination: true,
      pageCount: 3,
      pageNo: 2,
      totalRecordsCount: 5,
      updatePageNo: prevPageClick,
    });

    const prevButton = screen
      .getByText("chevron-left")
      .closest(".t--table-widget-prev-page");

    expect(prevButton).not.toBe(null);
    fireEvent.click(prevButton!);

    expect(prevPageClick).toHaveBeenCalled();
  });

  it("7. Renders add new row button when allowAddNewRow is true", () => {
    renderWithTableProvider({
      allowAddNewRow: true,
    });

    expect(screen.getByText(/Add new row/)).toBeInTheDocument();
  });

  it("8. Shows correct record count with infinite scroll enabled and no total records count", () => {
    const tableData = [{ id: 1 }, { id: 2 }];

    renderWithTableProvider({
      isInfiniteScrollEnabled: true,
      data: tableData,
    });

    expect(screen.getByText("2 Records")).toBeInTheDocument();
  });

  it("9. Shows correct record count with infinite scroll enabled", () => {
    const tableData = [{ id: 1 }, { id: 2 }];
    const totalRecordsCount = 10;

    renderWithTableProvider({
      isInfiniteScrollEnabled: true,
      data: tableData,
      totalRecordsCount,
    });

    expect(screen.getByText("2 out of 10 Records")).toBeInTheDocument();
  });
});
