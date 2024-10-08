import React from "react";
import { render, fireEvent, act } from "@testing-library/react";
import SearchComponent from "../SearchComponent";
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

  it("should allow the user to type in the search box and see results immediately when client-side search is enabled", () => {
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

  it("should allow the user to clear the search input by clicking the clear button and see updated search results", () => {
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

  it("should update the search input when the user receives new search criteria from outside the component", () => {
    const { getByPlaceholderText, rerender } = renderComponent({
      value: "initial",
    });

    const inputElement = getByPlaceholderText("Search...") as HTMLInputElement;
    expect(inputElement.value).toBe("initial");

    rerender(<SearchComponent onSearch={onSearchMock} placeholder="Search..." value="updated" />);

    expect(inputElement.value).toBe("updated");
  });

  it("should clear the search input when the user disables client-side search and see unfiltered results", () => {
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