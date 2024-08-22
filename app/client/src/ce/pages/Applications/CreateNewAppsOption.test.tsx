import React from "react";

import "@testing-library/jest-dom/extend-expect";
import { render, screen } from "@testing-library/react";
import { unitTestBaseMockStore } from "layoutSystems/common/dropTarget/unitTestUtils";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import configureStore from "redux-mock-store";
import { lightTheme } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";

import CreateNewAppsOption from "./CreateNewAppsOption";

const defaultStoreState = {
  ...unitTestBaseMockStore,
  tenant: {
    tenantConfiguration: {},
  },
  entities: {
    ...unitTestBaseMockStore.entities,
    plugins: {
      list: [],
    },
    datasources: {
      list: [],
      mockDatasourceList: [],
    },
  },
  ui: {
    ...unitTestBaseMockStore.ui,
    selectedWorkspace: {
      ...unitTestBaseMockStore.ui.selectedWorkspace,
      applications: [unitTestBaseMockStore.ui.applications.currentApplication],
    },
    debugger: {
      isOpen: false,
    },
    editor: {
      loadingStates: {},
      isProtectedMode: true,
      zoomLevel: 1,
    },
    gitSync: {
      globalGitConfig: {},
      branches: [],
      localGitConfig: {},
      disconnectingGitApp: {},
    },
    users: {
      loadingStates: {},
      list: [],
      users: [],
      error: "",
      currentUser: {},
      featureFlag: {
        data: {},
        isFetched: true,
        overriddenFlags: {},
      },
      productAlert: {
        config: {},
      },
    },
    apiPane: {
      isCreating: false,
      isRunning: {},
      isSaving: {},
      isDeleting: {},
      isDirty: {},
      extraformData: {},
      selectedConfigTabIndex: 0,
      debugger: {
        open: false,
      },
    },
  },
};
const mockStore = configureStore([]);
describe("CreateNewAppsOption", () => {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: any;
  it("Should not render skip button if no application is present", () => {
    store = mockStore(defaultStoreState);

    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <CreateNewAppsOption currentApplicationIdForCreateNewApp="test" />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    const button = screen.queryAllByTestId("t--create-new-app-option-skip");

    // Check that the skip button to be absent in the document
    expect(button).toHaveLength(0);
  });

  it("Should render skip button if application is present", () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <CreateNewAppsOption currentApplicationIdForCreateNewApp="659d2e15d0cbfb0c5e0a7428" />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    const button = screen.queryAllByTestId("t--create-new-app-option-skip");

    // Check that the skip button to be present in the document
    expect(button).toHaveLength(1);
  });

  afterAll(() => {
    jest.clearAllMocks();
    store.clearActions();
  });
});
