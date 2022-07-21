import React from "react";
import { render, screen } from "test/testUtils";
import "@testing-library/jest-dom";
import Table from "../QueryEditor/Table";

describe("Query Editor Table", () => {
  it("it should render table with missing key", () => {
    render(<Table data={[{ "": "Jan 1 1970 10:15AM" }]} />);
    const date = screen.getByText(/Jan 1 1970 10:15AM/i);
    expect(date).toBeInTheDocument();
  });
});
