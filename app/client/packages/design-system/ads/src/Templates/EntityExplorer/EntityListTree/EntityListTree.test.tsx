import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { EntityListTree } from "./EntityListTree";
import type { EntityListTreeProps } from "./EntityListTree.types";

const mockOnItemExpand = jest.fn();
const mockNameEditorConfig = {
  canEdit: true,
  isEditing: false,
  isLoading: false,
  onEditComplete: jest.fn(),
  onNameSave: jest.fn(),
  validateName: jest.fn(),
};

const mockOnClick = jest.fn();

const defaultProps: EntityListTreeProps = {
  items: [
    {
      id: "1",
      title: "Parent",
      isExpanded: false,
      isSelected: false,
      isDisabled: false,
      nameEditorConfig: mockNameEditorConfig,
      onClick: mockOnClick,
      children: [
        {
          id: "1-1",
          title: "Child",
          isExpanded: false,
          isSelected: false,
          isDisabled: false,
          nameEditorConfig: mockNameEditorConfig,
          onClick: mockOnClick,
          children: [],
        },
      ],
    },
  ],
  onItemExpand: mockOnItemExpand,
};

it("renders the EntityListTree component", () => {
  render(<EntityListTree {...defaultProps} />);
  expect(screen.getByRole("tree")).toBeInTheDocument();
});

it("calls onItemExpand when expand icon is clicked", () => {
  render(<EntityListTree {...defaultProps} />);
  const expandIcon = screen.getByTestId("entity-item-expand-icon");

  fireEvent.click(expandIcon);
  expect(mockOnItemExpand).toHaveBeenCalledWith("1");
});

it("does not call onItemExpand when item has no children", () => {
  const props = {
    ...defaultProps,
    items: [
      {
        id: "2",
        title: "No Children Parent",
        isExpanded: false,
        isSelected: false,
        isDisabled: false,
        children: [],
        nameEditorConfig: mockNameEditorConfig,
        onClick: mockOnClick,
      },
    ],
  };

  render(<EntityListTree {...props} />);
  const expandIcon = screen.queryByTestId("entity-item-expand-icon");

  expect(expandIcon).toBeNull();
});

it("renders nested EntityListTree when item is expanded", () => {
  const props = {
    ...defaultProps,
    items: [
      {
        id: "1",
        title: "Parent",
        isExpanded: true,
        isSelected: false,
        isDisabled: false,
        nameEditorConfig: mockNameEditorConfig,
        onClick: mockOnClick,
        children: [
          {
            id: "1-1",
            title: "Child",
            isExpanded: false,
            isSelected: false,
            isDisabled: false,
            nameEditorConfig: mockNameEditorConfig,
            onClick: mockOnClick,
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

  expect(screen.queryByRole("treeitem", { name: "1-1" })).toBeNull();
});
