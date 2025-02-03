import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { StateInspector } from "./StateInspector";
import { useStateInspectorItems } from "./hooks";
import { filterEntityGroupsBySearchTerm } from "IDE/utils";
import { lightTheme } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";

jest.mock("./hooks");
jest.mock("IDE/utils");

const mockedUseStateInspectorItems = useStateInspectorItems as jest.Mock;
const mockedFilterEntityGroupsBySearchTerm =
  filterEntityGroupsBySearchTerm as jest.Mock;

describe("StateInspector", () => {
  beforeEach(() => {
    mockedFilterEntityGroupsBySearchTerm.mockImplementation(
      (searchTerm, items) =>
        items.filter((item: { group: string }) =>
          item.group.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    );
  });

  it("renders search input and filters items based on search term", () => {
    mockedUseStateInspectorItems.mockReturnValue([
      { title: "Item 1", icon: "icon1", code: { key: "value1" } },
      [
        { group: "Group 1", items: [{ title: "Item 1" }] },
        { group: "Group 2", items: [{ title: "Item 2" }] },
      ],
      { key: "value1" },
    ]);
    render(
      <ThemeProvider theme={lightTheme}>
        <StateInspector />
      </ThemeProvider>,
    );
    const searchInput = screen.getByPlaceholderText("Search entities");

    fireEvent.change(searchInput, { target: { value: "Group 1" } });
    expect(screen.getByText("Group 1")).toBeInTheDocument();
    expect(screen.queryByText("Group 2")).not.toBeInTheDocument();
  });

  it("Calls the onClick of the item", () => {
    const mockOnClick = jest.fn();

    mockedUseStateInspectorItems.mockReturnValue([
      { title: "Item 1", icon: "icon1", code: { key: "value1" } },
      [
        { group: "Group 1", items: [{ title: "Item 1" }] },
        {
          group: "Group 2",
          items: [{ title: "Item 2", onClick: mockOnClick }],
        },
      ],
      { key: "value1" },
    ]);
    render(
      <ThemeProvider theme={lightTheme}>
        <StateInspector />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByText("Item 2"));

    expect(mockOnClick).toHaveBeenCalled();
  });

  it("Renders the selected item details", () => {
    mockedUseStateInspectorItems.mockReturnValue([
      { title: "Item 1", icon: "icon1", code: { key: "value1" } },
      [
        { group: "Group 1", items: [{ title: "Item 1" }] },
        {
          group: "Group 2",
          items: [{ title: "Item 2" }],
        },
      ],
      { key: "Value1" },
    ]);
    render(
      <ThemeProvider theme={lightTheme}>
        <StateInspector />
      </ThemeProvider>,
    );

    expect(
      screen.getByTestId("t--selected-entity-details").textContent,
    ).toContain("Item 1");

    expect(
      screen.getByTestId("t--selected-entity-details").textContent,
    ).toContain("Value1");
  });

  it("does not render selected item details when no item is selected", () => {
    mockedUseStateInspectorItems.mockReturnValue([null, [], null]);
    render(
      <ThemeProvider theme={lightTheme}>
        <StateInspector />
      </ThemeProvider>,
    );
    expect(screen.queryByText("Item 1")).not.toBeInTheDocument();
  });

  it("renders all items when search term is empty", () => {
    mockedUseStateInspectorItems.mockReturnValue([
      { title: "Item 1", icon: "icon1", code: { key: "value1" } },
      [
        { group: "Group 1", items: [{ title: "Item 1" }] },
        {
          group: "Group 2",
          items: [{ title: "Item 2" }],
        },
      ],
      { key: "value1" },
    ]);

    render(
      <ThemeProvider theme={lightTheme}>
        <StateInspector />
      </ThemeProvider>,
    );
    expect(screen.getByText("Group 1")).toBeInTheDocument();
    expect(screen.getByText("Group 2")).toBeInTheDocument();
  });
  it("renders no items when search term does not match any group", () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <StateInspector />
      </ThemeProvider>,
    );
    const searchInput = screen.getByPlaceholderText("Search entities");

    fireEvent.change(searchInput, { target: { value: "Nonexistent Group" } });
    expect(screen.queryByText("Group 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Group 2")).not.toBeInTheDocument();
  });

  it("renders no items when items list is empty", () => {
    mockedUseStateInspectorItems.mockReturnValue([null, [], null]);
    render(
      <ThemeProvider theme={lightTheme}>
        <StateInspector />
      </ThemeProvider>,
    );
    expect(screen.queryByText("Group 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Group 2")).not.toBeInTheDocument();
  });

  it("renders correctly when selected item has no code", () => {
    mockedUseStateInspectorItems.mockReturnValue([
      { title: "Item 1", icon: "icon1", code: null },
      [
        { group: "Group 1", items: [{ title: "Item 1" }] },
        { group: "Group 2", items: [{ title: "Item 2" }] },
      ],
      {},
    ]);
    render(
      <ThemeProvider theme={lightTheme}>
        <StateInspector />
      </ThemeProvider>,
    );

    expect(
      screen.getByTestId("t--selected-entity-details").textContent,
    ).toContain("Item 1");

    expect(
      screen.getByTestId("t--selected-entity-details").textContent,
    ).toContain("0 items");
  });
});
