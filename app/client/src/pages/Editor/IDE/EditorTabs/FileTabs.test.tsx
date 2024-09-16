import React from "react";
import { fireEvent, render } from "test/testUtils";
import FileTabs from "./FileTabs";
import { EditorState, type EntityItem } from "ee/entities/IDE/constants";
import { PluginType } from "entities/Action";
import { FocusEntity } from "navigation/FocusEntity";
import { sanitizeString } from "utils/URLUtils";

describe("FileTabs", () => {
  const mockTabs: EntityItem[] = [
    { key: "1", title: "File 1", type: PluginType.JS },
    { key: "2", title: "File 2", type: PluginType.JS },
    { key: "3", title: "File 3", type: PluginType.JS },
    { key: "4", title: "File 4", type: PluginType.JS },
  ];

  const mockNavigateToTab = jest.fn();
  const mockOnClose = jest.fn();
  const activeEntity = {
    entity: FocusEntity.API,
    id: "File 1",
    appState: EditorState.EDITOR,
    params: {},
  };

  it("renders tabs correctly", () => {
    const { getByTestId, getByText } = render(
      <FileTabs
        currentEntity={activeEntity}
        navigateToTab={mockNavigateToTab}
        onClose={mockOnClose}
        tabs={mockTabs}
      />,
    );

    // Check if each tab is rendered with correct content
    mockTabs.forEach((tab) => {
      const tabElement = getByTestId(`t--ide-tab-${sanitizeString(tab.title)}`);
      expect(tabElement).not.toBeNull();

      const tabTitleElement = getByText(tab.title);
      expect(tabTitleElement).not.toBeNull();
    });
  });

  it("check tab click", () => {
    const { getByTestId } = render(
      <FileTabs
        currentEntity={activeEntity}
        navigateToTab={mockNavigateToTab}
        onClose={mockOnClose}
        tabs={mockTabs}
      />,
    );
    const tabElement = getByTestId(
      `t--ide-tab-${sanitizeString(mockTabs[0].title)}`,
    );
    fireEvent.click(tabElement);

    expect(mockNavigateToTab).toHaveBeenCalledWith(mockTabs[0]);
  });

  it("check for close click", () => {
    const { getByTestId } = render(
      <FileTabs
        currentEntity={activeEntity}
        navigateToTab={mockNavigateToTab}
        onClose={mockOnClose}
        tabs={mockTabs}
      />,
    );
    const tabElement = getByTestId(
      `t--ide-tab-${sanitizeString(mockTabs[1].title)}`,
    );
    const closeElement = tabElement.querySelector(
      "[data-testid='t--tab-close-btn']",
    ) as HTMLElement;
    fireEvent.click(closeElement);
    expect(mockOnClose).toHaveBeenCalledWith(mockTabs[1].key);
  });
});
