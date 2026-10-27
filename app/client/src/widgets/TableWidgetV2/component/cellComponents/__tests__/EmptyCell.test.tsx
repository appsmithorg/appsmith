import React from "react";
import { render, screen } from "@testing-library/react";
import { useAppsmithTable } from "../../TableContext";
import { EmptyRows } from "../EmptyCell";

jest.mock("../../TableContext", () => ({
  useAppsmithTable: jest.fn(),
}));

describe("EmptyRows", () => {
  const baseContext = {
    accentColor: "#000",
    borderRadius: "0px",
    columns: [],
    multiRowSelection: false,
    prepareRow: jest.fn(),
    subPage: [],
    width: 300,
  };

  it("marks each filler row with a test id when the page is empty", () => {
    (useAppsmithTable as jest.Mock).mockReturnValue(baseContext);

    render(<EmptyRows rows={3} />);

    expect(screen.getAllByTestId("t--table-v2-empty-row")).toHaveLength(3);
  });

  it("marks each filler row with a test id when the page has rows", () => {
    const row = {
      getRowProps: () => ({ key: "row-0" }),
      cells: [],
    };

    (useAppsmithTable as jest.Mock).mockReturnValue({
      ...baseContext,
      subPage: [row],
    });

    render(<EmptyRows rows={2} />);

    expect(screen.getAllByTestId("t--table-v2-empty-row")).toHaveLength(2);
  });
});
