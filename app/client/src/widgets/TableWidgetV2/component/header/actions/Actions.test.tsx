import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import "@testing-library/jest-dom";
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
  const defaultProps = {
    updatePageNo: jest.fn(),
    nextPageClick: jest.fn(),
    prevPageClick: jest.fn(),
    pageNo: 0,
    tableData: [],
    tableColumns: [],
    pageCount: 5,
    currentPageIndex: 0,
    pageOptions: [1, 2, 3, 4, 5],
    widgetName: "Table1",
    widgetId: "table1",
    searchKey: "",
    searchTableData: jest.fn(),
    serverSidePaginationEnabled: false,
    applyFilter: jest.fn(),
    tableSizes: {
      COLUMN_HEADER_HEIGHT: 32,
      EDITABLE_CELL_HEIGHT: 30,
      EDIT_ICON_TOP: 10,
      ROW_FONT_SIZE: 14,
      ROW_HEIGHT: 40,
      ROW_VIRTUAL_OFFSET: 3,
      TABLE_HEADER_HEIGHT: 40,
      VERTICAL_EDITOR_PADDING: 0,
      VERTICAL_PADDING: 6,
    },
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
    disableAddNewRow: false,
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
  };

  it("1. Renders search component when isVisibleSearch is true", () => {
    render(<Actions {...defaultProps} columns={[]} />);
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });
  it("2. Does not render search component when isVisibleSearch is false", () => {
    render(<Actions {...defaultProps} columns={[]} isVisibleSearch={false} />);
    expect(screen.queryByTestId("search-input")).not.toBeInTheDocument();
  });

  it("3. Calls searchTableData when search input changes", () => {
    const searchTableData = jest.fn();

    render(
      <Actions
        {...defaultProps}
        columns={[]}
        searchTableData={searchTableData}
      />,
    );

    const searchInput = screen.getByTestId("search-input");

    fireEvent.change(searchInput, { target: { value: "test" } });

    expect(searchTableData).toHaveBeenCalledWith("test");
  });

  it("4. Renders pagination controls when isVisiblePagination is true and serverSidePagination is false", () => {
    const tableData = [{ id: 1 }, { id: 2 }];

    render(
      <Actions
        {...defaultProps}
        isVisiblePagination
        pageCount={1}
        tableData={tableData}
        totalRecordsCount={5}
      />,
    );

    expect(screen.getByText("2 Records")).toBeInTheDocument();
    expect(screen.getByText(/Page/)).toBeInTheDocument();
    expect(screen.getByText(/of 1/)).toBeInTheDocument();
  });

  it("5. Calls nextPageClick when next button is clicked", () => {
    const nextPageClick = jest.fn();

    render(
      <Actions
        {...defaultProps}
        isVisiblePagination
        pageCount={3}
        totalRecordsCount={5}
        updatePageNo={nextPageClick}
      />,
    );

    const nextButton = screen
      .getByText("chevron-right")
      .closest(".t--table-widget-next-page");

    expect(nextButton).not.toBe(null);
    fireEvent.click(nextButton!);

    expect(nextPageClick).toHaveBeenCalled();
  });

  it("6. Calls prevPageClick when previous button is clicked", () => {
    const prevPageClick = jest.fn();

    render(
      <Actions
        {...defaultProps}
        currentPageIndex={1}
        isVisiblePagination
        pageCount={3}
        pageNo={2}
        totalRecordsCount={5}
        updatePageNo={prevPageClick}
      />,
    );

    const prevButton = screen
      .getByText("chevron-left")
      .closest(".t--table-widget-prev-page");

    expect(prevButton).not.toBe(null);
    fireEvent.click(prevButton!);

    expect(prevPageClick).toHaveBeenCalled();
  });

  it("7. Renders add new row button when allowAddNewRow is true", () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <Actions {...defaultProps} allowAddNewRow />
      </ThemeProvider>,
    );

    expect(screen.getByText(/Add new row/)).toBeInTheDocument();
  });

  it("8. Shows correct record count with infinite scroll enabled and no total records count", () => {
    const tableData = [{ id: 1 }, { id: 2 }];

    render(
      <Actions
        {...defaultProps}
        isInfiniteScrollEnabled
        tableData={tableData}
      />,
    );

    expect(screen.getByText("2 Records")).toBeInTheDocument();
  });

  it("9. Shows correct record count with infinite scroll enabled", () => {
    const tableData = [{ id: 1 }, { id: 2 }];
    const totalRecordsCount = 10;

    render(
      <Actions
        {...defaultProps}
        isInfiniteScrollEnabled
        tableData={tableData}
        totalRecordsCount={totalRecordsCount}
      />,
    );

    expect(screen.getByText("2 out of 10 Records")).toBeInTheDocument();
  });
});
