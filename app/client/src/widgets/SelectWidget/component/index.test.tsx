import React from "react";
import { render, screen } from "@testing-library/react";
import SelectComponent, { type SelectComponentProps } from "./index";
import userEvent from "@testing-library/user-event";

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

describe("SelectComponent", () => {
  it("should call onDropdownClose only once when select button is clicked twice", () => {
    render(<SelectComponent {...mockProps} />);
    const dropdownButton = screen.getByTestId("selectbutton.btn.main");
    userEvent.click(dropdownButton);

    expect(mockProps.onDropdownOpen).toHaveBeenCalledTimes(1);
    userEvent.click(dropdownButton);

    expect(mockProps.onDropdownClose).toHaveBeenCalledTimes(1);
  });
});
