import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { SearchableFilesList } from "./SearchableFilesList";
import {
  EditorEntityTab,
  type EntityItem,
} from "@appsmith/entities/IDE/constants";
import { PluginType } from "entities/Action";

// Mock the useCurrentEditorState hook
jest.mock("../hooks", () => ({
  useCurrentEditorState: jest.fn(() => ({ segment: EditorEntityTab.JS })),
}));

describe("SearchableFilesList", () => {
  const allItems: EntityItem[] = [
    { key: "1", title: "File 1", type: PluginType.JS },
    { key: "2", title: "File 2", type: PluginType.JS },
    { key: "3", title: "File 3", type: PluginType.JS },
    { key: "4", title: "File 4", type: PluginType.JS },
  ];
  const openTabs: EntityItem[] = [
    { key: "1", title: "File 1", type: PluginType.JS },
    { key: "3", title: "File 3", type: PluginType.JS },
  ];
  const triggerButtonTestId = "t--files-list-trigger";
  const searchInputTestId = "t--files-list-search-input";

  const navigateToTabMock = jest.fn();

  it("renders without crashing", () => {
    render(
      <SearchableFilesList
        allItems={allItems}
        navigateToTab={navigateToTabMock}
        openTabs={openTabs}
      />,
    );
  });

  it("renders menu items correctly", () => {
    const { getByTestId, getByText } = render(
      <SearchableFilesList
        allItems={allItems}
        navigateToTab={navigateToTabMock}
        openTabs={[]}
      />,
    );

    const triggerButton = getByTestId(triggerButtonTestId);
    fireEvent.click(triggerButton);

    // Check if all items are rendered in the menu
    expect(getByText("File 1")).toBeTruthy();
    expect(getByText("File 2")).toBeTruthy();
    expect(getByText("File 3")).toBeTruthy();
    expect(getByText("File 4")).toBeTruthy();
  });

  it("calls navigateToTab on closed item when a menu item is clicked", () => {
    const { getAllByText, getByTestId } = render(
      <SearchableFilesList
        allItems={allItems}
        navigateToTab={navigateToTabMock}
        openTabs={openTabs}
      />,
    );

    const triggerButton = getByTestId(triggerButtonTestId);
    fireEvent.click(triggerButton);

    // Click on a opened group menu item
    const allByText = getAllByText("File 1");
    fireEvent.click(allByText[0]);

    // Check if navigateToTabMock was called with the correct item
    expect(navigateToTabMock).toHaveBeenCalledWith(openTabs[0]);
  });

  it("calls navigateToTab on a open item when a menu item is clicked", () => {
    const { getAllByText, getByTestId } = render(
      <SearchableFilesList
        allItems={allItems}
        navigateToTab={navigateToTabMock}
        openTabs={openTabs}
      />,
    );

    const triggerButton = getByTestId(triggerButtonTestId);
    fireEvent.click(triggerButton);

    // Click on a opened group menu item
    const allByText = getAllByText("File 4");
    fireEvent.click(allByText[0]);

    // Check if navigateToTabMock was called with the correct item
    expect(navigateToTabMock).toHaveBeenCalledWith(allItems[3]);
  });

  it("filters files correctly based on search input", () => {
    const { getByTestId, getByText, queryByText } = render(
      <SearchableFilesList
        allItems={allItems}
        navigateToTab={navigateToTabMock}
        openTabs={openTabs}
      />,
    );

    const triggerButton = getByTestId(triggerButtonTestId);
    fireEvent.click(triggerButton);

    const searchInput = getByTestId(searchInputTestId) as HTMLInputElement;

    // Type in the search input to filter files
    fireEvent.change(searchInput, { target: { value: "File 1" } });

    expect(searchInput.value).toBe("File 1");

    // Check if only the filtered file is rendered
    expect(getByText("File 1")).toBeTruthy();
    expect(queryByText("File 2")).not.toBeTruthy();
  });
});
