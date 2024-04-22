import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "jest-styled-components";
import configureStore from "redux-mock-store";
import { Provider } from "react-redux";
import StarterBuildingBlocks from "./index";
import {
  STARTER_TEMPLATE_PAGE_LAYOUTS,
  createMessage,
} from "@appsmith/constants/messages";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import { STARTER_BUILDING_BLOCKS } from "constants/TemplatesConstants";
import { Colors } from "constants/Colors";
import { unitTestBaseMockStore } from "../unitTestUtils";

jest.mock("actions/templateActions", () => ({
  importStarterBuildingBlockIntoApplication: jest.fn(),
  showTemplatesModal: jest.fn(),
}));
jest.mock("@appsmith/utils/AnalyticsUtil", () => ({
  logEvent: jest.fn(),
}));

const mockStore = configureStore([]);

describe("<StarterBuildingBlocks />", () => {
  let store: any;

  beforeEach(() => {
    store = mockStore(unitTestBaseMockStore);
  });

  const BaseComponentRender = () => (
    <Provider store={store}>
      <ThemeProvider theme={lightTheme}>
        <StarterBuildingBlocks />
      </ThemeProvider>
    </Provider>
  );

  it("renders the component correctly", () => {
    render(<BaseComponentRender />);
    expect(
      screen.getByText(createMessage(STARTER_TEMPLATE_PAGE_LAYOUTS.header)),
    ).toBeInTheDocument();
  });

  it("handles container hover correctly", async () => {
    render(<BaseComponentRender />);
    const container = screen.getByTestId("t--canvas-building-block-container");
    expect(container).toHaveStyleRule("background-color", Colors.WHITE, {
      modifier: ":hover",
    });
    expect(container).toHaveStyleRule(
      "box-shadow",
      "0px 1px 20px 0px rgba(76,86,100,0.11)",
      {
        modifier: ":hover",
      },
    );
  });

  it("shows loading screen while importing", () => {
    store = mockStore({
      ...unitTestBaseMockStore,
      ui: {
        selectedWorkspace: {
          workspace: unitTestBaseMockStore.ui.workspaces.currentWorkspace,
        },
        applications: {
          isFetchingApplications: false,
        },
        templates: {
          isImportingStarterBuildingBlockToApp: true,
          filters: {
            functions: ["All"],
          },
          allFilters: {},
          templateSearchQuery: "",
          templates: [],
        },
      },
    });
    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <StarterBuildingBlocks />
        </ThemeProvider>
      </Provider>,
    );
    expect(
      screen.getByText(
        createMessage(STARTER_TEMPLATE_PAGE_LAYOUTS.importLoadingText),
      ),
    ).toBeInTheDocument();
  });

  it("handles starter block hover correctly", async () => {
    render(<BaseComponentRender />);
    // Simulate mouse enter on the TemplateLayoutFrame
    fireEvent.mouseEnter(
      screen.getByText(
        STARTER_BUILDING_BLOCKS.STARTER_BUILDING_BLOCKS_TEMPLATES[0].title,
      ),
    );
    await waitFor(() => {
      const templateLayoutFrame = screen.getByTestId(
        "t--canvas-building-block-frame",
      );
      expect(templateLayoutFrame).toHaveStyleRule(
        "background",
        `url(${STARTER_BUILDING_BLOCKS.STARTER_BUILDING_BLOCKS_TEMPLATES[0].screenshot}) no-repeat`,
        {
          modifier: "::before",
        },
      );
    });
  });
});
