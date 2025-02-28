import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { EntityListTree } from "./EntityListTree";
import type {
  EntityListTreeItem,
  EntityListTreeProps,
} from "./EntityListTree.types";

const mockOnItemExpand = jest.fn();

const name = {
  "1": "Parent 1",
  "1.1": "Child 1.1",
  "1.1.1": "Child 1.1.1",
  "1.1.2": "Child 1.1.2",
  "1.2": "Child 1.2",
  "2": "No Children Parent",
};

const ItemComponent = ({ item }: { item: EntityListTreeItem }) => {
  return <div>{name[item.id as keyof typeof name] || item.id}</div>;
};

const defaultProps: EntityListTreeProps = {
  ItemComponent,
  items: [
    {
      id: "1",
      isExpanded: false,
      isSelected: false,
      isDisabled: false,
      children: [
        {
          id: "1-1",
          isExpanded: false,
          isSelected: false,
          isDisabled: false,
          children: [],
        },
      ],
    },
  ],
  onItemExpand: mockOnItemExpand,
};

describe("EntityListTree", () => {
  it("renders the EntityListTree component", () => {
    render(<EntityListTree {...defaultProps} />);
    expect(screen.getByRole("tree")).toBeInTheDocument();
  });

  it("calls onItemExpand when expand icon is clicked", () => {
    render(<EntityListTree {...defaultProps} />);
    const expandIcon = screen.getByTestId("t--entity-item-expand-icon");

    fireEvent.click(expandIcon);
    expect(mockOnItemExpand).toHaveBeenCalledWith("1");
  });

  it("does not call onItemExpand when item has no children", () => {
    const props = {
      ...defaultProps,
      items: [
        {
          id: "2",
          isExpanded: false,
          isSelected: false,
          isDisabled: false,
          children: [],
        },
      ],
    };

    render(<EntityListTree {...props} />);
    const expandIcon = screen.queryByTestId("t--entity-item-expand-icon");

    expect(
      screen.getByRole("treeitem", { name: "No Children Parent" }),
    ).toBeInTheDocument();
    expect(expandIcon).toBeNull();
  });

  it("renders nested EntityListTree when item is expanded", () => {
    const props = {
      ...defaultProps,
      items: [
        {
          id: "1",
          isExpanded: true,
          isSelected: false,
          isDisabled: false,
          children: [
            {
              id: "1-1",
              isExpanded: false,
              isSelected: false,
              isDisabled: false,
              children: [],
            },
          ],
        },
      ],
    };

    render(<EntityListTree {...props} />);

    expect(screen.getByRole("treeitem", { name: "1-1" })).toBeInTheDocument();
  });

  it("does not render nested EntityListTree when item is not expanded", () => {
    render(<EntityListTree {...defaultProps} />);

    expect(screen.queryByRole("treeitem", { name: "Child" })).toBeNull();
  });
});
