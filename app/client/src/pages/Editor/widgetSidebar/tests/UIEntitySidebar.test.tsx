import React from "react";
import {
  UI_ELEMENT_PANEL_SEARCH_TEXT,
  createMessage,
} from "ee/constants/messages";
import "@testing-library/jest-dom";
import { fireEvent, waitFor } from "@testing-library/react";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import UIEntitySidebar from "../UIEntitySidebar";
import { cards, groupedCards } from "./UIEntitySidebar.fixture";
import { render } from "test/testUtils";
import { getIDETestState } from "test/factories/AppIDEFactoryUtils";

jest.mock("utils/hooks/useFeatureFlag", () => ({
  useFeatureFlag: jest.fn(),
}));

jest.mock("../hooks", () => ({
  //return an object with cards, groupedCards and entityLoading states
  useUIExplorerItems: jest.fn(),
}));

describe("UIEntitySidebar", () => {
  const renderUIEntitySidebar = (
    isActive: boolean,
    focusSearchInput: boolean,
  ) => {
    return render(
      <UIEntitySidebar
        focusSearchInput={focusSearchInput}
        isActive={isActive}
      />,
      {
        initialState: getIDETestState({}),
      },
    );
  };

  const mockUIExplorerItems = (
    items: unknown = {
      //return an object with cards, groupedCards and entityLoading states
      cards,
      groupedCards,
      entityLoading: {},
    },
  ) => {
    /* eslint-disable @typescript-eslint/no-var-requires */
    const { useUIExplorerItems } = require("../hooks");
    useUIExplorerItems.mockImplementation(() => items);
  };

  const mockDragDropBuildingBlocksFF = (val: boolean) => {
    /* eslint-disable @typescript-eslint/no-var-requires */
    const { useFeatureFlag } = require("utils/hooks/useFeatureFlag");
    useFeatureFlag.mockImplementation(() => val);
  };

  it("1. renders the search input", () => {
    mockUIExplorerItems();
    const { getAllByTestId, getByPlaceholderText, getByText } =
      renderUIEntitySidebar(true, false);
    expect(
      getByPlaceholderText(createMessage(UI_ELEMENT_PANEL_SEARCH_TEXT)),
    ).toBeInTheDocument();
    expect(getAllByTestId("ui-entity-tag-group").length).toBeGreaterThan(0);
    expect(getByText(WIDGET_TAGS.SUGGESTED_WIDGETS)).toBeInTheDocument();
  });

  it("2. should handle empty cards array gracefully", async () => {
    mockUIExplorerItems({
      cards: [],
      entityLoading: {},
      groupedCards: {},
    });

    const { getByPlaceholderText, queryByTestId } = renderUIEntitySidebar(
      true,
      true,
    );

    const input = getByPlaceholderText(
      createMessage(UI_ELEMENT_PANEL_SEARCH_TEXT),
    );
    fireEvent.change(input, { target: { value: "example text" } });
    await waitFor(() => {
      expect(queryByTestId("ui-entity-tag-group")).toBeNull();
    });
  });

  it("3. should display grouped widget cards by tags correctly", () => {
    // Mock the necessary dependencies
    mockUIExplorerItems();
    mockDragDropBuildingBlocksFF(false);

    // Render the UIEntitySidebar component
    const { container } = renderUIEntitySidebar(true, true);

    // in the mock data, we have 12 tags
    expect(
      container.getElementsByClassName("widget-tag-collapsible").length,
    ).toBe(12);
  });

  it("4. should filter widget cards based on search input", async () => {
    mockUIExplorerItems();
    mockDragDropBuildingBlocksFF(false);
    const { container, getByPlaceholderText } = renderUIEntitySidebar(
      true,
      true,
    );

    const input = getByPlaceholderText(
      createMessage(UI_ELEMENT_PANEL_SEARCH_TEXT),
    );
    fireEvent.change(input, { target: { value: "table" } });
    await waitFor(() => {
      // one from building blocks and one from normal widgets
      expect(
        container.getElementsByClassName("widget-tag-collapsible").length,
      ).toBe(2);
    });
  });

  it("5. should show `Suggested` when drag drop building blocks feature flag is enabled", () => {
    mockUIExplorerItems();
    mockDragDropBuildingBlocksFF(true);
    const { getByText } = renderUIEntitySidebar(true, true);
    expect(getByText(WIDGET_TAGS.SUGGESTED_WIDGETS)).toBeInTheDocument();
  });
});
