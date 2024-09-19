import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import EntityCheckboxSelector from "./EntityCheckboxSelector";

describe("<EntityCheckboxSelector />", () => {
  const baseProps = {
    entities: [
      { id: "1", name: "Entity1" },
      { id: "2", name: "Entity2" },
    ],
    onEntityChecked: jest.fn(),
    selectedIds: ["1"],
  };

  it("renders the component with correct props", () => {
    render(<EntityCheckboxSelector {...baseProps} />);
    expect(screen.getByText("Entity1")).toBeInTheDocument();
    expect(screen.getByText("Entity2")).toBeInTheDocument();
  });

  it("checks the selected checkbox", () => {
    render(<EntityCheckboxSelector {...baseProps} />);
    const entityCheckbox = screen.getByLabelText("Entity1");

    expect(entityCheckbox).toBeChecked();
  });

  it("handles checkbox click", () => {
    render(<EntityCheckboxSelector {...baseProps} />);
    const entityCheckbox = screen.getByLabelText("Entity2");

    fireEvent.click(entityCheckbox);
    expect(baseProps.onEntityChecked).toHaveBeenCalledWith("2", true);
  });

  it("handles checkbox uncheck", () => {
    render(<EntityCheckboxSelector {...baseProps} />);
    const entityCheckbox = screen.getByLabelText("Entity1");

    fireEvent.click(entityCheckbox);
    expect(baseProps.onEntityChecked).toHaveBeenCalledWith("1", false);
  });
});
