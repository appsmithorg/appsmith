import "@testing-library/jest-dom";
import { fireEvent, render } from "@testing-library/react";
import React from "react";
import { lightTheme } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";
import { ColumnTypes } from "widgets/TableWidgetV2/constants";
import { StickyType } from "../../Constants";
import { HeaderCell } from "../HeaderCell";

const mockSortTableColumn = jest.fn();

jest.mock("@design-system/widgets-old", () => ({
  importRemixIcon: () => (props: { className?: string }) => (
    <span className={props.className} data-testid="t--header-menu-icon" />
  ),
  importSvg: () => (props: { className?: string }) => (
    <span className={props.className} data-testid="t--edit-icon" />
  ),
  MenuDivider: () => <div />,
}));

jest.mock("../../TableContext", () => ({
  useAppsmithTable: () => ({
    canFreezeColumn: true,
    editMode: true,
    handleColumnFreeze: jest.fn(),
    isInfiniteScrollEnabled: false,
    isResizingColumn: { current: false },
    isSortable: true,
    multiRowSelection: false,
    sortTableColumn: mockSortTableColumn,
    widgetId: "table1",
    width: 400,
  }),
}));

function buildColumn({
  allowHeaderWrapping,
  columnType = ColumnTypes.TEXT,
  isCellEditable = false,
  isEditable = false,
}: {
  allowHeaderWrapping?: boolean;
  columnType?: string;
  isCellEditable?: boolean;
  isEditable?: boolean;
} = {}) {
  return {
    columnProperties: {
      allowHeaderWrapping,
      columnType,
      horizontalAlignment: "CENTER",
      isCellEditable,
      isEditable,
    },
    getHeaderProps: () => ({ style: { left: 0 } }),
    getResizerProps: () => ({}),
    id: "customerName",
    isResizing: false,
    sticky: StickyType.NONE,
  };
}

function renderHeader({
  allowHeaderWrapping,
  columnName = "Customer name",
  isAscOrder,
  isCellEditable = false,
  isEditable = false,
  isWrappedHeaderRow = false,
}: {
  allowHeaderWrapping?: boolean;
  columnName?: string;
  isAscOrder?: boolean;
  isCellEditable?: boolean;
  isEditable?: boolean;
  isWrappedHeaderRow?: boolean;
} = {}) {
  return render(
    <ThemeProvider theme={lightTheme}>
      <HeaderCell
        column={buildColumn({
          allowHeaderWrapping,
          isCellEditable,
          isEditable,
        })}
        columnIndex={0}
        columnName={columnName}
        isAscOrder={isAscOrder}
        isHidden={false}
        isWrappedHeaderRow={isWrappedHeaderRow}
        onDrag={jest.fn()}
        onDragEnd={jest.fn()}
        onDragEnter={jest.fn()}
        onDragLeave={jest.fn()}
        onDragOver={jest.fn()}
        onDragStart={jest.fn()}
        onDrop={jest.fn()}
        stickyRightModifier=""
      />
    </ThemeProvider>,
  );
}

describe("HeaderCell", () => {
  beforeEach(() => {
    mockSortTableColumn.mockClear();
  });

  it("keeps a single non-breaking line when header wrapping is off or missing", () => {
    const { container, rerender } = renderHeader();
    const header = container.querySelector(".th") as HTMLElement;

    expect(header.getAttribute("data-header-wrap")).toBeNull();
    expect(header.textContent).toContain("Customer\u00a0name");

    rerender(
      <ThemeProvider theme={lightTheme}>
        <HeaderCell
          column={buildColumn({ allowHeaderWrapping: false })}
          columnIndex={0}
          columnName="Customer name"
          isHidden={false}
          onDrag={jest.fn()}
          onDragEnd={jest.fn()}
          onDragEnter={jest.fn()}
          onDragLeave={jest.fn()}
          onDragOver={jest.fn()}
          onDragStart={jest.fn()}
          onDrop={jest.fn()}
          stickyRightModifier=""
        />
      </ThemeProvider>,
    );

    expect(
      container.querySelector(".th")?.getAttribute("data-header-wrap"),
    ).toBeNull();
    expect(container.querySelector(".th")?.textContent).toContain(
      "Customer\u00a0name",
    );
  });

  it("wraps the header label on normal spaces and keeps the sort icon beside the label", () => {
    const { container } = renderHeader({
      allowHeaderWrapping: true,
      isAscOrder: true,
      isWrappedHeaderRow: true,
    });
    const header = container.querySelector(".th") as HTMLElement;
    const label = header.querySelector(".draggable-header");
    const sortIcon = header.querySelector(".header-sort-icon");

    expect(header.getAttribute("data-header-wrap")).toBe("true");
    expect(header.textContent).toContain("Customer name");
    expect(header.textContent).not.toContain("Customer\u00a0name");
    expect(label?.contains(sortIcon)).toBe(false);
    expect(header.contains(sortIcon)).toBe(true);

    fireEvent.click(label as HTMLElement);
    expect(mockSortTableColumn).toHaveBeenCalledWith(-1, false);

    mockSortTableColumn.mockClear();
    fireEvent.click(sortIcon as HTMLElement);
    expect(mockSortTableColumn).not.toHaveBeenCalled();
  });

  it("keeps the wrap marker when column drag replaces the header class name", () => {
    const { container } = renderHeader({ allowHeaderWrapping: true });
    const header = container.querySelector(".th") as HTMLElement;

    header.className = "th header-reorder highlight-left";

    expect(header.getAttribute("data-header-wrap")).toBe("true");
    expect(header.textContent).toContain("Customer name");
  });

  it("keeps the edit icon out of the wrapped label", () => {
    const { container } = renderHeader({
      allowHeaderWrapping: true,
      isCellEditable: true,
      isEditable: true,
      isWrappedHeaderRow: true,
    });
    const label = container.querySelector(".draggable-header");
    const editIcon = container.querySelector("[data-testid='t--edit-icon']");

    expect(editIcon?.closest(".draggable-header")).toBe(label);
    expect(editIcon?.textContent).not.toContain("Customer");
  });
});
