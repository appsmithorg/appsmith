import React from "react";
import { render } from "@testing-library/react";
import ApiResponseView from "components/editorComponents/ApiResponseView";
import configureStore from "redux-mock-store";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import { unitTestBaseMockStore } from "layoutSystems/common/dropTarget/unitTestUtils";
import { lightTheme } from "selectors/themeSelectors";
import { BrowserRouter as Router } from "react-router-dom";
import { EditorViewMode } from "ee/entities/IDE/constants";
import "@testing-library/jest-dom/extend-expect";
import { APIFactory } from "test/factories/Actions/API";
import { noop } from "lodash";

jest.mock("components/editorComponents/EntityBottomTabs", () => ({
  __esModule: true,
  default: () => <div />,
}));

const mockStore = configureStore([]);

const storeState = {
  ...unitTestBaseMockStore,
  evaluations: {
    tree: {},
  },
  ui: {
    ...unitTestBaseMockStore.ui,
    gitSync: {
      branches: [],
      fetchingBranches: false,
      isDeploying: false,
      protectedBranchesLoading: false,
      protectedBranches: [],
    },
    editor: {
      isPreviewMode: false,
    },
    users: {
      featureFlag: {
        data: {},
        overriddenFlags: {},
      },
    },
    ide: {
      view: EditorViewMode.FullScreen,
    },
    debugger: {
      context: {
        errorCount: 0,
      },
    },
    pluginActionEditor: {
      debugger: {
        open: true,
        responseTabHeight: 200,
        selectedTab: "response",
      },
    },
  },
};

describe("ApiResponseView", () => {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: any;

  beforeEach(() => {
    store = mockStore(storeState);
  });

  it("the container should have class select-text to enable the selection of text for user", () => {
    const Api1 = APIFactory.build({
      id: "api_id",
      baseId: "api_base_id",
      pageId: "pageId",
    });
    const { container } = render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <ApiResponseView
              currentActionConfig={Api1}
              disabled={false}
              isRunning={false}
              onRunClick={noop}
            />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    expect(
      container
        .querySelector(".t--api-bottom-pane-container")
        ?.classList.contains("select-text"),
    ).toBe(true);
  });
});
