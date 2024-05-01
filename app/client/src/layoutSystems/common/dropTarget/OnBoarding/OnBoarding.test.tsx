import {
  EMPTY_CANVAS,
  STARTER_TEMPLATE_PAGE_LAYOUTS,
  createMessage,
} from "@appsmith/constants/messages";
import { EditorEntityTab, EditorState } from "@appsmith/entities/IDE/constants";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import "jest-styled-components";
import React from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { lightTheme } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";
import Onboarding from ".";
import { unitTestBaseMockStore } from "../unitTestUtils";

jest.mock("pages/Editor/IDE/hooks", () => ({
  useCurrentAppState: () => EditorState.EDITOR,
  useCurrentEditorState: () => ({
    segment: EditorEntityTab.UI,
  }),
}));

describe("OnBoarding", () => {
  const mockStore = configureStore([]);

  const BaseComponentRender = (storeToUse = baseStoreForSpec) => (
    <Provider store={mockStore(storeToUse)}>
      <ThemeProvider theme={lightTheme}>
        <Onboarding />
      </ThemeProvider>
    </Provider>
  );

  it("renders the onboarding component", () => {
    render(BaseComponentRender());
    const onboardingElement = screen.getByText(
      createMessage(EMPTY_CANVAS.DRAG_DROP_WIDGET_HINT),
    );
    expect(onboardingElement).toBeInTheDocument();
  });

  it("renders the onboarding component when drag and drop is enabled", () => {
    render(BaseComponentRender(storeToUseWithDragDropBuildingBlocksEnabled));
    const title = screen.getByText(
      createMessage(EMPTY_CANVAS.DRAG_DROP_BUILDING_BLOCK_HINT.TITLE),
    );
    expect(title).toBeInTheDocument();
    const description = screen.getByText(
      createMessage(EMPTY_CANVAS.DRAG_DROP_BUILDING_BLOCK_HINT.DESCRIPTION),
    );
    expect(description).toBeInTheDocument();
  });

  it("renders the onboarding component when starter buidling blocks on canvas is enabled", () => {
    render(BaseComponentRender(storeToUseWithStarterBuildingBlocksEnabled));
    const title = screen.getByText(
      createMessage(STARTER_TEMPLATE_PAGE_LAYOUTS.header),
    );
    expect(title).toBeInTheDocument();
  });

  // Add more test cases as needed
});

const baseStoreForSpec = {
  ...unitTestBaseMockStore,
  ui: {
    ...unitTestBaseMockStore.ui,
    buildingBlocks: {
      isDraggingBuildingBlocksToCanvas: false,
    },
    users: {
      featureFlag: {
        data: {
          ab_show_templates_instead_of_blank_canvas_enabled: false,
          release_drag_drop_building_blocks_enabled: false,
        },
      },
    },
  },
};

const storeToUseWithDragDropBuildingBlocksEnabled = {
  ...baseStoreForSpec,
  ui: {
    ...baseStoreForSpec.ui,
    users: {
      ...baseStoreForSpec.ui.users,
      featureFlag: {
        ...baseStoreForSpec.ui.users.featureFlag,
        data: {
          ab_show_templates_instead_of_blank_canvas_enabled: false,
          release_drag_drop_building_blocks_enabled: true,
        },
      },
    },
  },
};

const storeToUseWithStarterBuildingBlocksEnabled = {
  ...baseStoreForSpec,
  ui: {
    ...baseStoreForSpec.ui,
    users: {
      ...baseStoreForSpec.ui.users,
      featureFlag: {
        ...baseStoreForSpec.ui.users.featureFlag,
        data: {
          ab_show_templates_instead_of_blank_canvas_enabled: true,
          release_drag_drop_building_blocks_enabled: false,
        },
      },
    },
  },
};
