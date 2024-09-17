import React from "react";
import { render, fireEvent, act } from "@testing-library/react";
import SearchComponent from "../SearchComponent";
import { debounce } from "lodash";
import "@testing-library/jest-dom"
// Mocking the debounce function to call the function immediately
jest.mock("lodash", () => ({
  debounce: (fn: any) => fn,
}));

// Mocking the SVG import to avoid issues with lazy loading in the test environment
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
      />
    );
  };

  it("should update localValue and call onSearch when input is changed with client-side search enabled", () => {
    const { getByPlaceholderText } = renderComponent({
      enableClientSideSearch: true,
    });
    const inputElement = getByPlaceholderText("Search...") as HTMLInputElement;

    act(() => {
      fireEvent.change(inputElement, { target: { value: "test" } });
    });

    expect(inputElement.value).toBe("test");
    expect(onSearchMock).toHaveBeenCalledWith("test");
  });

  it("should clear the search value and trigger onSearch with an empty value when the cross icon is clicked", () => {
    const { getByPlaceholderText, getByTestId } = renderComponent({
      enableClientSideSearch: true,
      value: "test",
    });
    const inputElement = getByPlaceholderText("Search...") as HTMLInputElement;
    const clearButton = getByTestId("cross-icon");

    act(() => {
      fireEvent.click(clearButton);
    });

    expect(inputElement.value).toBe("");
    expect(onSearchMock).toHaveBeenCalledWith("");
  });

  it("should reset localValue when component receives a new value prop", () => {
    const { getByPlaceholderText, rerender } = renderComponent({
      value: "initial",
    });

    const inputElement = getByPlaceholderText("Search...") as HTMLInputElement;
    expect(inputElement.value).toBe("initial");

    rerender(<SearchComponent onSearch={onSearchMock} placeholder="Search..." value="updated" />);

    expect(inputElement.value).toBe("updated");
  });

  it("should clear localValue and call onSearch with an empty value if enableClientSideSearch prop changes", () => {
    const { getByPlaceholderText, rerender } = renderComponent({
      enableClientSideSearch: true,
      value: "initial",
    });

    const inputElement = getByPlaceholderText("Search...")as HTMLInputElement;
    expect(inputElement.value).toBe("initial");

    rerender(<SearchComponent onSearch={onSearchMock} value="" placeholder="Search..." enableClientSideSearch={false} />);

    expect(inputElement.value).toBe("");
    expect(onSearchMock).toHaveBeenCalledWith("");
  });
});