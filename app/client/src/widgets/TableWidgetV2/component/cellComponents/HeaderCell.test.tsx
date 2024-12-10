import { HeaderCell } from "./HeaderCell";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";

const saveColumnProps = {
  canFreezeColumn: true,
  column: {
    id: "EditActions1",
    Header: "Save / Discard",
    alias: "EditActions1",
    width: 150,
    metaProperties: {
      decimals: 0,
      format: "",
      inputFormat: "",
      isHidden: false,
      type: "editActions",
    },
    getHeaderProps: () => {
      return {
        style: { width: "500px", height: "500px" },
      };
    },
    columnProperties: {
      isCellEditable: true,
      columnType: "editActions",
    },
    getResizerProps: () => {
      return {};
    },
  },
  columnIndex: 1,
  columnName: "Save / Discard",
  columnOrder: ["id", "EditActions1"],
  editMode: true,
  isAscOrder: undefined,
  isHidden: false,
  isResizingColumn: false,
  isSortable: true,
  multiRowSelection: false,
  handleColumnFreeze: jest.fn(),
  handleReorderColumn: jest.fn(),
  sortTableColumn: jest.fn(),
  widgetId: "Table1",
  onDrag: jest.fn(),
  onDragEnd: jest.fn(),
  onDragEnter: jest.fn(),
  onDragLeave: jest.fn(),
  onDragOver: jest.fn(),
  onDragStart: jest.fn(),
  onDrop: jest.fn(),
  stickyRightModifier: "",
};

const normalColumnProps = {
  canFreezeColumn: true,
  column: {
    id: "id",
    Header: "id",
    alias: "id",
    width: 150,
    metaProperties: {
      decimals: 0,
      format: "",
      inputFormat: "",
      isHidden: false,
      type: "number",
    },
    getHeaderProps: () => {
      return {
        style: { width: "500px", height: "500px" },
      };
    },
    columnProperties: {
      isCellEditable: true,
      columnType: "number",
    },
    getResizerProps: () => {
      return {};
    },
  },
  columnIndex: 0,
  columnName: "id",
  columnOrder: ["id", "EditActions1"],
  editMode: true,
  isAscOrder: undefined,
  isHidden: false,
  isResizingColumn: false,
  isSortable: true,
  multiRowSelection: false,
  handleColumnFreeze: jest.fn(),
  handleReorderColumn: jest.fn(),
  sortTableColumn: jest.fn(),
  widgetId: "Table1",
  onDrag: jest.fn(),
  onDragEnd: jest.fn(),
  onDragEnter: jest.fn(),
  onDragLeave: jest.fn(),
  onDragOver: jest.fn(),
  onDragStart: jest.fn(),
  onDrop: jest.fn(),
  stickyRightModifier: "",
};

describe("Render test on HeaderCell component", () => {
  it("test to check if the event action column does not have sort options in popover", async () => {
    const { container } = render(<HeaderCell {...saveColumnProps} />);
    const text = screen.getByText(/Save \/ Discard/i);
    expect(text).toBeInTheDocument();
    const menuContainer = container.getElementsByClassName(
      "bp3-popover2-target",
    );
    expect(menuContainer[0]).toBeInTheDocument();
    fireEvent.mouseOver(menuContainer[0]);
    const freeLeft = await screen.findByText(/Freeze column left/i);
    expect(freeLeft).toBeInTheDocument();
    const sortText = screen.queryAllByText(/Sort column ascending/i);
    expect(sortText).toHaveLength(0);
  });
  it("test to check if the normal action column does have sort options in popover", async () => {
    const { container } = render(<HeaderCell {...normalColumnProps} />);
    const text = screen.getByText(/id/i);
    expect(text).toBeInTheDocument();
    const menuContainer = container.getElementsByClassName(
      "bp3-popover2-target",
    );
    expect(menuContainer[0]).toBeInTheDocument();
    fireEvent.mouseOver(menuContainer[0]);
    const freeLeft = await screen.findByText(/Freeze column left/i);
    expect(freeLeft).toBeInTheDocument();
    const sortText = screen.queryAllByText(/Sort column/i);
    expect(sortText).toHaveLength(2);
  });
});
