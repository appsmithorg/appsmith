import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import SelectComponent, { type SelectComponentProps } from "./index";

const mockProps: SelectComponentProps = {
  borderRadius: "",
  compactMode: false,
  dropDownWidth: 0,
  height: 0,
  isFilterable: false,
  isLoading: false,
  isValid: false,
  labelText: "",
  onFilterChange: jest.fn(),
  onOptionSelected: jest.fn(),
  onDropdownClose: jest.fn(),
  onDropdownOpen: jest.fn(),
  options: [],
  serverSideFiltering: false,
  width: 0,
  widgetId: "",
};

const mockOptions = [
  { label: "Option 1", value: "1" },
  { label: "Option 2", value: "2" },
  { label: "Option 3", value: "3" },
];

describe("SelectComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call onDropdownClose only once when select button is clicked twice", () => {
    render(<SelectComponent {...mockProps} />);
    const dropdownButton = screen.getByTestId("selectbutton.btn.main");

    fireEvent.click(dropdownButton);
    expect(mockProps.onDropdownOpen).toHaveBeenCalledTimes(1);
    
    fireEvent.click(dropdownButton);
    expect(mockProps.onDropdownClose).toHaveBeenCalledTimes(1);
  });

  describe("Highlight behavior", () => {
    it("should highlight first item by default when dropdown opens", () => {
      const props = {
        ...mockProps,
        options: mockOptions,
      };
      const { container } = render(<SelectComponent {...props} />);
      
      // Open dropdown
      const dropdownButton = screen.getByTestId("selectbutton.btn.main");
      fireEvent.click(dropdownButton);

      // First item should have focus class
      const menuItems = container.querySelectorAll(".menu-item-link");
      expect(menuItems[0]).toHaveClass("has-focus");
      expect(menuItems[1]).not.toHaveClass("has-focus");
      expect(menuItems[2]).not.toHaveClass("has-focus");
    });

    it("should highlight selected item when there is a selectedIndex", () => {
      const props = {
        ...mockProps,
        options: mockOptions,
        selectedIndex: 1,
      };
      const { container } = render(<SelectComponent {...props} />);
      
      // Open dropdown
      const dropdownButton = screen.getByTestId("selectbutton.btn.main");
      fireEvent.click(dropdownButton);

      // Second item should have focus class
      const menuItems = container.querySelectorAll(".menu-item-link");
      expect(menuItems[0]).not.toHaveClass("has-focus");
      expect(menuItems[1]).toHaveClass("has-focus");
      expect(menuItems[2]).not.toHaveClass("has-focus");
    });

    it("should highlight first item when selectedIndex is invalid", () => {
      const props = {
        ...mockProps,
        options: mockOptions,
        selectedIndex: 999, // Invalid index
      };
      const { container } = render(<SelectComponent {...props} />);
      
      // Open dropdown
      const dropdownButton = screen.getByTestId("selectbutton.btn.main");
      fireEvent.click(dropdownButton);

      // First item should have focus class
      const menuItems = container.querySelectorAll(".menu-item-link");
      expect(menuItems[0]).toHaveClass("has-focus");
      expect(menuItems[1]).not.toHaveClass("has-focus");
      expect(menuItems[2]).not.toHaveClass("has-focus");
    });

    it("should update highlight on active item change", () => {
      const props = {
        ...mockProps,
        options: mockOptions,
      };
      const { container } = render(<SelectComponent {...props} />);
      
      // Open dropdown
      const dropdownButton = screen.getByTestId("selectbutton.btn.main");
      fireEvent.click(dropdownButton);

      // Simulate active item change
      const menuItems = container.querySelectorAll(".menu-item-link");
      fireEvent.mouseEnter(menuItems[1]); // Hover second item

      // Second item should now have focus
      expect(menuItems[0]).not.toHaveClass("has-focus");
      expect(menuItems[1]).toHaveClass("has-focus");
      expect(menuItems[2]).not.toHaveClass("has-focus");
    });
  });
});
