import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import SearchComponent from ".";
import "@testing-library/jest-dom";

jest.mock("lodash", () => ({
  debounce: (fn: any) => fn,
}));

jest.mock("../utils/icon-loadables", () => ({
  importSvg: jest.fn().mockReturnValue(() => <svg data-testid="cross-icon" />),
}));

describe("SearchComponent", () => {
  const onSearchMock = jest.fn();

  const renderComponent = (props = {}) => {
    return render(
      <SearchComponent
        onSearch={onSearchMock}
        placeholder="Search..."
        value=""
        {...props}
      />,
    );
  };

  it("1.should clear the search value and trigger onSearch with an empty value when the cross icon is clicked anh have focused", () => {
    renderComponent({
      enableClientSideSearch: true,
      value: "test",
    });
    const inputElement = screen.getByPlaceholderText(
      "Search...",
    ) as HTMLInputElement;
    const clearButton = screen.getByTestId("cross-icon");

    fireEvent.click(clearButton);

    expect(inputElement).toHaveFocus();
    expect(inputElement.value).toBe("");
    expect(onSearchMock).toHaveBeenCalledWith("");
  });

  it("2.should reset localValue when component receives a new value prop", () => {
    const { rerender } = renderComponent({
      value: "initial",
    });

    const inputElement = screen.getByPlaceholderText(
      "Search...",
    ) as HTMLInputElement;

    expect(inputElement.value).toBe("initial");

    rerender(
      <SearchComponent
        onSearch={onSearchMock}
        placeholder="Search..."
        value="updated"
      />,
    );

    expect(inputElement.value).toBe("updated");
  });
});
