import { EMPTY_CANVAS_HINTS, createMessage } from "ee/constants/messages";
import { EditorEntityTab, EditorState } from "ee/entities/IDE/constants";
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
  useCurrentAppState: jest.fn().mockReturnValue(EditorState.EDITOR),
  useCurrentEditorState: jest.fn(),
}));

const mockStore = configureStore([]);
const mockUseCurrentEditorStatePerTestCase = (segment: EditorEntityTab) => {
  /* eslint-disable @typescript-eslint/no-var-requires */
  const { useCurrentEditorState } = require("pages/Editor/IDE/hooks");
  useCurrentEditorState.mockImplementation(() => ({
    segment,
  }));
};

jest.mock("ee/utils/airgapHelpers", () => ({
  isAirgapped: jest.fn(),
}));

const mockIsAirGapped = (val: boolean) => {
  /* eslint-disable @typescript-eslint/no-var-requires */
  const { isAirgapped } = require("ee/utils/airgapHelpers");
  isAirgapped.mockImplementation(() => val);
};

const BaseComponentRender = (storeToUse = baseStoreForSpec) => (
  <Provider store={mockStore(storeToUse)}>
    <ThemeProvider theme={lightTheme}>
      <Onboarding />
    </ThemeProvider>
  </Provider>
);

describe("OnBoarding - Non-AirGap Edition", () => {
  it("1. renders the onboarding component with starter building blocks on canvas", () => {
    mockUseCurrentEditorStatePerTestCase(EditorEntityTab.UI);
    render(BaseComponentRender(storeToUseWithStarterBuildingBlocksEnabled));
    const title = screen.getByText(
      createMessage(EMPTY_CANVAS_HINTS.DRAG_DROP_WIDGET_HINT),
    );
    expect(title).toBeInTheDocument();
  });

  it("2. does not render onboarding component when in preview mode", () => {
    mockUseCurrentEditorStatePerTestCase(EditorEntityTab.UI);
    const previewModeStore = {
      ...storeToUseWithDragDropBuildingBlocksEnabled,
      ui: {
        ...storeToUseWithDragDropBuildingBlocksEnabled.ui,
        gitSync: {
          protectedBranches: false,
        },
        editor: {
          isPreviewMode: true,
        },
      },
    };
    render(BaseComponentRender(previewModeStore));

    const buildingBlockOnboardingElement = screen.queryByText(
      createMessage(EMPTY_CANVAS_HINTS.DRAG_DROP_BUILDING_BLOCK_HINT.TITLE),
    );
    const onboardingElement = screen.queryByText(
      createMessage(EMPTY_CANVAS_HINTS.DRAG_DROP_WIDGET_HINT),
    );
    expect(buildingBlockOnboardingElement).not.toBeInTheDocument();
    expect(onboardingElement).toBeInTheDocument();
  });

  it("3. does not render onboarding component when in preview mode", () => {
    mockUseCurrentEditorStatePerTestCase(EditorEntityTab.UI);
    const previewModeStore = {
      ...storeToUseWithDragDropBuildingBlocksEnabled,
      ui: {
        ...storeToUseWithDragDropBuildingBlocksEnabled.ui,
        gitSync: {
          protectedBranches: false,
        },
        editor: {
          isPreviewMode: true,
        },
      },
    };
    render(BaseComponentRender(previewModeStore));

    const buildingBlockOnboardingElement = screen.queryByText(
      createMessage(EMPTY_CANVAS_HINTS.DRAG_DROP_BUILDING_BLOCK_HINT.TITLE),
    );
    const onboardingElement = screen.queryByText(
      createMessage(EMPTY_CANVAS_HINTS.DRAG_DROP_WIDGET_HINT),
    );
    expect(buildingBlockOnboardingElement).not.toBeInTheDocument();
    expect(onboardingElement).toBeInTheDocument();
  });
});

describe("OnBoarding - AirGap Edition", () => {
  beforeEach(() => mockIsAirGapped(true));

  const assertOnboardingElement = () => {
    const onboardingElement = screen.getByText(
      createMessage(EMPTY_CANVAS_HINTS.DRAG_DROP_WIDGET_HINT),
    );
    expect(onboardingElement).toBeInTheDocument();
  };

  it("1. [Airgap] renders the default onboarding component", () => {
    mockUseCurrentEditorStatePerTestCase(EditorEntityTab.UI);
    render(BaseComponentRender());
    assertOnboardingElement();
  });

  it("2. [Airgap] renders the default onboarding component even when on mobile layout", () => {
    mockUseCurrentEditorStatePerTestCase(EditorEntityTab.UI);
    render(BaseComponentRender(storeToUseWithMobileCanvas));
    assertOnboardingElement();
  });

  it("3. [Airgap] renders the onboarding component when drag and drop is enabled", () => {
    mockUseCurrentEditorStatePerTestCase(EditorEntityTab.UI);
    render(BaseComponentRender(storeToUseWithDragDropBuildingBlocksEnabled));
    assertOnboardingElement();
  });

  it("4. [Airgap] renders the onboarding component when drag and drop is enabled, with JS segment enabled", () => {
    mockUseCurrentEditorStatePerTestCase(EditorEntityTab.JS);
    render(BaseComponentRender(storeToUseWithDragDropBuildingBlocksEnabled));
    assertOnboardingElement();
  });

  it("5. [Airgap] renders the onboarding component when drag and drop is enabled, with Queries segment enabled", () => {
    mockUseCurrentEditorStatePerTestCase(EditorEntityTab.QUERIES);
    render(BaseComponentRender(storeToUseWithDragDropBuildingBlocksEnabled));
    assertOnboardingElement();
  });

  it("6. [Airgap] does not render onboarding component when in preview mode", () => {
    mockUseCurrentEditorStatePerTestCase(EditorEntityTab.UI);
    const previewModeStore = {
      ...storeToUseWithDragDropBuildingBlocksEnabled,
      ui: {
        ...storeToUseWithDragDropBuildingBlocksEnabled.ui,
        gitSync: {
          protectedBranches: true,
        },
        editor: {
          isPreviewMode: true,
        },
      },
    };
    render(BaseComponentRender(previewModeStore));

    const buildingBlockOnboardingElement = screen.queryByText(
      createMessage(EMPTY_CANVAS_HINTS.DRAG_DROP_BUILDING_BLOCK_HINT.TITLE),
    );
    const onboardingElement = screen.queryByText(
      createMessage(EMPTY_CANVAS_HINTS.DRAG_DROP_WIDGET_HINT),
    );
    expect(buildingBlockOnboardingElement).not.toBeInTheDocument();
    expect(onboardingElement).toBeInTheDocument();
  });
});

const baseStoreForSpec = {
  ...unitTestBaseMockStore,
  ui: {
    ...unitTestBaseMockStore.ui,
    buildingBlocks: {
      isDraggingBuildingBlocksToCanvas: false,
    },
    gitSync: {
      protectedBranches: false,
    },
    editor: {
      isPreviewMode: false,
    },
    users: {
      featureFlag: {
        data: {
          release_drag_drop_building_blocks_enabled: false,
        },
      },
    },
  },
};

const storeToUseWithMobileCanvas = {
  ...baseStoreForSpec,
  ui: {
    ...baseStoreForSpec.ui,
    applications: {
      ...baseStoreForSpec.ui.applications,
      currentApplication: {
        ...baseStoreForSpec.ui.applications.currentApplication,
        appLayout: { type: "MOBILE" },
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
          release_drag_drop_building_blocks_enabled: false,
        },
      },
    },
  },
};
