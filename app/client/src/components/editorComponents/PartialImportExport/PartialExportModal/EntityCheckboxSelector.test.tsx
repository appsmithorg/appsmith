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

describe("<EntityCheckboxSelector /> Select All", () => {
  const selectAllTestId = "t--test-select-all";
  const entities = [{ id: "1", name: "Entity1" }, { name: "NameOnlyEntity" }];

  it("does not render Select All when onSelectAll is not passed", () => {
    render(
      <EntityCheckboxSelector
        entities={entities}
        onEntityChecked={jest.fn()}
        selectAllTestId={selectAllTestId}
        selectedIds={[]}
      />,
    );
    expect(screen.queryByTestId(selectAllTestId)).not.toBeInTheDocument();
  });

  it("does not render Select All when there are no entities", () => {
    render(
      <EntityCheckboxSelector
        entities={[]}
        onEntityChecked={jest.fn()}
        onSelectAll={jest.fn()}
        selectAllTestId={selectAllTestId}
        selectedIds={[]}
      />,
    );
    expect(screen.queryByTestId(selectAllTestId)).not.toBeInTheDocument();
  });

  it("calls onSelectAll with every id, falling back to name", () => {
    const onSelectAll = jest.fn();

    render(
      <EntityCheckboxSelector
        entities={entities}
        onEntityChecked={jest.fn()}
        onSelectAll={onSelectAll}
        selectAllTestId={selectAllTestId}
        selectedIds={[]}
      />,
    );
    expect(screen.getByTestId(selectAllTestId)).not.toBeChecked();
    fireEvent.click(screen.getByTestId(selectAllTestId));
    expect(onSelectAll).toHaveBeenCalledWith(["1", "NameOnlyEntity"], true);
  });

  it("is checked when every entity is selected and unticking clears", () => {
    const onSelectAll = jest.fn();

    render(
      <EntityCheckboxSelector
        entities={entities}
        onEntityChecked={jest.fn()}
        onSelectAll={onSelectAll}
        selectAllTestId={selectAllTestId}
        selectedIds={["1", "NameOnlyEntity"]}
      />,
    );
    expect(screen.getByTestId(selectAllTestId)).toBeChecked();
    fireEvent.click(screen.getByTestId(selectAllTestId));
    expect(onSelectAll).toHaveBeenCalledWith(["1", "NameOnlyEntity"], false);
  });

  it("is unchecked when one entity is not selected", () => {
    render(
      <EntityCheckboxSelector
        entities={entities}
        onEntityChecked={jest.fn()}
        onSelectAll={jest.fn()}
        selectAllTestId={selectAllTestId}
        selectedIds={["1"]}
      />,
    );
    expect(screen.getByTestId(selectAllTestId)).not.toBeChecked();
  });
});
